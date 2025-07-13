import { ShoppingCart, Flame, Scan, Trophy, User } from 'lucide-react';
import React from 'react';

interface BottomTabBarProps {
  active: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { key: 'list', label: 'List', icon: <ShoppingCart className="w-6 h-6" /> },
  { key: 'quests', label: 'Quests', icon: <Flame className="w-6 h-6" /> },
  { key: 'collect', label: '', icon: <Scan className="w-8 h-8" />, fab: true },
  { key: 'rewards', label: 'Rewards', icon: <Trophy className="w-6 h-6" /> },
  { key: 'leaders', label: 'Leaders', icon: <User className="w-6 h-6" /> },
];

const BottomTabBar: React.FC<BottomTabBarProps> = ({ active, onTabChange }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-between items-center px-2 py-1 md:hidden rounded-t-2xl shadow-2xl" style={{ height: 72 }}>
    {tabs.map((tab, i) =>
      tab.fab ? (
        <button
          key={tab.key}
          className={`relative -mt-8 bg-yellow-400 shadow-lg shadow-yellow-200/50 border-4 border-white rounded-full w-16 h-16 flex items-center justify-center transition-all duration-200 ${active === tab.key ? 'scale-110' : 'scale-100'}`}
          onClick={() => onTabChange(tab.key)}
          aria-label="Scan"
        >
          {tab.icon}
        </button>
      ) : (
        <button
          key={tab.key}
          className={`flex flex-col items-center justify-center flex-1 px-1 py-2 text-xs font-semibold transition-colors duration-200 ${active === tab.key ? 'text-yellow-500' : 'text-gray-500'}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon}
          <span className="mt-1 font-sans">{tab.label}</span>
        </button>
      )
    )}
  </nav>
);

export default BottomTabBar; 