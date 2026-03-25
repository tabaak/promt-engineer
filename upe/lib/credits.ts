import { supabase } from './supabase';

/**
 * Ensure a user row exists in the Supabase `users` table.
 * If the user is new, they get 3 credits (DB default).
 * If they already exist, this is a no-op (credits preserved).
 */
export async function ensureUser(email: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    console.error('ensureUser error:', error);
  }
}

/**
 * Get the current credit count for a user.
 */
export async function getCredits(email: string): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('credits')
    .eq('email', email)
    .single();

  if (error || !data) {
    console.error('getCredits error:', error);
    return 0;
  }
  return data.credits;
}

/**
 * Deduct 1 credit from a user. Returns true if successful, false if no credits left.
 */
export async function deductCredit(email: string): Promise<boolean> {
  const { error } = await supabase.rpc('decrement_credits', { user_email: email });

  if (error) {
    console.error('deductCredit error:', error);
    return false;
  }
  return true;
}
