import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) upsertUser(session.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) upsertUser(session.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// Ensure user exists in our users table after login
async function upsertUser(authUser) {
  try {
    await supabase.from('users').upsert(
      { id: authUser.id, email: authUser.email },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  } catch {
    // Table may not exist yet — handled at Checkpoint 3 when DB is set up
  }
}
