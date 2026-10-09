import { useState } from 'react';
import React from 'react';
import { History, Filter, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export default function ScanHistory() {
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const scanHistory = [
    {
      id: 1,
      timestamp: '2025-12-12 14:32:15',
      messagePreview: 'Your account has been suspended. Click here to verify...',
      fullMessage: 'Your account has been suspended. Click here to verify your identity immediately: bit.ly/verify123 or your account will be permanently closed.',
      label: 'Phishing',
      probability: 0.95,
      sender: '+94771234567',
    },
    {
      id: 2,
      timestamp: '2025-12-12 14:28:42',
      messagePreview: 'Your transaction of Rs. 5,000 was successful...',
      fullMessage: 'Your transaction of Rs. 5,000 was successful. Reference: TXN45678. Thank you for banking with us.',
      label: 'Legitimate',
      probability: 0.98,
      sender: 'noreply@commercialbank.lk',
    },
    {
      id: 3,
      timestamp: '2025-12-12 14:15:33',
      messagePreview: 'Urgent: Confirm your identity within 24 hours...',
      fullMessage: 'Urgent: Confirm your identity within 24 hours or your account will be locked. Call 0771234567 immediately.',
      label: 'Phishing',
      probability: 0.92,
      sender: '+94712345678',
    },
    {
      id: 4,
      timestamp: '2025-12-12 13:58:21',
      messagePreview: 'Your OTP for login is 847293...',
      fullMessage: 'Your OTP for login is 847293. Valid for 5 minutes. Do not share this code with anyone.',
      label: 'Legitimate',
      probability: 0.99,
      sender: 'alerts@dfcc.lk',
    },
    {
      id: 5,
      timestamp: '2025-12-12 13:45:17',
      messagePreview: 'Click this link to update your banking information...',
      fullMessage: 'Click this link to update your banking information immediately: http://bank-update-verify.com/login',
      label: 'Phishing',
      probability: 0.89,
      sender: 'verify-bank@gmail.com',
    },
    {
      id: 6,
      timestamp: '2025-12-12 13:32:09',
      messagePreview: 'Congratulations! You have won Rs. 100,000...',
      fullMessage: 'Congratulations! You have won Rs. 100,000 in our monthly draw. Call now to claim your prize: 0771112222',
      label: 'Phishing',
      probability: 0.94,
      sender: '+94723456789',
    },
  ];

  const filteredHistory = scanHistory.filter(item => {
    if (filterType === 'all') return true;
    return item.label.toLowerCase() === filterType;
  });

  const handleDelete = (id) => {
    if (confirm('Delete this scan record?')) {
      // Handle deletion
      alert(`Deleted scan record ${id}`);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Scan History</h1>
          <p className="text-gray-600">Your recent message scans and results</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
          <History className="w-5 h-5" />
          <span>{filteredHistory.length} Records</span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({scanHistory.length})
            </button>
            <button
              onClick={() => setFilterType('phishing')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'phishing'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Phishing ({scanHistory.filter(s => s.label === 'Phishing').length})
            </button>
            <button
              onClick={() => setFilterType('legitimate')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'legitimate'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Legitimate ({scanHistory.filter(s => s.label === 'Legitimate').length})
            </button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all ${
              item.label === 'Phishing' ? 'border-red-200' : 'border-green-200'
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full ${
                      item.label === 'Phishing'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.label}
                    </span>
                    <span className="text-gray-600">{item.timestamp}</span>
                  </div>
                  <p className="text-gray-900 mb-2">{item.messagePreview}</p>
                  <p className="text-gray-600">From: {item.sender}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    {expandedId === item.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Probability Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Phishing Probability</span>
                  <span className="text-gray-900">{(item.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.probability > 0.7 ? 'bg-red-500' :
                      item.probability > 0.4 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${item.probability * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === item.id && (
              <div className="px-6 pb-6 pt-0 border-t border-gray-100">
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-gray-900 mb-2">Full Message:</h4>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{item.fullMessage}</p>
                    </div>
                  </div>

                  {item.label === 'Phishing' && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="text-red-900 mb-2">⚠️ Warning:</h4>
                      <p className="text-red-700">
                        This message has been identified as a phishing attempt. Do not click any links 
                        or provide personal information. Report this to your bank immediately.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Full Analysis
                    </button>
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Report to Bank
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredHistory.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-100 text-center">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">No Scan History</h3>
          <p className="text-gray-600">
            {filterType === 'all'
              ? 'You haven\'t scanned any messages yet'
              : `No ${filterType} messages found`}
          </p>
        </div>
      )}
    </div>
  );
}
