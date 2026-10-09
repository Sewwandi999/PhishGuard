import { useState } from 'react';
import React from 'react';

import { Search, Filter, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock logs data
  const allLogs = [
    { id: 'MSG001', timestamp: '2025-12-12 14:32:15', sender: '+94771234567', message: 'Your account has been suspended. Click here to verify...', label: 'Phishing', probability: 0.95, model: 'v1.3' },
    { id: 'MSG002', timestamp: '2025-12-12 14:28:42', sender: 'noreply@commercialbank.lk', message: 'Your transaction of Rs. 5,000 was successful. Ref: TXN45678', label: 'Legitimate', probability: 0.98, model: 'v1.3' },
    { id: 'MSG003', timestamp: '2025-12-12 14:15:33', sender: '+94712345678', message: 'Urgent: Confirm your identity within 24 hours or account will be locked', label: 'Phishing', probability: 0.92, model: 'v1.3' },
    { id: 'MSG004', timestamp: '2025-12-12 13:58:21', sender: 'alerts@dfcc.lk', message: 'Your OTP for login is 847293. Valid for 5 minutes.', label: 'Legitimate', probability: 0.99, model: 'v1.3' },
    { id: 'MSG005', timestamp: '2025-12-12 13:45:17', sender: 'verify-bank@gmail.com', message: 'Click this link to update your banking information immediately', label: 'Phishing', probability: 0.89, model: 'v1.3' },
    { id: 'MSG006', timestamp: '2025-12-12 13:32:09', sender: '+94723456789', message: 'Congratulations! You have won Rs. 100,000. Call now to claim...', label: 'Phishing', probability: 0.94, model: 'v1.2' },
    { id: 'MSG007', timestamp: '2025-12-12 13:21:45', sender: 'noreply@sampath.lk', message: 'Your credit card payment of Rs. 12,500 is due on 15th Dec', label: 'Legitimate', probability: 0.97, model: 'v1.3' },
    { id: 'MSG008', timestamp: '2025-12-12 13:05:33', sender: '+94765432109', message: 'Update your bank details to avoid service interruption', label: 'Phishing', probability: 0.88, model: 'v1.3' },
    { id: 'MSG009', timestamp: '2025-12-12 12:48:12', sender: 'security@hnb.lk', message: 'Security Alert: New device logged into your account from Colombo', label: 'Legitimate', probability: 0.96, model: 'v1.3' },
    { id: 'MSG010', timestamp: '2025-12-12 12:35:28', sender: '+94778901234', message: 'Your account is at risk. Verify now: bit.ly/verify123', label: 'Phishing', probability: 0.93, model: 'v1.3' },
    { id: 'MSG011', timestamp: '2025-12-12 12:18:55', sender: 'noreply@boc.lk', message: 'Monthly statement for Nov 2025 is now available', label: 'Legitimate', probability: 0.98, model: 'v1.3' },
    { id: 'MSG012', timestamp: '2025-12-12 11:59:41', sender: '+94756789012', message: 'Final notice: Account will be closed unless you respond', label: 'Phishing', probability: 0.91, model: 'v1.2' },
  ];

  // Filter logs
  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.sender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLabel === 'all' || log.label.toLowerCase() === filterLabel.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    const csv = [
      ['ID', 'Timestamp', 'Sender', 'Message', 'Label', 'Probability', 'Model Version'],
      ...filteredLogs.map(log => [
        log.id,
        log.timestamp,
        log.sender,
        log.message,
        log.label,
        log.probability,
        log.model,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishing_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Logs Viewer</h1>
          <p className="text-gray-600">View and filter all scanned messages</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Search Messages</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by message content or sender..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter */}
          <div>
            <label className="block text-gray-700 mb-2">Filter by Label</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Messages</option>
                <option value="phishing">Phishing</option>
                <option value="legitimate">Legitimate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-gray-600 mb-1">Total Logs</p>
            <p className="text-gray-900">{filteredLogs.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">Phishing</p>
            <p className="text-red-600">{filteredLogs.filter(l => l.label === 'Phishing').length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-1">Legitimate</p>
            <p className="text-green-600">{filteredLogs.filter(l => l.label === 'Legitimate').length}</p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-gray-700">Timestamp</th>
                <th className="px-6 py-4 text-left text-gray-700">Sender</th>
                <th className="px-6 py-4 text-left text-gray-700">Message</th>
                <th className="px-6 py-4 text-left text-gray-700">Label</th>
                <th className="px-6 py-4 text-left text-gray-700">Probability</th>
                <th className="px-6 py-4 text-left text-gray-700">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900">{log.id}</td>
                  <td className="px-6 py-4 text-gray-600">{log.timestamp}</td>
                  <td className="px-6 py-4 text-gray-600">{log.sender}</td>
                  <td className="px-6 py-4 text-gray-900 max-w-md truncate">{log.message}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full ${
                      log.label === 'Phishing' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {log.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{(log.probability * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-gray-600">{log.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
