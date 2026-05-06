import { supabase } from '../lib/supabase';
import { Fridge, FridgeMember, FridgeMemberRole } from '../types/Fridge';

interface FridgeRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
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
  return { id: row.id, name: row.name, ownerId: row.owner_id, createdAt: row.created_at };
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

export async function createFridge(name: string): Promise<Fridge> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: fridge, error: fridgeError } = await supabase
    .from('fridges')
    .insert({ name, owner_id: user.id })
    .select()
    .single();
  if (fridgeError) throw fridgeError;

  const { error: memberError } = await supabase
    .from('fridge_members')
    .insert({ fridge_id: fridge.id, user_id: user.id, role: 'owner', invite_accepted_at: new Date().toISOString() });
  if (memberError) throw memberError;

  return rowToFridge(fridge as FridgeRow);
}

export async function updateFridgeName(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('fridges').update({ name }).eq('id', id);
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
  return (data as FridgeMemberRow[]).map(rowToMember);
}

export async function inviteMember(fridgeId: string, email: string, role: FridgeMemberRole): Promise<string> {
  const token = crypto.randomUUID();
  const { error } = await supabase
    .from('fridge_members')
    .insert({ fridge_id: fridgeId, invited_email: email, role, invite_token: token });
  if (error) throw error;
  return `${window.location.origin}?invite=${token}`;
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
