import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { SunIcon, MoonIcon, MonitorIcon } from '@/components/icons/Icons';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light' as const, label: '라이트', icon: SunIcon },
    { value: 'dark' as const, label: '다크', icon: MoonIcon },
    { value: 'system' as const, label: '시스템', icon: MonitorIcon },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        title="테마 변경"
      >
        <currentTheme.icon size={20} />
        <span className="text-sm hidden md:inline">{currentTheme.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2 min-w-[140px] z-20">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  theme === value ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{label}</span>
                {theme === value && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
