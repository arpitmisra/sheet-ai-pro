import { supabase } from './client';

/**
 * Add collaborator to a sheet
 */
export async function addCollaborator(sheetId, email, role = 'editor') {
  try {
    // First, find user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      // If no profile found, invite by email (they'll need to sign up)
      return { data: null, error: { message: 'User not found. They need to sign up first.' } };
    }

    const { data: currentUser } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('sheet_collaborators')
      .insert({
        sheet_id: sheetId,
        user_id: userData.id,
        role,
        invited_by: currentUser?.user?.id,
      })
      .select()
      .single();

    return { data, error };
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
export async function updatePresence(sheetId, isOnline, cursorPosition = null) {
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser?.user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('sheet_collaborators')
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString(),
      cursor_position: cursorPosition,
    })
    .eq('sheet_id', sheetId)
    .eq('user_id', currentUser.user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Get online collaborators
 */
export async function getOnlineCollaborators(sheetId) {
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
    .eq('is_online', true);

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
    .eq('is_deleted', false)
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
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_deleted: true })
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
