import { useState } from 'react';
import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Database, FileText, AlertCircle, CheckCircle, Package } from 'lucide-react';

export default function DataQuality() {
  // Mock data for visualizations
  const labelDistribution = [
    { name: 'Phishing', value: 1247, percentage: 45.2 },
    { name: 'Legitimate', value: 1512, percentage: 54.8 },
  ];

  const wordCountDistribution = [
    { range: '0-20', phishing: 234, legitimate: 189 },
    { range: '21-40', phishing: 456, legitimate: 512 },
    { range: '41-60', phishing: 342, legitimate: 478 },
    { range: '61-80', phishing: 156, legitimate: 234 },
    { range: '81-100', phishing: 59, legitimate: 99 },
  ];

  const dataQualityTrend = [
    { date: 'Dec 1', entries: 2145, quality: 92 },
    { date: 'Dec 3', entries: 2298, quality: 93 },
    { date: 'Dec 5', entries: 2456, quality: 94 },
    { date: 'Dec 7', entries: 2589, quality: 95 },
    { date: 'Dec 9', entries: 2687, quality: 96 },
    { date: 'Dec 11', entries: 2759, quality: 97 },
  ];

  const sourceDistribution = [
    { source: 'User Reports', count: 842, color: '#3B82F6' },
    { source: 'Bank SMS', count: 712, color: '#10B981' },
    { source: 'Public Datasets', count: 567, color: '#F59E0B' },
    { source: 'Email Samples', count: 438, color: '#8B5CF6' },
    { source: 'Manual Entry', count: 200, color: '#EC4899' },
  ];

  const topKeywords = [
    { keyword: 'verify', count: 287, type: 'phishing' },
    { keyword: 'transaction', count: 412, type: 'legitimate' },
    { keyword: 'urgent', count: 198, type: 'phishing' },
    { keyword: 'OTP', count: 356, type: 'legitimate' },
    { keyword: 'click', count: 165, type: 'phishing' },
    { keyword: 'payment', count: 298, type: 'legitimate' },
    { keyword: 'suspended', count: 134, type: 'phishing' },
    { keyword: 'successful', count: 267, type: 'legitimate' },
  ];

  const stats = [
    {
      title: 'Total Entries',
      value: '2,759',
      change: '+8.5%',
      icon: Database,
      color: 'blue',
      bgColor: 'bg-blue-500',
    },
    {
      title: 'Data Quality Score',
      value: '97%',
      change: '+3.2%',
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500',
    },
    {
      title: 'Phishing Samples',
      value: '1,247',
      change: '+12.1%',
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-500',
    },
    {
      title: 'Avg Word Count',
      value: '42.5',
      change: '+1.8%',
      icon: FileText,
      color: 'purple',
      bgColor: 'bg-purple-500',
    },
  ];

  const COLORS = ['#EF4444', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Data Quality Summary</h1>
        <p className="text-gray-600">Analyze dataset statistics and quality metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <h3 className="text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Label Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-gray-900 mb-4">Label Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={labelDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {labelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {labelDistribution.map((item, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                item.name === 'Phishing' ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <p className={`${
                  item.name === 'Phishing' ? 'text-red-600' : 'text-green-600'
                } mb-1`}>
                  {item.name}
                </p>
                <p className={`${
                  item.name === 'Phishing' ? 'text-red-900' : 'text-green-900'
                }`}>
                  {item.value} entries ({item.percentage}%)
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality Trend */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-gray-900 mb-4">Data Quality Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataQualityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis yAxisId="left" stroke="#6B7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="entries" stroke="#3B82F6" strokeWidth={2} name="Total Entries" />
              <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#10B981" strokeWidth={2} name="Quality Score %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Word Count Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-gray-900 mb-4">Word Count Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={wordCountDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="range" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="phishing" fill="#EF4444" radius={[8, 8, 0, 0]} name="Phishing" />
            <Bar dataKey="legitimate" fill="#10B981" radius={[8, 8, 0, 0]} name="Legitimate" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Source Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-gray-900 mb-4">Data Source Distribution</h2>
        <div className="space-y-4">
          {sourceDistribution.map((source, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: source.color }}
                  />
                  <span className="text-gray-900">{source.source}</span>
                </div>
                <span className="text-gray-600">{source.count} entries</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    backgroundColor: source.color,
                    width: `${(source.count / 2759) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Keywords */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-gray-900 mb-4">Top Keywords by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phishing Keywords */}
          <div>
            <h3 className="text-red-900 mb-3">Phishing Keywords</h3>
            <div className="space-y-2">
              {topKeywords
                .filter(k => k.type === 'phishing')
                .map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-red-900">{keyword.keyword}</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                      {keyword.count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Legitimate Keywords */}
          <div>
            <h3 className="text-green-900 mb-3">Legitimate Keywords</h3>
            <div className="space-y-2">
              {topKeywords
                .filter(k => k.type === 'legitimate')
                .map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-900">{keyword.keyword}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      {keyword.count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Versioning */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900">Dataset Versions</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create New Version
          </button>
        </div>
        
        <div className="space-y-3">
          {[
            { version: 'v2.1', date: '2025-12-12', entries: 2759, status: 'active' },
            { version: 'v2.0', date: '2025-12-05', entries: 2456, status: 'archived' },
            { version: 'v1.9', date: '2025-11-28', entries: 2198, status: 'archived' },
          ].map((version, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-gray-900">{version.version}</p>
                  <p className="text-gray-600">{version.date} • {version.entries} entries</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full ${
                  version.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {version.status}
                </span>
                {version.status === 'archived' && (
                  <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
