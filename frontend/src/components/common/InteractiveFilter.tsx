import React, { useState, useMemo } from 'react';
import { FilterIcon, XIcon, ChevronDownIcon } from '@/components/icons/Icons';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date';
  options?: FilterOption[];
  min?: number;
  max?: number;
  value?: any;
}

interface InteractiveFilterProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  onReset?: () => void;
  compact?: boolean;
}

const InteractiveFilter: React.FC<InteractiveFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
  compact = false
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    filters.forEach(f => {
      if (f.value !== undefined) initial[f.id] = f.value;
    });
    return initial;
  });

  const activeFilterCount = Object.values(activeFilters).filter(
    v => v !== undefined && v !== null && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters, [filterId]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const cleared: Record<string, any> = {};
    setActiveFilters(cleared);
    onFilterChange(cleared);
    onReset?.();
  };

  const toggleExpand = (filterId: string) => {
    setExpanded(expanded === filterId ? null : filterId);
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = activeFilters[filter.id];
    const isActive = value !== undefined && value !== null && value !== '' &&
                    (Array.isArray(value) ? value.length > 0 : true);

    if (filter.type === 'select') {
      return (
        <div key={filter.id} className="space-y-2">
          <button
            onClick={() => toggleExpand(filter.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="font-medium text-gray-700 dark:text-gray-200">{filter.label}</span>
            <div className="flex items-center gap-2">
              {isActive && (
                <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded">
                  {filter.options?.find(o => o.value === value)?.label || value}
                </span>
              )}
              <ChevronDownIcon size={16} className={`transition-transform ${expanded === filter.id ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded === filter.id && (
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 space-y-1">
              <button
                onClick={() => handleFilterChange(filter.id, undefined)}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                All
              </button>
              {filter.options?.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(filter.id, option.value)}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                    value === option.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-400">({option.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (filter.type === 'multiselect') {
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div key={filter.id} className="space-y-2">
          <button
            onClick={() => toggleExpand(filter.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="font-medium text-gray-700 dark:text-gray-200">{filter.label}</span>
            <div className="flex items-center gap-2">
              {isActive && (
                <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded">
                  {selectedValues.length}
                </span>
              )}
              <ChevronDownIcon size={16} className={`transition-transform ${expanded === filter.id ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded === filter.id && (
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 space-y-1">
              {filter.options?.map(option => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, option.value]
                          : selectedValues.filter(v => v !== option.value);
                        handleFilterChange(filter.id, newValues.length > 0 ? newValues : undefined);
                      }}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className={`flex-1 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-400">({option.count})</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (filter.type === 'range') {
      return (
        <div key={filter.id} className="space-y-2">
          <button
            onClick={() => toggleExpand(filter.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="font-medium text-gray-700 dark:text-gray-200">{filter.label}</span>
            <div className="flex items-center gap-2">
              {isActive && (
                <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded">
                  {Array.isArray(value) ? value.join(' - ') : value}
                </span>
              )}
              <ChevronDownIcon size={16} className={`transition-transform ${expanded === filter.id ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {expanded === filter.id && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min={filter.min}
                  max={filter.max}
                  value={Array.isArray(value) ? value[0] || '' : ''}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [filter.min, filter.max];
                    handleFilterChange(filter.id, [Number(e.target.value), current[1]]);
                  }}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  min={filter.min}
                  max={filter.max}
                  value={Array.isArray(value) ? value[1] || '' : ''}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [filter.min, filter.max];
                    handleFilterChange(filter.id, [current[0], Number(e.target.value)]);
                  }}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              <input
                type="range"
                min={filter.min}
                max={filter.max}
                value={Array.isArray(value) ? value[0] || filter.min : filter.min}
                onChange={(e) => {
                  const current = Array.isArray(value) ? value : [filter.min, filter.max];
                  handleFilterChange(filter.id, [Number(e.target.value), current[1]]);
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(expanded === 'main' ? null : 'main')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeFilterCount > 0
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FilterIcon size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{activeFilterCount}</span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Reset filters"
          >
            <XIcon size={18} />
          </button>
        )}
        {expanded === 'main' && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 p-4 z-50 space-y-3">
            {filters.map(filter => renderFilter(filter))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="text-blue-600" size={20} />
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset All
          </button>
        )}
      </div>
      <div className="space-y-3">
        {filters.map(filter => renderFilter(filter))}
      </div>
    </div>
  );
};

export default InteractiveFilter;
