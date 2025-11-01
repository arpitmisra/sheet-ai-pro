import { supabase } from './client';

/**
 * Add collaborator to a sheet
 */
export async function addCollaborator(sheetId, email, role = 'editor') {
  try {
    // First, find user by email from auth.users
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // For now, we can't search auth.users by email directly
    // The user needs to provide the user_id or we need profiles table
    // Simplified: just return error for now
    return { 
      data: null, 
      error: { message: 'User lookup not yet implemented. Share by user ID instead.' } 
    };

    // TODO: Implement user lookup when profiles table is added
    // or use Supabase Admin API to search users by email
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get all collaborators for a sheet
 */
export async function getSheetCollaborators(sheetId) {
  const { data, error } = await supabase
    .from('sheet_collaborators')
    .select(`
      *,
      user:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq('sheet_id', sheetId)
    .order('role', { ascending: false });

  return { data, error };
}

/**
 * Update collaborator role
 */
export async function updateCollaboratorRole(collaboratorId, role) {
  const { data, error } = await supabase
    .from('sheet_collaborators')
    .update({ role })
    .eq('id', collaboratorId)
    .select()
    .single();

  return { data, error };
}

/**
 * Remove collaborator
 */
export async function removeCollaborator(collaboratorId) {
  const { error } = await supabase
    .from('sheet_collaborators')
    .delete()
    .eq('id', collaboratorId);

  return { error };
}

/**
 * Update user presence (online/offline)
 */
export async function updatePresence(sheetId, cursorPosition = null) {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('sheet_collaborators')
    .update({
      last_active: new Date().toISOString(),
      cursor_position: cursorPosition,
    })
    .eq('sheet_id', sheetId)
    .eq('user_id', currentUser.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Get online collaborators (based on recent activity)
 */
export async function getOnlineCollaborators(sheetId) {
  // Consider users "online" if they were active in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('sheet_collaborators')
    .select(`
      *,
      user:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq('sheet_id', sheetId)
    .gte('last_active', fiveMinutesAgo);

  return { data, error };
}

/**
 * Subscribe to collaborator changes
 */
export function subscribeToCollaborators(sheetId, callback) {
  const channel = supabase
    .channel(`collaborators:${sheetId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sheet_collaborators',
        filter: `sheet_id=eq.${sheetId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Send chat message
 */
export async function sendChatMessage(sheetId, message) {
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser?.user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sheet_id: sheetId,
      user_id: currentUser.user.id,
      message,
    })
    .select(`
      *,
      user:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .single();

  return { data, error };
}

/**
 * Get chat messages
 */
export async function getChatMessages(sheetId, limit = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      user:user_id (
        id,
        email,
        user_metadata
      )
    `)
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: true })
    .limit(limit);

  return { data, error };
}

/**
 * Subscribe to chat messages
 */
export function subscribeToChatMessages(sheetId, callback) {
  const channel = supabase
    .channel(`chat:${sheetId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `sheet_id=eq.${sheetId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Delete chat message
 */
export async function deleteChatMessage(messageId) {
  // Since we don't have is_deleted column, just delete the message
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  return { error };
}

/**
 * Get sheet settings
 */
export async function getSheetSettings(sheetId) {
  const { data, error } = await supabase
    .from('sheet_settings')
    .select('*')
    .eq('sheet_id', sheetId)
    .single();

  return { data, error };
}

/**
 * Update sheet settings
 */
export async function updateSheetSettings(sheetId, settings) {
  const { data, error } = await supabase
    .from('sheet_settings')
    .update(settings)
    .eq('sheet_id', sheetId)
    .select()
    .single();

  return { data, error };
}

/**
 * Check user permission for sheet
 */
export async function checkUserPermission(sheetId) {
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser?.user) return { role: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('sheet_collaborators')
    .select('role')
    .eq('sheet_id', sheetId)
    .eq('user_id', currentUser.user.id)
    .single();

  return { role: data?.role || null, error };
}
