
import React from 'react';

interface TabsProps {
  activeTab: 'search' | 'image';
  setActiveTab: (tab: 'search' | 'image') => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tabName: 'search' | 'image') => {
    return activeTab === tabName
      ? 'bg-blue-600 text-white'
      : 'bg-slate-800 text-slate-400 hover:bg-slate-700/50';
  };

  return (
    <div className="flex space-x-2 p-1 bg-slate-800/50 border border-slate-700 rounded-full mb-8">
      <button
        onClick={() => setActiveTab('search')}
        className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${getTabClass('search')}`}
      >
        Search
      </button>
      <button
        onClick={() => setActiveTab('image')}
        className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 ${getTabClass('image')}`}
      >
        Generate Image
      </button>
    </div>
  );
};

export default Tabs;
