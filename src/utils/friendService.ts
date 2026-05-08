import { supabase } from '../lib/supabase';

export interface Friend {
  friendshipId: string;
  userId: string;
  displayName: string;
  firstName: string | null;
  since: string;
}

export interface FriendRequest {
  friendshipId: string;
  userId: string;
  displayName: string;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
}

export interface UserSearchResult {
  userId: string;
  displayName: string;
  firstName: string | null;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase.rpc('search_users', { query: query.trim() });
  if (error) throw error;
  return (data ?? []).map((r: { user_id: string; display_name: string; first_name: string | null }) => ({
    userId: r.user_id,
    displayName: r.display_name,
    firstName: r.first_name ?? null,
  }));
}

export async function fetchFriendships(): Promise<{ friends: Friend[]; pending: FriendRequest[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { friends: [], pending: [] };

  const { data, error } = await supabase.from('friendships').select('*').order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as FriendshipRow[];
  const otherIds = rows.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id);

  let profileMap: Map<string, { displayName: string; firstName: string | null }> = new Map();
  if (otherIds.length > 0) {
    const { data: profiles } = await supabase.rpc('get_user_profiles', { user_ids: otherIds });
    if (profiles) {
      profileMap = new Map(
        (profiles as { user_id: string; display_name: string; first_name: string | null }[]).map(p => [
          p.user_id,
          { displayName: p.display_name, firstName: p.first_name ?? null },
        ])
      );
    }
  }

  const friends: Friend[] = [];
  const pending: FriendRequest[] = [];

  for (const row of rows) {
    const otherId = row.requester_id === user.id ? row.addressee_id : row.requester_id;
    const profile = profileMap.get(otherId);
    const displayName = profile?.displayName ?? '?';
    const firstName = profile?.firstName ?? null;

    if (row.status === 'accepted') {
      friends.push({ friendshipId: row.id, userId: otherId, displayName, firstName, since: row.created_at });
    } else {
      pending.push({
        friendshipId: row.id,
        userId: otherId,
        displayName,
        direction: row.requester_id === user.id ? 'outgoing' : 'incoming',
        createdAt: row.created_at,
      });
    }
  }

  return { friends, pending };
}

export async function sendFriendRequest(addresseeId: string): Promise<'sent' | 'accepted'> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if a friendship already exists in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status, requester_id')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') throw new Error('ALREADY_FRIENDS');
    if (existing.requester_id === user.id) throw new Error('REQUEST_ALREADY_SENT');
    // Other person already requested us — auto-accept
    await acceptFriendRequest(existing.id);
    return 'accepted';
  }

  const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: addresseeId });
  if (error) throw error;
  return 'sent';
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  if (error) throw error;
}

export async function declineFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

export async function fetchPendingIncomingCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('addressee_id', user.id)
    .eq('status', 'pending');
  return count ?? 0;
}
