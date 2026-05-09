import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge, FridgeMemberRole } from '../types/Fridge';
import { fetchFriendships, Friend } from '../utils/friendService';
import { addFriendToFridge } from '../utils/fridgeService';
import './NewFridgeModal.css';

const FRIDGE_EMOJIS = ['🧊', '❄️', '🍎', '🥦', '🥩', '🍷', '🫙', '🌿', '🍕', '🥗', '⭐'];

const EXTRA_EMOJIS = [
  '🍔', '🌮', '🌯', '🍜', '🍣', '🥘', '🫕', '🥩', '🍗', '🥓',
  '🧀', '🥚', '🍳', '🥕', '🍅', '🌽', '🧅', '🧄', '🥫', '🍞',
  '🥐', '🧁', '🍰', '🍫', '🍬', '☕', '🫖', '🧃', '🥛', '🍺',
  '🍓', '🫐', '🍊', '🍋', '🍇', '🍌', '🍉', '🥝', '🍑', '🍒',
  '🌱', '🌸', '🌻', '🌙', '☀️', '🌈', '🏡', '🏠', '🪴', '🐄',
  '🐓', '🐟', '🦐', '🦞', '🧑‍🍳', '🍽️', '🥄', '🔪', '🫙', '🎉',
];

interface Props {
  onClose: () => void;
  onCreate: (name: string, emoji?: string) => Promise<Fridge>;
  onDone: () => void;
}

export function NewFridgeModal({ onClose, onCreate, onDone }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧊');
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Record<string, FridgeMemberRole | null>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriendships()
      .then(({ friends: f }) => setFriends(f))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const toggleFriend = (userId: string) => {
    setSelected(prev => ({ ...prev, [userId]: prev[userId] != null ? null : 'editor' }));
  };

  const setRole = (userId: string, role: FridgeMemberRole) => {
    setSelected(prev => ({ ...prev, [userId]: role }));
  };

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const fridge = await onCreate(name.trim(), emoji);
      const toAdd = Object.entries(selected).filter((entry): entry is [string, FridgeMemberRole] => entry[1] != null);
      await Promise.all(toAdd.map(([userId, role]) => addFriendToFridge(fridge.id, userId, role)));
      onDone();
    } catch (err) {
      console.error('Failed to create fridge:', err);
      const msg = err instanceof Error
        ? err.message
        : (err != null && typeof err === 'object' && 'message' in err)
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const isCustomEmoji = !FRIDGE_EMOJIS.includes(emoji);

  return (
    <div className="nfm-overlay" onClick={onClose}>
      <div className="nfm-modal" onClick={e => e.stopPropagation()}>
        <h3 className="nfm-title">{t('fridges.newFridge')}</h3>

        <div className="nfm-name-row">
          <div className="nfm-emoji-grid-wrap">
            <div className="nfm-emoji-grid">
              {FRIDGE_EMOJIS.map(e => (
                <button
                  key={e}
                  className={`nfm-emoji-option${e === emoji ? ' selected' : ''}`}
                  onClick={() => { setEmoji(e); setShowPicker(false); }}
                  type="button"
                >
                  {e}
                </button>
              ))}
              <button
                className={`nfm-emoji-option nfm-emoji-more${isCustomEmoji ? ' selected' : ''}`}
                onClick={() => setShowPicker(p => !p)}
                type="button"
              >
                {isCustomEmoji ? emoji : '＋'}
              </button>
            </div>

            {showPicker && (
              <div className="nfm-emoji-picker" ref={pickerRef}>
                {EXTRA_EMOJIS.map(e => (
                  <button
                    key={e}
                    className={`nfm-picker-option${e === emoji ? ' selected' : ''}`}
                    onClick={() => { setEmoji(e); setShowPicker(false); }}
                    type="button"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

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
        </div>

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

        {error && <p className="nfm-error">{error}</p>}

        <button
          className="nfm-create-btn"
          onClick={handleCreate}
          disabled={!name.trim() || creating}
        >
          {creating ? '…' : t('fridges.create')}
        </button>
        <button className="nfm-cancel" onClick={onClose}>
          {t('settings.cancel')}
        </button>
      </div>
    </div>
  );
}
