import { supabase } from '../../lib/supabase';

export interface RateLimitStatus {
  canSend: boolean;
  dailyRemaining: number;
  hourlyRemaining: number;
  resetTime: string | null;
  message: string | null;
}

export interface BudgetStatus {
  isActive: boolean;
  monthlySpent: number;
  monthlyLimit: number;
  percentUsed: number;
}

const DAILY_LIMIT = 10;
const HOURLY_LIMIT = 5;
const MONTHLY_BUDGET_LIMIT = 500;
const BUDGET_WARNING_THRESHOLD = 400;

// Get current month string (e.g., "2026-02")
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Get EST midnight for reset time display
function getESTMidnight(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Check if date is today (EST)
function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const estOptions = { timeZone: 'America/New_York' };
  const dateEST = date.toLocaleDateString('en-US', estOptions);
  const nowEST = now.toLocaleDateString('en-US', estOptions);
  return dateEST === nowEST;
}

// Check if timestamp is within the last hour
function isWithinLastHour(timestamp: string): boolean {
  const time = new Date(timestamp);
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  return time > hourAgo;
}

export async function checkRateLimit(userId: string): Promise<RateLimitStatus> {
  try {
    // First check global budget
    const budgetStatus = await checkBudget();
    if (!budgetStatus.isActive) {
      return {
        canSend: false,
        dailyRemaining: 0,
        hourlyRemaining: 0,
        resetTime: null,
        message: 'Concierge is temporarily unavailable. Please try again later.',
      };
    }

    // Get or create user usage record
    let { data: usage, error } = await supabase
      .from('concierge_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Record doesn't exist, create it
      const { data: newUsage, error: insertError } = await supabase
        .from('concierge_usage')
        .insert({
          user_id: userId,
          message_count_today: 0,
          hour_count: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
          last_hour_reset: new Date().toISOString(),
          total_cost: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating usage record:', insertError);
        return {
          canSend: false,
          dailyRemaining: 0,
          hourlyRemaining: 0,
          resetTime: null,
          message: 'Unable to check usage. Please try again.',
        };
      }
      usage = newUsage;
    }

    if (!usage) {
      return {
        canSend: false,
        dailyRemaining: 0,
        hourlyRemaining: 0,
        resetTime: null,
        message: 'Unable to check usage. Please try again.',
      };
    }

    // Check if we need to reset daily count
    let dailyCount = usage.message_count_today;
    let hourCount = usage.hour_count;

    if (!isToday(usage.last_reset_date)) {
      // Reset daily count
      dailyCount = 0;
      hourCount = 0;
      await supabase
        .from('concierge_usage')
        .update({
          message_count_today: 0,
          hour_count: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
          last_hour_reset: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else if (!isWithinLastHour(usage.last_hour_reset)) {
      // Reset hourly count
      hourCount = 0;
      await supabase
        .from('concierge_usage')
        .update({
          hour_count: 0,
          last_hour_reset: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyCount);
    const hourlyRemaining = Math.max(0, HOURLY_LIMIT - hourCount);

    // Check limits
    if (dailyCount >= DAILY_LIMIT) {
      return {
        canSend: false,
        dailyRemaining: 0,
        hourlyRemaining,
        resetTime: getESTMidnight(),
        message: `You've used your ${DAILY_LIMIT} daily chats. Resets at midnight EST. Need help? support@maslow.nyc`,
      };
    }

    if (hourCount >= HOURLY_LIMIT) {
      return {
        canSend: false,
        dailyRemaining,
        hourlyRemaining: 0,
        resetTime: null,
        message: `You've reached your hourly limit (${HOURLY_LIMIT} messages). Please wait a few minutes.`,
      };
    }

    return {
      canSend: true,
      dailyRemaining,
      hourlyRemaining,
      resetTime: null,
      message: null,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      canSend: false,
      dailyRemaining: 0,
      hourlyRemaining: 0,
      resetTime: null,
      message: 'Unable to check usage. Please try again.',
    };
  }
}

export async function incrementUsage(userId: string, cost: number): Promise<void> {
  try {
    // Increment user usage
    const { data: usage } = await supabase
      .from('concierge_usage')
      .select('message_count_today, hour_count, total_cost')
      .eq('user_id', userId)
      .single();

    if (usage) {
      await supabase
        .from('concierge_usage')
        .update({
          message_count_today: usage.message_count_today + 1,
          hour_count: usage.hour_count + 1,
          total_cost: (usage.total_cost || 0) + cost,
        })
        .eq('user_id', userId);
    }

    // Update monthly budget
    const currentMonth = getCurrentMonth();
    const { data: budget } = await supabase
      .from('concierge_budget')
      .select('*')
      .eq('month', currentMonth)
      .single();

    if (budget) {
      const newCost = (budget.total_cost || 0) + cost;
      const newCount = (budget.message_count || 0) + 1;

      await supabase
        .from('concierge_budget')
        .update({
          total_cost: newCost,
          message_count: newCount,
          is_active: newCost < MONTHLY_BUDGET_LIMIT,
        })
        .eq('month', currentMonth);

      // Check for warning threshold
      if (newCost >= BUDGET_WARNING_THRESHOLD && budget.total_cost < BUDGET_WARNING_THRESHOLD) {
        console.warn(`BUDGET WARNING: Concierge spending at $${newCost.toFixed(2)} (${((newCost / MONTHLY_BUDGET_LIMIT) * 100).toFixed(1)}% of monthly limit)`);
        // TODO: Send admin alert
      }
    } else {
      // Create new month record
      await supabase
        .from('concierge_budget')
        .insert({
          month: currentMonth,
          total_cost: cost,
          message_count: 1,
          is_active: true,
        });
    }
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

export async function checkBudget(): Promise<BudgetStatus> {
  try {
    const currentMonth = getCurrentMonth();
    const { data: budget } = await supabase
      .from('concierge_budget')
      .select('*')
      .eq('month', currentMonth)
      .single();

    if (!budget) {
      return {
        isActive: true,
        monthlySpent: 0,
        monthlyLimit: MONTHLY_BUDGET_LIMIT,
        percentUsed: 0,
      };
    }

    return {
      isActive: budget.is_active && budget.total_cost < MONTHLY_BUDGET_LIMIT,
      monthlySpent: budget.total_cost || 0,
      monthlyLimit: MONTHLY_BUDGET_LIMIT,
      percentUsed: ((budget.total_cost || 0) / MONTHLY_BUDGET_LIMIT) * 100,
    };
  } catch (error) {
    console.error('Budget check error:', error);
    return {
      isActive: true,
      monthlySpent: 0,
      monthlyLimit: MONTHLY_BUDGET_LIMIT,
      percentUsed: 0,
    };
  }
}

// Calculate approximate cost for Claude API call
export function calculateCost(inputTokens: number, outputTokens: number): number {
  // Claude 3 Haiku pricing (as of 2024): $0.25/1M input, $1.25/1M output
  // Using conservative estimates
  const inputCost = (inputTokens / 1000000) * 0.25;
  const outputCost = (outputTokens / 1000000) * 1.25;
  return inputCost + outputCost;
}
