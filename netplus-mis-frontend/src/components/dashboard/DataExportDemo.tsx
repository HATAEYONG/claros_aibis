import React, { useState } from 'react';
import { ExportButton, ScheduledReports, ScheduleConfig } from '@/components/common/DataExport';
import { DownloadIcon } from '@/components/icons/Icons';

const DataExportDemo: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([
    {
      id: 'sched-001',
      name: 'Weekly Sales Report',
      description: 'Automated weekly sales summary sent to sales team',
      recipients: ['sales@company.com', 'manager@company.com'],
      format: 'excel',
      schedule: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      enabled: true
    },
    {
      id: 'sched-002',
      name: 'Monthly Executive Summary',
      description: 'Comprehensive monthly report for executive team',
      recipients: ['ceo@company.com', 'cfo@company.com'],
      format: 'pdf',
      schedule: 'monthly',
      dayOfMonth: 1,
      time: '08:00',
      enabled: true
    }
  ]);

  // Sample data for export
  const sampleData = [
    { product: 'Product A', sales: 125000, quantity: 450, revenue: 152000000 },
    { product: 'Product B', sales: 98000, quantity: 320, revenue: 89000000 },
    { product: 'Product C', sales: 76000, quantity: 280, revenue: 67000000 },
    { product: 'Product D', sales: 54000, quantity: 190, revenue: 43000000 },
    { product: 'Product E', sales: 42000, quantity: 150, revenue: 31000000 },
    { product: 'Product F', sales: 38000, quantity: 120, revenue: 28000000 },
    { product: 'Product G', sales: 29000, quantity: 95, revenue: 19000000 },
    { product: 'Product H', sales: 21000, quantity: 70, revenue: 14000000 }
  ];

  const handleCreateSchedule = (schedule: Omit<ScheduleConfig, 'id'>) => {
    const newSchedule: ScheduleConfig = {
      ...schedule,
      id: `sched-${Date.now()}`
    };
    setSchedules([...schedules, newSchedule]);
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(schedules.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <DownloadIcon size={32} />
          <h1 className="text-3xl font-bold">Data Export & Scheduling</h1>
        </div>
        <p className="text-green-100">Export data to Excel, PDF, CSV and schedule automated email reports</p>
      </div>

      {/* Export Demo Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Quick Export</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">Sales Data Export</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{sampleData.length} rows of data</p>
          </div>
          <ExportButton data={sampleData} filename="sales_data" />
        </div>

        {/* Data Preview */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Product</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Sales</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Quantity</th>
                <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Revenue (KRW)</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, idx) => (
                <tr key={idx} className="border-b dark:border-gray-700">
                  <td className="py-2 px-3 text-gray-800 dark:text-gray-200">{row.product}</td>
                  <td className="text-right py-2 px-3 text-gray-800 dark:text-gray-200">{row.sales.toLocaleString()}</td>
                  <td className="text-right py-2 px-3 text-gray-800 dark:text-gray-200">{row.quantity}</td>
                  <td className="text-right py-2 px-3 text-gray-800 dark:text-gray-200">{row.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <ScheduledReports
          schedules={schedules}
          onCreateSchedule={handleCreateSchedule}
          onToggleSchedule={handleToggleSchedule}
          onDeleteSchedule={handleDeleteSchedule}
        />
      </div>

      {/* Export Formats Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Excel Export
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export to XLS format with full formatting support. Perfect for further analysis in Excel.
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">📄</span>
            PDF Export
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate professional PDF reports for sharing and archiving. Requires additional libraries.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            CSV Export
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lightweight comma-separated values format. Ideal for data processing and system integration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataExportDemo;
