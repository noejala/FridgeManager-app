import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge, FridgeMemberRole } from '../types/Fridge';
import { fetchFriendships, fetchFriendFridgeCounts, Friend } from '../utils/friendService';
import { addFriendToFridge } from '../utils/fridgeService';
import './NewFridgeModal.css';

const FRIDGE_EMOJIS = ['🧊', '❄️', '🍎', '🥦', '🥩', '🍷', '🫙', '🌿', '🍕', '🥗', '⭐'];

const EMOJI_DATA: { emoji: string; keywords: string[] }[] = [
  { emoji: '🍔', keywords: ['burger', 'hamburger', 'viande'] },
  { emoji: '🌮', keywords: ['taco', 'mexicain'] },
  { emoji: '🌯', keywords: ['wrap', 'sandwich'] },
  { emoji: '🍜', keywords: ['nouilles', 'ramen', 'soupe', 'asiatique'] },
  { emoji: '🍣', keywords: ['sushi', 'japonais', 'poisson'] },
  { emoji: '🥘', keywords: ['plat', 'ragout', 'casserole'] },
  { emoji: '🫕', keywords: ['fondue', 'pot', 'raclette'] },
  { emoji: '🍗', keywords: ['poulet', 'volaille', 'chicken'] },
  { emoji: '🥓', keywords: ['bacon', 'lardons', 'porc'] },
  { emoji: '🧀', keywords: ['fromage', 'cheese'] },
  { emoji: '🥚', keywords: ['oeuf', 'egg'] },
  { emoji: '🍳', keywords: ['poele', 'oeuf', 'cuire'] },
  { emoji: '🥕', keywords: ['carotte', 'legume'] },
  { emoji: '🍅', keywords: ['tomate', 'legume'] },
  { emoji: '🌽', keywords: ['mais', 'legume'] },
  { emoji: '🧅', keywords: ['oignon', 'legume'] },
  { emoji: '🧄', keywords: ['ail', 'legume'] },
  { emoji: '🥫', keywords: ['conserve', 'boite', 'can'] },
  { emoji: '🍞', keywords: ['pain', 'bread'] },
  { emoji: '🥐', keywords: ['croissant', 'viennoiserie', 'pain'] },
  { emoji: '🧁', keywords: ['cupcake', 'gateau', 'dessert'] },
  { emoji: '🍰', keywords: ['gateau', 'dessert', 'cake'] },
  { emoji: '🍫', keywords: ['chocolat', 'chocolate', 'dessert'] },
  { emoji: '🍬', keywords: ['bonbon', 'sucre', 'candy'] },
  { emoji: '☕', keywords: ['cafe', 'coffee', 'boisson'] },
  { emoji: '🫖', keywords: ['the', 'tea', 'boisson'] },
  { emoji: '🧃', keywords: ['jus', 'juice', 'boisson'] },
  { emoji: '🥛', keywords: ['lait', 'milk', 'boisson'] },
  { emoji: '🍺', keywords: ['biere', 'beer', 'boisson'] },
  { emoji: '🍓', keywords: ['fraise', 'fruit'] },
  { emoji: '🫐', keywords: ['myrtille', 'blueberry', 'fruit'] },
  { emoji: '🍊', keywords: ['orange', 'fruit', 'agrume'] },
  { emoji: '🍋', keywords: ['citron', 'lemon', 'fruit', 'agrume'] },
  { emoji: '🍇', keywords: ['raisin', 'grape', 'fruit'] },
  { emoji: '🍌', keywords: ['banane', 'banana', 'fruit'] },
  { emoji: '🍉', keywords: ['pasteque', 'watermelon', 'fruit'] },
  { emoji: '🥝', keywords: ['kiwi', 'fruit'] },
  { emoji: '🍑', keywords: ['peche', 'peach', 'fruit'] },
  { emoji: '🍒', keywords: ['cerise', 'cherry', 'fruit'] },
  { emoji: '🌱', keywords: ['plante', 'nature', 'pousse'] },
  { emoji: '🌸', keywords: ['fleur', 'flower', 'nature'] },
  { emoji: '🌻', keywords: ['tournesol', 'soleil', 'fleur'] },
  { emoji: '🌙', keywords: ['lune', 'moon', 'nuit'] },
  { emoji: '☀️', keywords: ['soleil', 'sun', 'jour'] },
  { emoji: '🌈', keywords: ['arc en ciel', 'rainbow'] },
  { emoji: '🏡', keywords: ['maison', 'house', 'home'] },
  { emoji: '🏠', keywords: ['maison', 'house', 'home'] },
  { emoji: '🪴', keywords: ['plante', 'pot', 'interieur'] },
  { emoji: '🐄', keywords: ['vache', 'cow', 'lait'] },
  { emoji: '🐓', keywords: ['coq', 'poulet', 'volaille'] },
  { emoji: '🐟', keywords: ['poisson', 'fish', 'mer'] },
  { emoji: '🦐', keywords: ['crevette', 'shrimp', 'fruit de mer'] },
  { emoji: '🦞', keywords: ['homard', 'lobster', 'fruit de mer'] },
  { emoji: '🧑‍🍳', keywords: ['cuisinier', 'chef', 'cook'] },
  { emoji: '🍽️', keywords: ['assiette', 'repas', 'diner'] },
  { emoji: '🥄', keywords: ['cuillere', 'spoon', 'ustensile'] },
  { emoji: '🔪', keywords: ['couteau', 'knife', 'ustensile'] },
  { emoji: '🫙', keywords: ['bocal', 'jar', 'conserve'] },
  { emoji: '🎉', keywords: ['fete', 'party', 'celebration'] },
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
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, FridgeMemberRole | null>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriendships().then(async ({ friends: f }) => {
      const counts = await fetchFriendFridgeCounts(f.map(fr => fr.userId)).catch(() => new Map<string, number>());
      const sorted = [...f].sort((a, b) => {
        const diff = (counts.get(b.userId) ?? 0) - (counts.get(a.userId) ?? 0);
        if (diff !== 0) return diff;
        return new Date(b.since).getTime() - new Date(a.since).getTime();
      });
      setFriends(sorted);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!showPicker) { setSearch(''); return; }
    setTimeout(() => searchRef.current?.focus(), 50);
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

  const q = search.toLowerCase().trim();
  const filteredEmojis = q
    ? EMOJI_DATA.filter(d => d.keywords.some(k => k.includes(q))).map(d => d.emoji)
    : EMOJI_DATA.map(d => d.emoji);

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
                <input
                  ref={searchRef}
                  className="nfm-picker-search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('fridges.emojiSearch')}
                />
                <div className="nfm-picker-grid">
                  {filteredEmojis.length > 0 ? filteredEmojis.map(e => (
                    <button
                      key={e}
                      className={`nfm-picker-option${e === emoji ? ' selected' : ''}`}
                      onClick={() => { setEmoji(e); setShowPicker(false); }}
                      type="button"
                    >
                      {e}
                    </button>
                  )) : (
                    <p className="nfm-picker-empty">{t('fridges.emojiNoResult')}</p>
                  )}
                </div>
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
            <input
              className="nfm-friend-search"
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              placeholder={t('fridges.friendSearch')}
            />
            {friends.filter(f => {
              const q = friendSearch.toLowerCase();
              return !q || f.displayName.toLowerCase().includes(q) || (f.firstName ?? '').toLowerCase().includes(q);
            }).map(f => {
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
