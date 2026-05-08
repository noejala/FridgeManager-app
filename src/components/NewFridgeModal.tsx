import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge, FridgeMemberRole } from '../types/Fridge';
import { fetchFriendships, Friend } from '../utils/friendService';
import { addFriendToFridge } from '../utils/fridgeService';
import './NewFridgeModal.css';

interface Props {
  onClose: () => void;
  onCreate: (name: string) => Promise<Fridge>;
  onDone: () => void;
}

export function NewFridgeModal({ onClose, onCreate, onDone }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Record<string, FridgeMemberRole | null>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFriendships()
      .then(({ friends: f }) => setFriends(f))
      .catch(() => {});
  }, []);

  const toggleFriend = (userId: string) => {
    setSelected(prev => ({ ...prev, [userId]: prev[userId] != null ? null : 'editor' }));
  };

  const setRole = (userId: string, role: FridgeMemberRole) => {
    setSelected(prev => ({ ...prev, [userId]: role }));
  };

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const fridge = await onCreate(name.trim());
      const toAdd = Object.entries(selected).filter((entry): entry is [string, FridgeMemberRole] => entry[1] != null);
      await Promise.all(toAdd.map(([userId, role]) => addFriendToFridge(fridge.id, userId, role)));
      onDone();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="nfm-overlay" onClick={onClose}>
      <div className="nfm-modal" onClick={e => e.stopPropagation()}>
        <h3 className="nfm-title">{t('fridges.newFridge')}</h3>

        <input
          autoFocus
          className="nfm-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') onClose();
          }}
          placeholder={t('fridges.namePlaceholder')}
          maxLength={40}
        />

        {friends.length > 0 && (
          <div className="nfm-friends">
            <p className="nfm-friends-label">{t('fridges.addFriendsOptional')}</p>
            {friends.map(f => {
              const isOn = selected[f.userId] != null;
              return (
                <div key={f.userId} className={`nfm-friend-row${isOn ? ' on' : ''}`}>
                  <button className="nfm-friend-toggle" onClick={() => toggleFriend(f.userId)}>
                    <span className="nfm-friend-check">{isOn ? '✓' : ''}</span>
                    <span className="nfm-friend-name">
                      {f.firstName ? f.firstName : `@${f.displayName}`}
                      {f.firstName && <span className="nfm-friend-username"> @{f.displayName}</span>}
                    </span>
                  </button>
                  {isOn && (
                    <select
                      className="nfm-friend-role"
                      value={selected[f.userId]!}
                      onChange={e => setRole(f.userId, e.target.value as FridgeMemberRole)}
                    >
                      <option value="editor">{t('fridges.roles.editor')}</option>
                      <option value="viewer">{t('fridges.roles.viewer')}</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button className="nfm-create-btn" onClick={handleCreate} disabled={!name.trim() || creating}>
          {creating ? '…' : t('fridges.create')}
        </button>
        <button className="nfm-cancel" onClick={onClose}>{t('settings.cancel')}</button>
      </div>
    </div>
  );
}
