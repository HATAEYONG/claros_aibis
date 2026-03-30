import React, { useState } from 'react';
import { DownloadIcon, FileIcon, CalendarIcon, MailIcon, CheckIcon } from '@/components/icons/Icons';

export interface ExportConfig {
  format: 'excel' | 'pdf' | 'csv';
  data: any[];
  filename: string;
  includeHeaders?: boolean;
}

export interface ScheduleConfig {
  id: string;
  name: string;
  description: string;
  recipients: string[];
  format: 'excel' | 'pdf' | 'csv';
  schedule: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  enabled: boolean;
}

interface DataExportProps {
  data: any[];
  filename: string;
}

export const ExportButton: React.FC<DataExportProps> = ({ data, filename }) => {
  const [isOpen, setIsOpen] = useState(false);

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
        return stringValue.includes(',') || stringValue.includes('"')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setIsOpen(false);
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    let excelContent = '<html><head><meta charset="UTF-8"></head><body><table>';
    excelContent += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    excelContent += data.map(row =>
      '<tr>' + headers.map(header => `<td>${row[header] ?? ''}</td>`).join('') + '</tr>'
    ).join('');
    excelContent += '</table></body></html>';

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
    setIsOpen(false);
  };

  const exportToPDF = () => {
    alert('PDF export requires additional libraries. Consider using jsPDF or react-pdf for full PDF generation.');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <DownloadIcon size={18} />
        Export
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 py-2 min-w-[160px] z-50">
            <button
              onClick={exportToCSV}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <FileIcon size={16} />
              <span>Export as CSV</span>
            </button>
            <button
              onClick={exportToExcel}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <FileIcon size={16} />
              <span>Export as Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <FileIcon size={16} />
              <span>Export as PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

interface ScheduledReportProps {
  schedules: ScheduleConfig[];
  onCreateSchedule: (schedule: Omit<ScheduleConfig, 'id'>) => void;
  onToggleSchedule: (id: string) => void;
  onDeleteSchedule: (id: string) => void;
}

export const ScheduledReports: React.FC<ScheduledReportProps> = ({
  schedules,
  onCreateSchedule,
  onToggleSchedule,
  onDeleteSchedule
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recipients: '',
    format: 'excel' as 'excel' | 'pdf' | 'csv',
    schedule: 'weekly' as 'daily' | 'weekly' | 'monthly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule: Omit<ScheduleConfig, 'id'> = {
      name: formData.name,
      description: formData.description,
      recipients: formData.recipients.split(',').map(r => r.trim()).filter(r => r),
      format: formData.format,
      schedule: formData.schedule,
      dayOfWeek: formData.schedule === 'weekly' ? formData.dayOfWeek : undefined,
      dayOfMonth: formData.schedule === 'monthly' ? formData.dayOfMonth : undefined,
      time: formData.time,
      enabled: true
    };
    onCreateSchedule(newSchedule);
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      recipients: '',
      format: 'excel',
      schedule: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00'
    });
  };

  const getScheduleText = (schedule: ScheduleConfig) => {
    switch (schedule.schedule) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        return `Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][schedule.dayOfWeek || 1]} at ${schedule.time}`;
      case 'monthly':
        return `Every ${schedule.dayOfMonth || 1}th at ${schedule.time}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MailIcon className="text-blue-600" size={20} />
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Scheduled Reports</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <CalendarIcon size={16} />
          New Schedule
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Create New Schedule</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipients (comma-separated emails)
            </label>
            <input
              type="text"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              placeholder="user1@example.com, user2@example.com"
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule
              </label>
              <select
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value as any })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                required
              />
            </div>
          </div>

          {formData.schedule === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Week
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                  <option key={day} value={idx}>{day}</option>
                ))}
              </select>
            </div>
          )}

          {formData.schedule === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Month
              </label>
              <select
                value={formData.dayOfMonth}
                onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Schedule
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No scheduled reports yet
          </div>
        ) : (
          schedules.map(schedule => (
            <div
              key={schedule.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 ${
                !schedule.enabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{schedule.name}</h4>
                    {!schedule.enabled && (
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{schedule.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      {schedule.format.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      {getScheduleText(schedule)}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                      {schedule.recipients.length} recipient(s)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleSchedule(schedule.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      schedule.enabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                    title={schedule.enabled ? 'Disable' : 'Enable'}
                  >
                    <CheckIcon size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteSchedule(schedule.id)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default { ExportButton, ScheduledReports };
