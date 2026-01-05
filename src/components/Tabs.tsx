import { ReactNode } from 'react';
import './Tabs.css';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

export const Tabs = ({ activeTab, onTabChange, children }: TabsProps) => {
  const tabs = [
    { id: 'fridge', label: 'In my fridge' },
    { id: 'cook', label: 'What to cook' },
    { id: 'seasonal', label: 'Seasonal products' }
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

