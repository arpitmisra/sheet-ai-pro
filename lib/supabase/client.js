import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign up with email and password
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    },
  });
  return { data, error };
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
  return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Create a new sheet
 */
export async function createSheet(userId, title = 'Untitled Sheet') {
  const { data, error } = await supabase
    .from('sheets')
    .insert({
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get all sheets for a user
 */
export async function getUserSheets(userId) {
  const { data, error } = await supabase
    .from('sheets')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return { data, error };
}

/**
 * Get a single sheet by ID
 */
export async function getSheet(sheetId) {
  const { data, error } = await supabase
    .from('sheets')
    .select('*')
    .eq('id', sheetId)
    .single();

  return { data, error };
}

/**
 * Update sheet title
 */
export async function updateSheetTitle(sheetId, title) {
  const { data, error } = await supabase
    .from('sheets')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', sheetId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get all cells for a sheet
 */
export async function getSheetCells(sheetId) {
  const { data, error } = await supabase
    .from('cells')
    .select('*')
    .eq('sheet_id', sheetId);

  return { data, error };
}

/**
 * Update or create a cell
 */
export async function upsertCell(sheetId, row, col, value, formula = null) {
  const { data, error } = await supabase
    .from('cells')
    .upsert(
      {
        sheet_id: sheetId,
        row,
        col,
        value,
        formula,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'sheet_id,row,col',
      }
    )
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a sheet
 */
export async function deleteSheet(sheetId) {
  const { error } = await supabase
    .from('sheets')
    .delete()
    .eq('id', sheetId);

  return { error };
}
