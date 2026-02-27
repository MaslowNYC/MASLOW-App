import { supabase } from '../../lib/supabase';
import { checkRateLimit, incrementUsage, calculateCost, RateLimitStatus } from '../utils/rateLimiter';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationContext {
  messages: ChatMessage[];
  userId: string;
}

export interface ConciergeResponse {
  success: boolean;
  message?: string;
  error?: string;
  rateLimitStatus?: RateLimitStatus;
  budgetExceeded?: boolean;
}

const SYSTEM_PROMPT = `You are Maslow Concierge, an expert assistant for Maslow - a luxury wellness and self-care company in New York City that provides private suites for personal grooming, relaxation, and self-renewal.

ABOUT MASLOW:
- Maslow offers private luxury suites in NYC for members to use for personal care, grooming, and wellness
- Named after Abraham Maslow, the psychologist who created Maslow's Hierarchy of Needs
- The company embodies the philosophy that self-care is foundational to achieving one's potential
- Members book suites through the Maslow app and can purchase credits for visits

YOUR EXPERTISE:
1. Maslow company - memberships, locations, services, how to use the app
2. Abraham Maslow - his psychology, hierarchy of needs, philosophy on self-actualization
3. New York City - restaurants, events, culture, neighborhoods, hidden gems

RESPONSE GUIDELINES:
- Detect the user's language and respond in the SAME language
- Adapt your tone to cultural context (formal for some cultures, casual for others)
- Keep responses concise and helpful (under 300 words typically)
- For NYC recommendations, ONLY cite trusted sources: NYT, Eater, Time Out, Michelin Guide, The Infatuation
- NEVER give personal rankings or opinions - state facts or cite what critics/publications say
- If asked something outside NYC/Maslow scope, politely redirect: "I specialize in NYC and Maslow - what can I help you with about the city or your membership?"

KNOWLEDGE PRIORITY:
1. First, use your knowledge about Maslow
2. For NYC questions, provide helpful information and cite sources when making recommendations
3. For Abraham Maslow questions, share accurate psychological/philosophical information

Be warm, professional, and genuinely helpful. You're like a knowledgeable NYC local who happens to work at Maslow.`;

// Query knowledge base for relevant context
async function queryKnowledgeBase(query: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('concierge_knowledge')
      .select('category, content, source')
      .textSearch('content', query.split(' ').slice(0, 5).join(' | '), {
        type: 'websearch',
        config: 'english',
      })
      .limit(3);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data
      .map((item) => `[${item.category}]: ${item.content}${item.source ? ` (Source: ${item.source})` : ''}`)
      .join('\n\n');
  } catch (error) {
    console.error('Knowledge base query error:', error);
    return null;
  }
}

// Load conversation history
export async function loadConversationHistory(userId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('concierge_chats')
      .select('messages')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return [];
    }

    // Return last 10 messages for context
    const messages = (data.messages as ChatMessage[]) || [];
    return messages.slice(-10);
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}

// Save conversation
async function saveConversation(userId: string, messages: ChatMessage[]): Promise<void> {
  try {
    // Check if conversation exists for today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('concierge_chats')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today)
      .single();

    if (existing) {
      await supabase
        .from('concierge_chats')
        .update({ messages })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('concierge_chats')
        .insert({
          user_id: userId,
          messages,
        });
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

// Main chat function
export async function sendMessage(
  userId: string,
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<ConciergeResponse & { assistantMessage?: ChatMessage }> {
  // Check rate limits first
  const rateLimitStatus = await checkRateLimit(userId);

  if (!rateLimitStatus.canSend) {
    return {
      success: false,
      error: rateLimitStatus.message || 'Rate limit exceeded',
      rateLimitStatus,
    };
  }

  try {
    // Query knowledge base for context
    const knowledgeContext = await queryKnowledgeBase(userMessage);

    // Build messages for API
    const systemMessage = knowledgeContext
      ? `${SYSTEM_PROMPT}\n\nRELEVANT KNOWLEDGE:\n${knowledgeContext}`
      : SYSTEM_PROMPT;

    // Format conversation history for API
    const apiMessages = conversationHistory.slice(-8).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current user message
    apiMessages.push({
      role: 'user' as const,
      content: userMessage,
    });

    // Call Claude API via Edge Function
    const { data, error } = await supabase.functions.invoke('concierge-chat', {
      body: {
        systemPrompt: systemMessage,
        messages: apiMessages,
        maxTokens: 2000,
      },
    });

    if (error) {
      console.error('Concierge API error:', error);
      return {
        success: false,
        error: "I'm taking a quick break right now. Please try again in a moment, or contact support@maslow.nyc for assistance.",
        rateLimitStatus,
      };
    }

    // Check for error in response body (from Edge Function)
    if (data?.error) {
      console.error('Concierge response error:', data.error);

      // Handle budget exceeded - use the message from the server
      if (data.budget_exceeded) {
        return {
          success: false,
          error: data.message || "Our AI Concierge has reached its monthly capacity and will return on the 1st of next month. For immediate assistance, please email hello@maslow.nyc 💙",
          budgetExceeded: true,
          rateLimitStatus,
        };
      }

      // Handle rate limit exceeded
      if (data.limitReached) {
        return {
          success: false,
          error: data.error,
          rateLimitStatus: {
            canSend: false,
            dailyRemaining: data.remainingChats || 0,
            message: data.error,
          },
        };
      }

      return {
        success: false,
        error: data.message || "I'm having trouble connecting right now. Please try again shortly.",
        rateLimitStatus,
      };
    }

    // Calculate and track cost
    const inputTokens = data.usage?.input_tokens || 500;
    const outputTokens = data.usage?.output_tokens || 300;
    const cost = calculateCost(inputTokens, outputTokens);
    await incrementUsage(userId, cost);

    // Create assistant message
    const assistantMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: data.content || 'I apologize, but I was unable to generate a response. Please try again.',
      timestamp: new Date().toISOString(),
    };

    // Create user message object
    const userMessageObj: ChatMessage = {
      id: `user-${Date.now() - 1}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    // Save updated conversation
    const updatedMessages = [...conversationHistory, userMessageObj, assistantMessage];
    await saveConversation(userId, updatedMessages);

    // Get updated rate limit status
    const updatedRateLimitStatus = await checkRateLimit(userId);

    return {
      success: true,
      assistantMessage,
      rateLimitStatus: updatedRateLimitStatus,
    };
  } catch (error) {
    console.error('Concierge error:', error);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
      rateLimitStatus,
    };
  }
}

// Clear conversation history
export async function clearConversation(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('concierge_chats')
      .delete()
      .eq('user_id', userId)
      .gte('created_at', today);
  } catch (error) {
    console.error('Error clearing conversation:', error);
  }
}
