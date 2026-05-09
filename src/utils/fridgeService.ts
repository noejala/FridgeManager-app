import { supabase } from '../lib/supabase';
import { Fridge, FridgeMember, FridgeMemberRole } from '../types/Fridge';

interface FridgeRow {
  id: string;
  name: string;
  emoji: string;
  owner_id: string;
  created_at: string;
  pantry_staples: string[];
}

interface FridgeMemberRow {
  id: string;
  fridge_id: string;
  user_id: string | null;
  role: FridgeMemberRole;
  invited_email: string | null;
  invite_accepted_at: string | null;
  created_at: string;
}

function rowToFridge(row: FridgeRow): Fridge {
  return { id: row.id, name: row.name, emoji: row.emoji ?? '🧊', ownerId: row.owner_id, createdAt: row.created_at, pantryStaples: row.pantry_staples ?? [] };
}

function rowToMember(row: FridgeMemberRow): FridgeMember {
  return {
    id: row.id,
    fridgeId: row.fridge_id,
    userId: row.user_id,
    role: row.role,
    invitedEmail: row.invited_email,
    inviteAcceptedAt: row.invite_accepted_at,
    createdAt: row.created_at,
    displayName: null,
  };
}

export async function fetchFridges(): Promise<Fridge[]> {
  const { data, error } = await supabase
    .from('fridges')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as FridgeRow[]).map(rowToFridge);
}

export async function createFridge(name: string, emoji = '🧊'): Promise<Fridge> {
  const { data, error } = await supabase.rpc('create_fridge', { fridge_name: name, fridge_emoji: emoji });
  if (error) throw error;
  const row = data as { id: string; name: string; emoji: string; owner_id: string; created_at: string };
  return { id: row.id, name: row.name, emoji: row.emoji ?? '🧊', ownerId: row.owner_id, createdAt: row.created_at, pantryStaples: [] };
}

export async function updateFridgePantry(id: string, staples: string[]): Promise<void> {
  const { error } = await supabase.from('fridges').update({ pantry_staples: staples }).eq('id', id);
  if (error) throw error;
}

export async function updateFridge(id: string, updates: { name?: string; emoji?: string }): Promise<void> {
  const { error } = await supabase.from('fridges').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteFridge(id: string): Promise<void> {
  const { error } = await supabase.from('fridges').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchFridgeMembers(fridgeId: string): Promise<FridgeMember[]> {
  const { data, error } = await supabase
    .from('fridge_members')
    .select('*')
    .eq('fridge_id', fridgeId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const rows = data as FridgeMemberRow[];
  const userIds = rows.map(r => r.user_id).filter(Boolean) as string[];

  let profileMap: Map<string, string> = new Map();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.rpc('get_user_profiles', { user_ids: userIds });
    if (profiles) {
      profileMap = new Map(
        (profiles as { user_id: string; display_name: string }[]).map(p => [p.user_id, p.display_name])
      );
    }
  }

  return rows.map(row => ({
    ...rowToMember(row),
    displayName: row.user_id ? (profileMap.get(row.user_id) ?? null) : null,
  }));
}

export async function addFriendToFridge(fridgeId: string, friendUserId: string, role: FridgeMemberRole): Promise<void> {
  const { error } = await supabase.rpc('add_friend_to_fridge', {
    p_fridge_id: fridgeId,
    p_friend_user_id: friendUserId,
    p_role: role,
  });
  if (error) throw error;
}


export async function updateMemberRole(memberId: string, role: FridgeMemberRole): Promise<void> {
  const { error } = await supabase.from('fridge_members').update({ role }).eq('id', memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('fridge_members').delete().eq('id', memberId);
  if (error) throw error;
}

export async function leaveFridge(fridgeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('fridge_members')
    .delete()
    .eq('fridge_id', fridgeId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function acceptFridgeInvite(token: string): Promise<{ fridgeId: string; fridgeName: string }> {
  const { data, error } = await supabase.rpc('accept_fridge_invite', { token });
  if (error) throw error;
  return { fridgeId: data.fridge_id, fridgeName: data.fridge_name };
}
