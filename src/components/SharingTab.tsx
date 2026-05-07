import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Fridge } from '../types/Fridge';
import { FriendsPanel } from './FriendsPanel';
import { FridgeSettings } from './FridgeSettings';
import './SharingTab.css';

interface Props {
  displayName: string;
  friendCode: string;
  fridges: Fridge[];
  activeFridgeId: string;
  currentUserId: string;
  onFridgesChange: () => void;
  onActiveFridgeChange: (id: string) => void;
  pendingFriendCount: number;
}

type SharingSection = 'friends' | 'fridges';

export function SharingTab({
  displayName, friendCode,
  fridges, activeFridgeId, currentUserId,
  onFridgesChange, onActiveFridgeChange,
  pendingFriendCount,
}: Props) {
  const { t } = useTranslation();
  const [section, setSection] = useState<SharingSection>('friends');

  return (
    <div className="sharing-tab">
      <div className="sharing-segmented">
        <button
          className={`sharing-seg-btn${section === 'friends' ? ' active' : ''}`}
          onClick={() => setSection('friends')}
        >
          {t('sharing.friends')}
          {pendingFriendCount > 0 && (
            <span className="sharing-seg-badge">{pendingFriendCount}</span>
          )}
        </button>
        <button
          className={`sharing-seg-btn${section === 'fridges' ? ' active' : ''}`}
          onClick={() => setSection('fridges')}
        >
          {t('sharing.fridges')}
        </button>
      </div>

      {section === 'friends' && (
        <FriendsPanel displayName={displayName} friendCode={friendCode} />
      )}

      {section === 'fridges' && (
        <FridgeSettings
          fridges={fridges}
          activeFridgeId={activeFridgeId}
          currentUserId={currentUserId}
          onFridgesChange={onFridgesChange}
          onActiveFridgeChange={onActiveFridgeChange}
        />
      )}
    </div>
  );
}
