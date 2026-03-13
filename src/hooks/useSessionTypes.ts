import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export interface SessionType {
  id: number
  name: string
  duration_minutes: number
  price_cents: number
  pass_cost: number
  cash_price: number
  sample_limit: number
  is_active: boolean
  sort_order: number
}

export function useSessionTypes() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSessionTypes = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('session_types')
          .select('id, name, duration_minutes, price_cents, pass_cost, cash_price, sample_limit, is_active, sort_order')
          .eq('is_active', true)
          .order('sort_order')

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setSessionTypes(data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session types')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionTypes()
  }, [])

  return { sessionTypes, loading, error }
}
