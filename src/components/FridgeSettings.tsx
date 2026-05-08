import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge, FridgeMember, FridgeMemberRole } from '../types/Fridge';
import {
  fetchFridgeMembers, updateMemberRole,
  removeMember, updateFridgeName, deleteFridge, leaveFridge, addFriendToFridge,
} from '../utils/fridgeService';
import { fetchFriendships, Friend } from '../utils/friendService';
import './FridgeSettings.css';

interface Props {
  fridges: Fridge[];
  activeFridgeId: string;
  currentUserId: string;
  onFridgesChange: () => void;
  onActiveFridgeChange: (id: string) => void;
  onCreateFridge: (name: string) => Promise<void>;
}

export const FridgeSettings = ({ fridges, activeFridgeId, currentUserId, onFridgesChange, onActiveFridgeChange, onCreateFridge }: Props) => {
  const { t } = useTranslation();
  const [expandedFridgeId, setExpandedFridgeId] = useState<string | null>(null);
  const [members, setMembers] = useState<FridgeMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [inviteRole, setInviteRole] = useState<FridgeMemberRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState('');
  const [creating, setCreating] = useState(false);

  const expandedFridge = fridges.find(f => f.id === expandedFridgeId);
  const isOwner = expandedFridge?.ownerId === currentUserId;

  useEffect(() => {
    if (!expandedFridgeId) return;
    setLoadingMembers(true);
    fetchFridgeMembers(expandedFridgeId)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  }, [expandedFridgeId]);

  useEffect(() => {
    if (!isOwner) return;
    fetchFriendships()
      .then(({ friends: f }) => setFriends(f))
      .catch(() => {});
  }, [isOwner, expandedFridgeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (fridgeId: string) => {
    setExpandedFridgeId(prev => prev === fridgeId ? null : fridgeId);
    setRenamingId(null);
    setConfirmDeleteId(null);
    setConfirmLeaveId(null);
    setSelectedFriendId('');
  };

  const handleCreate = async () => {
    if (!newFridgeName.trim() || creating) return;
    setCreating(true);
    try {
      await onCreateFridge(newFridgeName.trim());
      setIsCreating(false);
      setNewFridgeName('');
    } finally {
      setCreating(false);
    }
  };

  const handleAddFriend = async () => {
    if (!selectedFriendId || !expandedFridgeId) return;
    setInviting(true);
    try {
      await addFriendToFridge(expandedFridgeId, selectedFriendId, inviteRole);
      setSelectedFriendId('');
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 2500);
      const updated = await fetchFridgeMembers(expandedFridgeId);
      setMembers(updated);
    } catch {
      // ignore
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: FridgeMemberRole) => {
    await updateMemberRole(memberId, role);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleRename = async (fridgeId: string) => {
    if (!renameValue.trim()) return;
    await updateFridgeName(fridgeId, renameValue.trim());
    setRenamingId(null);
    onFridgesChange();
  };

  const handleDelete = async (fridgeId: string) => {
    await deleteFridge(fridgeId);
    setConfirmDeleteId(null);
    setExpandedFridgeId(null);
    const remaining = fridges.filter(f => f.id !== fridgeId);
    if (remaining.length > 0) {
      onActiveFridgeChange(remaining[0].id);
    }
    onFridgesChange();
  };

  const handleLeave = async (fridgeId: string) => {
    await leaveFridge(fridgeId);
    setConfirmLeaveId(null);
    setExpandedFridgeId(null);
    const remaining = fridges.filter(f => f.id !== fridgeId);
    if (remaining.length > 0) {
      onActiveFridgeChange(remaining[0].id);
    }
    onFridgesChange();
  };

  return (
    <div className="fridge-settings">
      <div className="fridge-settings-list">
        {fridges.map(f => (
          <div key={f.id} className="fridge-accordion">
            <button
              className={`fridge-settings-item${f.id === activeFridgeId ? ' active' : ''}${f.id === expandedFridgeId ? ' expanded' : ''}`}
              onClick={() => handleToggle(f.id)}
            >
              <span className="fridge-settings-item-icon">🧊</span>
              <span className="fridge-settings-item-name">{f.name}</span>
              {f.ownerId !== currentUserId && (
                <span className="fridge-settings-item-badge">{t('fridges.roles.editor')}</span>
              )}
              <span className={`fridge-settings-item-chevron${f.id === expandedFridgeId ? ' open' : ''}`} />
            </button>

            {f.id === expandedFridgeId && expandedFridge && (
              <div className="fridge-settings-panel">

                {/* Rename */}
                <div className="fridge-settings-section">
                  {renamingId === expandedFridge.id ? (
                    <div className="fridge-rename-row">
                      <input
                        autoFocus
                        className="fridge-rename-input"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(expandedFridge.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        maxLength={40}
                      />
                      <button className="fridge-rename-confirm" onClick={() => handleRename(expandedFridge.id)}>
                        {t('settings.save')}
                      </button>
                      <button className="fridge-rename-cancel" onClick={() => setRenamingId(null)}>
                        {t('settings.cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="fridge-name-row">
                      <h3 className="fridge-settings-name">{expandedFridge.name}</h3>
                      {isOwner && (
                        <button
                          className="fridge-settings-link"
                          onClick={() => { setRenamingId(expandedFridge.id); setRenameValue(expandedFridge.name); }}
                        >
                          {t('fridges.rename')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Members */}
                <div className="fridge-settings-section">
                  <h4 className="fridge-settings-label">{t('fridges.members')}</h4>
                  {loadingMembers ? (
                    <div className="fridge-members-loading" />
                  ) : (
                    <ul className="fridge-members-list">
                      {members.filter(m => m.inviteAcceptedAt).map(m => (
                        <li key={m.id} className="fridge-member-row">
                          <span className="fridge-member-email">
                            {m.userId === currentUserId
                              ? t('friends.me')
                              : (m.displayName ? `@${m.displayName}` : (m.invitedEmail ?? m.userId?.slice(0, 8)))}
                          </span>
                          {isOwner && m.userId !== currentUserId ? (
                            <>
                              <select
                                className="fridge-member-role"
                                value={m.role}
                                onChange={e => handleRoleChange(m.id, e.target.value as FridgeMemberRole)}
                              >
                                <option value="editor">{t('fridges.roles.editor')}</option>
                                <option value="viewer">{t('fridges.roles.viewer')}</option>
                              </select>
                              <button
                                className="fridge-member-remove"
                                onClick={() => handleRemoveMember(m.id)}
                                title={t('fridges.removeFromFridge')}
                              >×</button>
                            </>
                          ) : (
                            <span className="fridge-member-role-badge">{t(`fridges.roles.${m.role}`)}</span>
                          )}
                        </li>
                      ))}
                      {members.filter(m => !m.inviteAcceptedAt).map(m => (
                        <li key={m.id} className="fridge-member-row fridge-member-row--pending">
                          <span className="fridge-member-email">{m.invitedEmail}</span>
                          <span className="fridge-member-pending">{t('fridges.pendingInvite')}</span>
                          {isOwner && (
                            <button
                              className="fridge-member-remove"
                              onClick={() => handleRemoveMember(m.id)}
                            >×</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Add friend to fridge */}
                {isOwner && (
                  <div className="fridge-settings-section">
                    <h4 className="fridge-settings-label">{t('friends.addToFridge')}</h4>
                    {friends.length === 0 ? (
                      <p className="fridge-invite-hint">{t('friends.noFriendsYet')}</p>
                    ) : (
                      <div className="fridge-invite-row">
                        <select
                          className="fridge-invite-input"
                          value={selectedFriendId}
                          onChange={e => setSelectedFriendId(e.target.value)}
                        >
                          <option value="">{t('friends.pickFriend')}</option>
                          {friends
                            .filter(f => !members.some(m => m.userId === f.userId))
                            .map(f => (
                              <option key={f.userId} value={f.userId}>@{f.displayName}</option>
                            ))}
                        </select>
                        <select
                          className="fridge-invite-role"
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value as FridgeMemberRole)}
                        >
                          <option value="editor">{t('fridges.roles.editor')}</option>
                          <option value="viewer">{t('fridges.roles.viewer')}</option>
                        </select>
                        <button
                          className="fridge-invite-btn"
                          onClick={handleAddFriend}
                          disabled={!selectedFriendId || inviting}
                        >
                          {inviteSuccess ? '✓' : t('fridges.invite')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Danger zone */}
                <div className="fridge-settings-section fridge-settings-danger">
                  {isOwner && fridges.length > 1 && (
                    confirmDeleteId === expandedFridge.id ? (
                      <div className="fridge-confirm-row">
                        <span className="fridge-confirm-text">{t('fridges.deleteConfirm')}</span>
                        <button className="fridge-confirm-yes" onClick={() => handleDelete(expandedFridge.id)}>
                          {t('fridges.delete')}
                        </button>
                        <button className="fridge-confirm-no" onClick={() => setConfirmDeleteId(null)}>
                          {t('settings.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button className="fridge-danger-btn" onClick={() => setConfirmDeleteId(expandedFridge.id)}>
                        {t('fridges.delete')}
                      </button>
                    )
                  )}
                  {!isOwner && (
                    confirmLeaveId === expandedFridge.id ? (
                      <div className="fridge-confirm-row">
                        <span className="fridge-confirm-text">{t('fridges.leaveConfirm')}</span>
                        <button className="fridge-confirm-yes" onClick={() => handleLeave(expandedFridge.id)}>
                          {t('fridges.leave')}
                        </button>
                        <button className="fridge-confirm-no" onClick={() => setConfirmLeaveId(null)}>
                          {t('settings.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button className="fridge-danger-btn" onClick={() => setConfirmLeaveId(expandedFridge.id)}>
                        {t('fridges.leave')}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isCreating ? (
          <div className="fridge-rename-row">
            <input
              autoFocus
              className="fridge-rename-input"
              value={newFridgeName}
              onChange={e => setNewFridgeName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setIsCreating(false); setNewFridgeName(''); }
              }}
              placeholder={t('fridges.namePlaceholder')}
              maxLength={40}
            />
            <button className="fridge-rename-confirm" onClick={handleCreate} disabled={!newFridgeName.trim() || creating}>
              {t('fridges.create')}
            </button>
            <button className="fridge-rename-cancel" onClick={() => { setIsCreating(false); setNewFridgeName(''); }}>
              {t('settings.cancel')}
            </button>
          </div>
        ) : (
          <button className="fridge-settings-add-btn" onClick={() => setIsCreating(true)}>
            + {t('fridges.newFridge')}
          </button>
        )}
      </div>
    </div>
  );
};
