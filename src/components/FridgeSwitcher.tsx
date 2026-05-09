import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge } from '../types/Fridge';
import './FridgeSwitcher.css';

interface Props {
  fridges: Fridge[];
  activeFridgeId: string;
  onSwitch: (fridgeId: string) => void;
  onCreateFridge: (name: string) => Promise<unknown>;
}

export const FridgeSwitcher = ({ fridges, activeFridgeId, onSwitch, onCreateFridge }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeFridge = fridges.find(f => f.id === activeFridgeId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await onCreateFridge(newName.trim());
      setNewName('');
      setCreating(false);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (fridges.length <= 1 && !open) {
    return null;
  }

  return (
    <div className="fridge-switcher" ref={ref}>
      <button
        className="fridge-switcher-btn"
        onClick={() => setOpen(o => !o)}
      >
        <span className="fridge-switcher-icon">{activeFridge?.emoji ?? '🧊'}</span>
        <span className="fridge-switcher-name">{activeFridge?.name ?? '…'}</span>
        <span className="fridge-switcher-chevron">▾</span>
      </button>

      {open && (
        <div className="fridge-switcher-dropdown">
          {fridges.map(f => (
            <button
              key={f.id}
              className={`fridge-switcher-item${f.id === activeFridgeId ? ' active' : ''}`}
              onClick={() => { onSwitch(f.id); setOpen(false); }}
            >
              {f.id === activeFridgeId && <span className="fridge-switcher-check">✓</span>}
              <span className="fridge-switcher-item-emoji">{f.emoji ?? '🧊'}</span>
              {f.name}
            </button>
          ))}

          <div className="fridge-switcher-divider" />

          {creating ? (
            <div className="fridge-switcher-create">
              <input
                autoFocus
                className="fridge-switcher-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={t('fridges.namePlaceholder')}
                maxLength={40}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                }}
              />
              <button
                className="fridge-switcher-create-btn"
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
              >
                {t('fridges.create')}
              </button>
            </div>
          ) : (
            <button
              className="fridge-switcher-item fridge-switcher-item--new"
              onClick={() => setCreating(true)}
            >
              + {t('fridges.newFridge')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
