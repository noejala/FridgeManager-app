import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge } from '../types/Fridge';
import { FriendsPanel } from './FriendsPanel';
import { FridgeSettings } from './FridgeSettings';
import './SharingTab.css';

interface Props {
  displayName: string;
  fridges: Fridge[];
  activeFridgeId: string;
  currentUserId: string;
  onFridgesChange: () => void;
  onActiveFridgeChange: (id: string) => void;
  onCreateFridge: (name: string) => Promise<Fridge>;
  pendingFriendCount: number;
}

type SharingSection = 'friends' | 'fridges';

export function SharingTab({
  displayName,
  fridges, currentUserId,
  onFridgesChange, onActiveFridgeChange, onCreateFridge,
  pendingFriendCount,
}: Props) {
  const { t } = useTranslation();
  const [section, setSection] = useState<SharingSection>('fridges');

  return (
    <div className="sharing-tab">
      <div className="sharing-segmented">
        <button
          className={`sharing-seg-btn${section === 'fridges' ? ' active' : ''}`}
          onClick={() => setSection('fridges')}
        >
          {t('sharing.fridges')}
        </button>
        <button
          className={`sharing-seg-btn${section === 'friends' ? ' active' : ''}`}
          onClick={() => setSection('friends')}
        >
          {t('sharing.friends')}
          {pendingFriendCount > 0 && (
            <span className="sharing-seg-badge">{pendingFriendCount}</span>
          )}
        </button>
      </div>

      {section === 'friends' && (
        <FriendsPanel displayName={displayName} />
      )}

      {section === 'fridges' && (
        <FridgeSettings
          fridges={fridges}
          currentUserId={currentUserId}
          onFridgesChange={onFridgesChange}
          onActiveFridgeChange={onActiveFridgeChange}
          onCreateFridge={onCreateFridge}
        />
      )}
    </div>
  );
}
