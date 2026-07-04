import React, { useState, useMemo, useCallback } from 'react';
import {
  VirtualScrollList,
  dataCache,
  useCachedData,
  PerformanceMetrics,
  LazyLoad,
  useDebounce
} from '@/components/common/PerformanceComponents';
import { ZapIcon } from '@/components/icons/Icons';

const PerformanceOptimizationDemo: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'virtual' | 'cache' | 'lazy' | 'comparison'>('virtual');

  // Generate large dataset for virtual scrolling demo
  const largeDataset = useMemo(() => {
    return Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.random() * 1000,
      category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }, []);

  // Simulated API fetcher
  const fetchData = async (): Promise<any[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Data 1', value: 100 },
          { id: 2, name: 'Data 2', value: 200 },
          { id: 3, name: 'Data 3', value: 300 }
        ]);
      }, 1000);
    });
  };

  const { data: cachedData, loading: cacheLoading, refetch } = useCachedData('demo-data', fetchData, 10000);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredData = useMemo(() => {
    return largeDataset.filter(item =>
      item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [largeDataset, debouncedSearchTerm]);

  // Regular rendering (for comparison)
  const RegularList = ({ data }: { data: typeof largeDataset }) => (
    <div style={{ height: '400px', overflow: 'auto' }} className="border dark:border-gray-700 rounded-lg">
      {data.slice(0, 100).map((item) => (
        <div key={item.id} className="p-3 border-b dark:border-gray-700">
          <div className="flex justify-between">
            <span className="font-medium">{item.name}</span>
            <span className="text-gray-500">{item.category}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Value: {item.value.toFixed(2)}
          </div>
        </div>
      ))}
      {data.length > 100 && (
        <div className="p-3 text-center text-gray-500">
          Showing 100 of {data.length} items (performance limited)
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ZapIcon size={32} />
          <h1 className="text-3xl font-bold">Performance Optimization</h1>
        </div>
        <p className="text-cyan-100">Virtual scrolling, memoization, caching, and lazy loading techniques</p>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center justify-between">
        <span className="font-medium text-gray-700 dark:text-gray-300">Current Performance:</span>
        <PerformanceMetrics />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('virtual')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'virtual'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Virtual Scrolling
          </button>
          <button
            onClick={() => setSelectedTab('cache')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'cache'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Data Caching
          </button>
          <button
            onClick={() => setSelectedTab('lazy')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'lazy'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Lazy Loading
          </button>
          <button
            onClick={() => setSelectedTab('comparison')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'comparison'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Comparison
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {selectedTab === 'virtual' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Virtual Scrolling Demo ({largeDataset.length.toLocaleString()} items)</h3>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items (debounced)..."
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 mb-4"
              />
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <VirtualScrollList
                  items={filteredData}
                  itemHeight={60}
                  containerHeight={400}
                  renderItem={(item) => (
                    <div className="p-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Value: {item.value.toFixed(2)} | {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Showing {filteredData.length.toLocaleString()} items efficiently using virtual scrolling
              </p>
            </div>
          </div>
        )}

        {selectedTab === 'cache' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Data Caching Demo</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cache Size:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{dataCache.size()} entries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cached Data:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">
                  {cachedData ? 'Available' : 'Not cached'}
                </span>
              </div>
            </div>

            {cacheLoading ? (
              <div className="text-center py-8 text-gray-500">Loading data...</div>
            ) : cachedData ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 dark:text-green-400">✓ Data loaded from cache or API</p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200">{JSON.stringify(cachedData, null, 2)}</pre>
                </div>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refetch (Bypass Cache)
                </button>
              </div>
            ) : null}
          </div>
        )}

        {selectedTab === 'lazy' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Lazy Loading Demo</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Scroll down to see components load on demand</p>

            <div className="space-y-4" style={{ height: '500px', overflow: 'auto' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <LazyLoad key={i}>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Lazy Loaded Item {i + 1}</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      This content was only loaded when it became visible in the viewport, improving initial page load performance.
                    </p>
                  </div>
                </LazyLoad>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'comparison' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Performance Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">❌ Regular Rendering</h4>
                <RegularList data={largeDataset} />
                <p className="text-sm text-gray-500 mt-2">
                  Renders all items in DOM - causes performance issues with large datasets
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✓ Virtual Scrolling</h4>
                <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                  <VirtualScrollList
                    items={largeDataset}
                    itemHeight={60}
                    containerHeight={340}
                    renderItem={(item) => (
                      <div className="p-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-sm">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Value: {item.value.toFixed(2)}
                        </div>
                      </div>
                    )}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Only renders visible items - handles {largeDataset.length.toLocaleString()} items smoothly
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">📜</span>
            Virtual Scrolling
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Only render visible items for massive lists. Handles 100K+ items smoothly.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">💾</span>
            Data Caching
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Store API responses in memory with configurable TTL to reduce server requests.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            Lazy Loading
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Load components only when they enter the viewport for faster initial load.
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Memoization
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cache component renders and expensive computations using React.memo and useMemo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizationDemo;
