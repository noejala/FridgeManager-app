import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './Tabs.css';

const FridgeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M4 10h16"/>
    <path d="M9 6v3"/>
    <path d="M9 15v4"/>
  </svg>
);

const CookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
  </svg>
);

const SeasonalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  urgentCount?: number;
}

export const Tabs = ({ activeTab, onTabChange, children, urgentCount = 0 }: TabsProps) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'fridge', label: t('tabs.fridge'), icon: <FridgeIcon /> },
    { id: 'cook', label: t('tabs.cook'), icon: <CookIcon /> },
    { id: 'seasonal', label: t('tabs.seasonal'), icon: <SeasonalIcon /> },
  ];

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon-wrapper">
              <span className="tab-icon">{tab.icon}</span>
            </span>
            <span className="tab-label">{tab.label}</span>
            {tab.id === 'fridge' && urgentCount > 0 && (
              <span className="tab-badge">{urgentCount > 99 ? '99+' : urgentCount}</span>
            )}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {children}
      </div>
    </div>
  );
};
