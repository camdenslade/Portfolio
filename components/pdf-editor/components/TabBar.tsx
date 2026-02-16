import type { Tab } from '../types/pdf';

type TabBarProps = {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
};

export const TabBar = ({ tabs, activeTabId, onSelectTab, onCloseTab }: TabBarProps) => {
  if (tabs.length <= 1) return null;

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'tab-active' : ''}`}
          onClick={() => onSelectTab(tab.id)}
          onAuxClick={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              onCloseTab(tab.id);
            }
          }}
          title={tab.filePath ?? tab.title}
        >
          <span className="tab-title">{tab.title}</span>
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            title="Close tab"
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  );
};
