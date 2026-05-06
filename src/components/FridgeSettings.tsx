import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge, FridgeMember, FridgeMemberRole } from '../types/Fridge';
import {
  fetchFridgeMembers, inviteMember, updateMemberRole,
  removeMember, updateFridgeName, deleteFridge, leaveFridge,
} from '../utils/fridgeService';
import './FridgeSettings.css';

interface Props {
  fridges: Fridge[];
  activeFridgeId: string;
  currentUserId: string;
  onFridgesChange: () => void;
  onActiveFridgeChange: (id: string) => void;
}

export const FridgeSettings = ({ fridges, activeFridgeId, currentUserId, onFridgesChange, onActiveFridgeChange }: Props) => {
  const { t } = useTranslation();
  const [selectedFridgeId, setSelectedFridgeId] = useState(activeFridgeId);
  const [members, setMembers] = useState<FridgeMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<FridgeMemberRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);

  const selectedFridge = fridges.find(f => f.id === selectedFridgeId) ?? fridges[0];
  const isOwner = selectedFridge?.ownerId === currentUserId;

  useEffect(() => {
    if (!selectedFridgeId) return;
    setLoadingMembers(true);
    fetchFridgeMembers(selectedFridgeId)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  }, [selectedFridgeId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedFridgeId) return;
    setInviting(true);
    try {
      const link = await inviteMember(selectedFridgeId, inviteEmail.trim(), inviteRole);
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      setInviteEmail('');
      const updated = await fetchFridgeMembers(selectedFridgeId);
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
    const remaining = fridges.filter(f => f.id !== fridgeId);
    if (remaining.length > 0) {
      const next = remaining[0].id;
      setSelectedFridgeId(next);
      onActiveFridgeChange(next);
    }
    onFridgesChange();
  };

  const handleLeave = async (fridgeId: string) => {
    await leaveFridge(fridgeId);
    setConfirmLeaveId(null);
    const remaining = fridges.filter(f => f.id !== fridgeId);
    if (remaining.length > 0) {
      const next = remaining[0].id;
      setSelectedFridgeId(next);
      onActiveFridgeChange(next);
    }
    onFridgesChange();
  };

  return (
    <div className="fridge-settings">
      {/* Fridge list */}
      <div className="fridge-settings-list">
        {fridges.map(f => (
          <button
            key={f.id}
            className={`fridge-settings-item${f.id === selectedFridgeId ? ' active' : ''}`}
            onClick={() => setSelectedFridgeId(f.id)}
          >
            <span className="fridge-settings-item-icon">🧊</span>
            <span className="fridge-settings-item-name">{f.name}</span>
            {f.ownerId !== currentUserId && (
              <span className="fridge-settings-item-badge">{t('fridges.roles.editor')}</span>
            )}
          </button>
        ))}
      </div>

      {selectedFridge && (
        <div className="fridge-settings-panel">

          {/* Rename */}
          <div className="fridge-settings-section">
            {renamingId === selectedFridge.id ? (
              <div className="fridge-rename-row">
                <input
                  autoFocus
                  className="fridge-rename-input"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(selectedFridge.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  maxLength={40}
                />
                <button className="fridge-rename-confirm" onClick={() => handleRename(selectedFridge.id)}>
                  {t('settings.save')}
                </button>
                <button className="fridge-rename-cancel" onClick={() => setRenamingId(null)}>
                  {t('settings.cancel')}
                </button>
              </div>
            ) : (
              <div className="fridge-name-row">
                <h3 className="fridge-settings-name">{selectedFridge.name}</h3>
                {isOwner && (
                  <button
                    className="fridge-settings-link"
                    onClick={() => { setRenamingId(selectedFridge.id); setRenameValue(selectedFridge.name); }}
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
                      {m.userId === currentUserId ? '👤 Moi' : (m.invitedEmail ?? m.userId?.slice(0, 8))}
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

          {/* Invite */}
          {isOwner && (
            <div className="fridge-settings-section">
              <h4 className="fridge-settings-label">{t('fridges.inviteByEmail')}</h4>
              <div className="fridge-invite-row">
                <input
                  className="fridge-invite-input"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder={t('fridges.emailPlaceholder')}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
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
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                >
                  {copiedLink ? t('fridges.inviteCopied') : t('fridges.invite')}
                </button>
              </div>
              <p className="fridge-invite-hint">Le lien d'invitation sera copié dans ton presse-papiers.</p>
            </div>
          )}

          {/* Danger zone */}
          <div className="fridge-settings-section fridge-settings-danger">
            {isOwner && fridges.length > 1 && (
              confirmDeleteId === selectedFridge.id ? (
                <div className="fridge-confirm-row">
                  <span className="fridge-confirm-text">{t('fridges.deleteConfirm')}</span>
                  <button className="fridge-confirm-yes" onClick={() => handleDelete(selectedFridge.id)}>
                    {t('fridges.delete')}
                  </button>
                  <button className="fridge-confirm-no" onClick={() => setConfirmDeleteId(null)}>
                    {t('settings.cancel')}
                  </button>
                </div>
              ) : (
                <button className="fridge-danger-btn" onClick={() => setConfirmDeleteId(selectedFridge.id)}>
                  {t('fridges.delete')}
                </button>
              )
            )}
            {!isOwner && (
              confirmLeaveId === selectedFridge.id ? (
                <div className="fridge-confirm-row">
                  <span className="fridge-confirm-text">{t('fridges.leaveConfirm')}</span>
                  <button className="fridge-confirm-yes" onClick={() => handleLeave(selectedFridge.id)}>
                    {t('fridges.leave')}
                  </button>
                  <button className="fridge-confirm-no" onClick={() => setConfirmLeaveId(null)}>
                    {t('settings.cancel')}
                  </button>
                </div>
              ) : (
                <button className="fridge-danger-btn" onClick={() => setConfirmLeaveId(selectedFridge.id)}>
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
