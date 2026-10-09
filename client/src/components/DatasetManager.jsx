import { useState } from 'react';
import React from 'react';
import { 
  Upload, 
  Download, 
  Search, 
  Edit2, 
  Trash2, 
  Plus, 
  Save, 
  X
} from 'lucide-react';


export default function DatasetManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLabel, setFilterLabel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [editedLabel, setEditedLabel] = useState('Phishing');
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 10;

  const [dataset, setDataset] = useState([
    {
      id: 1,
      message: 'Your account has been suspended. Verify immediately: bit.ly/verify123',
      label: 'Phishing',
      addedDate: '2025-12-10',
      addedBy: 'Admin',
      source: 'User Report',
    },
    {
      id: 2,
      message: 'Your transaction of Rs. 5,000 was successful. Ref: TXN12345',
      label: 'Legitimate',
      addedDate: '2025-12-10',
      addedBy: 'System',
      source: 'Bank SMS',
    },
    {
      id: 3,
      message: 'URGENT: Click here to confirm your identity or account will be locked',
      label: 'Phishing',
      addedDate: '2025-12-09',
      addedBy: 'Analyst',
      source: 'Public Dataset',
    },
    {
      id: 4,
      message: 'Your OTP is 847293. Valid for 5 minutes.',
      label: 'Legitimate',
      addedDate: '2025-12-09',
      addedBy: 'System',
      source: 'Bank SMS',
    },
    {
      id: 5,
      message: 'Congratulations! You won Rs. 100,000. Claim now!',
      label: 'Phishing',
      addedDate: '2025-12-08',
      addedBy: 'Admin',
      source: 'User Report',
    },
    {
      id: 6,
      message: 'Your credit card payment is due on 15th Dec. Amount: Rs. 12,500',
      label: 'Legitimate',
      addedDate: '2025-12-08',
      addedBy: 'System',
      source: 'Bank Email',
    },
  ]);

  // Filter dataset
  const filteredDataset = dataset.filter((entry) => {
    const matchesSearch = entry.message
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLabel =
      filterLabel === "all" || entry.label === filterLabel;
    return matchesSearch && matchesLabel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDataset.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDataset = filteredDataset.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSave = (id) => {
    setDataset(dataset.map(entry =>
      entry.id === id
        ? { ...entry, message: editedMessage, label: editedLabel }
        : entry
    ));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setDataset(dataset.filter(entry => entry.id !== id));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`File "${file.name}" uploaded successfully! (Mock implementation)`);
    }
  };

  const handleDownloadCSV = () => {
    const csv = [
      ['ID', 'Message', 'Label', 'Added Date', 'Added By', 'Source'],
      ...filteredDataset.map(entry => [
        entry.id,
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.label,
        entry.addedDate,
        entry.addedBy,
        entry.source,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishing_dataset_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Dataset Manager</h1>
          <p className="text-gray-600">Manage training dataset for ML models</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-gray-900 mb-4">Upload Dataset</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            className="hidden"
            id="dataset-upload"
          />
          <label
            htmlFor="dataset-upload"
            className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg border-2 border-dashed border-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            <span>Upload CSV or JSON file</span>
          </label>
          <p className="text-gray-600">Supported formats: .csv, .json</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Search Messages</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dataset..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Filter by Label</label>
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Labels</option>
              <option value="Phishing">Phishing</option>
              <option value="Legitimate">Legitimate</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-600 mb-1">Total Entries</p>
            <p className="text-blue-900">{filteredDataset.length}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-red-600 mb-1">Phishing</p>
            <p className="text-red-900">{filteredDataset.filter(e => e.label === 'Phishing').length}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-green-600 mb-1">Legitimate</p>
            <p className="text-green-900">{filteredDataset.filter(e => e.label === 'Legitimate').length}</p>
          </div>
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-gray-700">Message</th>
                <th className="px-6 py-4 text-left text-gray-700">Label</th>
                <th className="px-6 py-4 text-left text-gray-700">Source</th>
                <th className="px-6 py-4 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDataset.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900">{entry.id}</td>
                  <td className="px-6 py-4">
                    {editingId === entry.id ? (
                      <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900 max-w-md">{entry.message}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === entry.id ? (
                      <select
                        value={editedLabel}
                        onChange={(e) => setEditedLabel(e.target.value)}
                        className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Phishing">Phishing</option>
                        <option value="Legitimate">Legitimate</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full ${
                        entry.label === 'Phishing'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {entry.label}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{entry.source}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingId === entry.id ? (
                        <>
                          <button
                            onClick={() => handleSave(entry.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDataset.length)} of {filteredDataset.length} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-gray-900 mb-6">Add New Dataset Entry</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Message Content</label>
                <textarea
                  placeholder="Enter the message text..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Label</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Phishing">Phishing</option>
                  <option value="Legitimate">Legitimate</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Source</label>
                <input
                  type="text"
                  placeholder="e.g., User Report, Public Dataset"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Entry added successfully!');
                    setShowAddModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
