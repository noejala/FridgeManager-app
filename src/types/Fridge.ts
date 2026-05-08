export interface Fridge {
  id: string;
  name: string;
  emoji: string;
  ownerId: string;
  createdAt: string;
}

export type FridgeMemberRole = 'owner' | 'editor' | 'viewer';

export interface FridgeMember {
  id: string;
  fridgeId: string;
  userId: string | null;
  role: FridgeMemberRole;
  invitedEmail: string | null;
  inviteAcceptedAt: string | null;
  createdAt: string;
  displayName: string | null;
}
