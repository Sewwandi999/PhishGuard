import { useState } from 'react';
import React from 'react';

import { Calendar, Download, FileText, Eye, Printer } from 'lucide-react';

export default function ReportGenerator() {
  const [startDate, setStartDate] = useState('2025-12-01');
  const [endDate, setEndDate] = useState('2025-12-12');
  const [reportType, setReportType] = useState('summary');
  const [showPreview, setShowPreview] = useState(false);

  const reportData = {
    period: `${startDate} to ${endDate}`,
    totalScans: 1942,
    phishingDetected: 329,
    legitimate: 1486,
    suspicious: 127,
    accuracy: 97.8,
    topPhishingKeywords: [
      { keyword: 'verify account', occurrences: 87 },
      { keyword: 'urgent action', occurrences: 65 },
      { keyword: 'click here', occurrences: 58 },
      { keyword: 'suspended', occurrences: 45 },
      { keyword: 'confirm identity', occurrences: 38 },
    ],
    dailyBreakdown: [
      { date: '2025-12-12', scans: 287, phishing: 34 },
      { date: '2025-12-11', scans: 312, phishing: 52 },
      { date: '2025-12-10', scans: 268, phishing: 38 },
      { date: '2025-12-09', scans: 294, phishing: 45 },
      { date: '2025-12-08', scans: 301, phishing: 61 },
    ],
  };

  const handleDownloadPDF = async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      alert("Please log in again to download a PDF report.");
      return;
    }

    const typeMap = {
      summary: "detection-summary",
      detailed: "threat-analysis",
      trends: "user-activity",
      keywords: "model-performance",
    };

    try {
      const res = await fetch("http://localhost:5000/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `PhishGuard ${reportType} report`,
          type: typeMap[reportType] || "detection-summary",
          startDate,
          endDate: `${endDate}T23:59:59.999Z`,
          format: "pdf",
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("pdf")) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Could not generate PDF report.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phishing_report_${startDate}_to_${endDate}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not download PDF.");
    }
  };

  const handleDownloadCSV = () => {
    const csv = [
      ['Phishing Detection Report'],
      ['Period', reportData.period],
      [''],
      ['Summary Statistics'],
      ['Metric', 'Value'],
      ['Total Scans', reportData.totalScans],
      ['Phishing Detected', reportData.phishingDetected],
      ['Legitimate Messages', reportData.legitimate],
      ['Suspicious Messages', reportData.suspicious],
      ['Detection Accuracy', `${reportData.accuracy}%`],
      [''],
      ['Daily Breakdown'],
      ['Date', 'Total Scans', 'Phishing Detected'],
      ...reportData.dailyBreakdown.map(day => [day.date, day.scans, day.phishing]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishing_report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Report Generator</h1>
        <p className="text-gray-600">Generate comprehensive phishing detection reports</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-gray-900 mb-6">Configure Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-gray-700 mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-700 mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Report Type */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Report Type</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="summary">Summary Report</option>
                <option value="detailed">Detailed Analysis</option>
                <option value="trends">Trend Analysis</option>
                <option value="keywords">Keyword Analysis</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <h2>Phishing Detection Report</h2>
            <p>Period: {reportData.period}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Statistics */}
            <div>
              <h3 className="text-gray-900 mb-4">Summary Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-blue-600 mb-1">Total Scans</p>
                  <p className="text-blue-900">{reportData.totalScans.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-red-600 mb-1">Phishing Detected</p>
                  <p className="text-red-900">{reportData.phishingDetected.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-green-600 mb-1">Legitimate</p>
                  <p className="text-green-900">{reportData.legitimate.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-purple-600 mb-1">Accuracy</p>
                  <p className="text-purple-900">{reportData.accuracy}%</p>
                </div>
              </div>
            </div>

            {/* Top Phishing Keywords */}
            <div>
              <h3 className="text-gray-900 mb-4">Top Phishing Keywords</h3>
              <div className="space-y-2">
                {reportData.topPhishingKeywords.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{item.keyword}</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                      {item.occurrences} occurrences
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Breakdown */}
            <div>
              <h3 className="text-gray-900 mb-4">Daily Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-gray-700">Total Scans</th>
                      <th className="px-4 py-3 text-left text-gray-700">Phishing Detected</th>
                      <th className="px-4 py-3 text-left text-gray-700">Detection Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.dailyBreakdown.map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{day.date}</td>
                        <td className="px-4 py-3 text-gray-600">{day.scans}</td>
                        <td className="px-4 py-3 text-red-600">{day.phishing}</td>
                        <td className="px-4 py-3 text-gray-900">
                          {((day.phishing / day.scans) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200 text-center text-gray-600">
              <p>Generated on {new Date().toLocaleString()}</p>
              <p>PhishGuard Detection System - Sri Lanka</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
