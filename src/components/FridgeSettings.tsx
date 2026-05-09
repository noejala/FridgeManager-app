import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge, FridgeMember, FridgeMemberRole } from '../types/Fridge';
import {
  fetchFridgeMembers, updateMemberRole,
  removeMember, updateFridge, deleteFridge, leaveFridge, addFriendToFridge,
} from '../utils/fridgeService';
import { fetchFriendships, Friend } from '../utils/friendService';
import { NewFridgeModal } from './NewFridgeModal';
import './FridgeSettings.css';

const FRIDGE_EMOJIS = ['🧊', '❄️', '🍎', '🥦', '🥩', '🍷', '🫙', '🌿', '🍕', '🥗', '⭐', '🏡'];

interface Props {
  fridges: Fridge[];
  currentUserId: string;
  onFridgesChange: () => void;
  onActiveFridgeChange: (id: string) => void;
  onCreateFridge: (name: string, emoji?: string) => Promise<Fridge>;
}

export const FridgeSettings = ({ fridges, currentUserId, onFridgesChange, onActiveFridgeChange, onCreateFridge }: Props) => {
  const { t } = useTranslation();
  const [expandedFridgeId, setExpandedFridgeId] = useState<string | null>(null);
  const [members, setMembers] = useState<FridgeMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [inviteRole, setInviteRole] = useState<FridgeMemberRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);
  const [showNewFridgeModal, setShowNewFridgeModal] = useState(false);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!emojiPickerFor) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerFor(null);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [emojiPickerFor]);

  useEffect(() => {
    if (!expandedFridgeId) return;
    const handleClick = (e: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) {
        setExpandedFridgeId(null);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [expandedFridgeId]);

  const handleToggle = (fridgeId: string) => {
    const next = expandedFridgeId === fridgeId ? null : fridgeId;
    setExpandedFridgeId(next);
    if (next) {
      const fridge = fridges.find(f => f.id === next);
      if (fridge) setEditingNames(prev => ({ ...prev, [next]: fridge.name }));
    }
    setEmojiPickerFor(null);
    setConfirmDeleteId(null);
    setConfirmLeaveId(null);
    setSelectedFriendId('');
  };

  const handleSaveName = async (fridgeId: string) => {
    const fridge = fridges.find(f => f.id === fridgeId);
    const newName = editingNames[fridgeId]?.trim();
    if (!newName || !fridge || newName === fridge.name) return;
    await updateFridge(fridgeId, { name: newName });
    onFridgesChange();
  };

  const handleSaveEmoji = async (fridgeId: string, emoji: string) => {
    setEmojiPickerFor(null);
    await updateFridge(fridgeId, { emoji });
    onFridgesChange();
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

  const handleDelete = async (fridgeId: string) => {
    await deleteFridge(fridgeId);
    setConfirmDeleteId(null);
    setExpandedFridgeId(null);
    const remaining = fridges.filter(f => f.id !== fridgeId);
    if (remaining.length > 0) onActiveFridgeChange(remaining[0].id);
    onFridgesChange();
  };

  const handleLeave = async (fridgeId: string) => {
    await leaveFridge(fridgeId);
    setConfirmLeaveId(null);
    setExpandedFridgeId(null);
    const remaining = fridges.filter(f => f.id !== fridgeId);
    if (remaining.length > 0) onActiveFridgeChange(remaining[0].id);
    onFridgesChange();
  };

  const ownedFridges = fridges.filter(f => f.ownerId === currentUserId);
  const sharedFridges = fridges.filter(f => f.ownerId !== currentUserId);

  const renderAccordionItem = (f: Fridge) => {
    const isExpanded = f.id === expandedFridgeId;
    const isMine = f.ownerId === currentUserId;

    return (
      <div key={f.id} ref={isExpanded ? expandedRef : null} className={`fridge-accordion${isExpanded ? ' is-expanded' : ''}`}>
        {isExpanded ? (
          <div className="fridge-settings-item fridge-settings-item--open">
            <div className="fridge-emoji-wrap">
              <button
                className="fridge-emoji-btn"
                onClick={e => { e.stopPropagation(); setEmojiPickerFor(prev => prev === f.id ? null : f.id); }}
                disabled={!isMine}
                title={isMine ? 'Changer l\'emoji' : undefined}
              >
                {f.emoji}
              </button>
              {emojiPickerFor === f.id && (
                <div className="fridge-emoji-picker" ref={emojiPickerRef}>
                  {FRIDGE_EMOJIS.map(e => (
                    <button key={e} className="fridge-emoji-option" onClick={() => handleSaveEmoji(f.id, e)}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              className="fridge-header-name-input"
              value={editingNames[f.id] ?? f.name}
              onChange={e => setEditingNames(prev => ({ ...prev, [f.id]: e.target.value }))}
              onBlur={() => handleSaveName(f.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
                if (e.key === 'Escape') setEditingNames(prev => ({ ...prev, [f.id]: f.name }));
              }}
              maxLength={40}
              readOnly={!isMine}
            />
            <button className="fridge-chevron-btn" onClick={() => handleToggle(f.id)}>
              <span className="fridge-settings-item-chevron open" />
            </button>
          </div>
        ) : (
          <button className="fridge-settings-item" onClick={() => handleToggle(f.id)}>
            <span className="fridge-settings-item-icon">{f.emoji}</span>
            <span className="fridge-settings-item-name">{f.name}</span>
            <span className="fridge-settings-item-chevron" />
          </button>
        )}

        {isExpanded && expandedFridge && (
          <div className="fridge-settings-panel">

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
                        <button className="fridge-member-remove" onClick={() => handleRemoveMember(m.id)}>×</button>
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
                        .filter(fr => !members.some(m => m.userId === fr.userId))
                        .map(fr => (
                          <option key={fr.userId} value={fr.userId}>@{fr.displayName}</option>
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
    );
  };

  return (
    <>
      <div className="fridge-settings">
        <div className="fridge-settings-group">
          <h4 className="fridge-settings-group-label">{t('fridges.myFridges')}</h4>
          <div className="fridge-settings-list">
            {ownedFridges.map(renderAccordionItem)}
            <button className="fridge-settings-add-btn" onClick={() => setShowNewFridgeModal(true)}>
              + {t('fridges.newFridge')}
            </button>
          </div>
        </div>

        {sharedFridges.length > 0 && (
          <div className="fridge-settings-group">
            <h4 className="fridge-settings-group-label">{t('fridges.sharedFridges')}</h4>
            <div className="fridge-settings-list">
              {sharedFridges.map(renderAccordionItem)}
            </div>
          </div>
        )}
      </div>

      {showNewFridgeModal && (
        <NewFridgeModal
          onClose={() => setShowNewFridgeModal(false)}
          onCreate={onCreateFridge}
          onDone={() => {
            setShowNewFridgeModal(false);
            onFridgesChange();
          }}
        />
      )}
    </>
  );
};
