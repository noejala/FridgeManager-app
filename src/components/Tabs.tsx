import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import './Tabs.css';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

export const Tabs = ({ activeTab, onTabChange, children }: TabsProps) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'fridge', label: t('tabs.fridge') },
    { id: 'cook', label: t('tabs.cook') },
    { id: 'seasonal', label: t('tabs.seasonal') },
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
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {children}
      </div>
    </div>
  );
};
