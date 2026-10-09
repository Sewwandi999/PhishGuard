import { useState } from 'react';
import React from 'react';

import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, CheckCircle, ScanSearch, Activity, Target } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export default function Dashboard({ userRole }) {

  if (!userRole) {
    console.warn("No user role provided");
  }
  // Mock data for charts
  const trendData = [
    { date: 'Mon', phishing: 45, legitimate: 230 },
    { date: 'Tue', phishing: 52, legitimate: 198 },
    { date: 'Wed', phishing: 61, legitimate: 245 },
    { date: 'Thu', phishing: 38, legitimate: 267 },
    { date: 'Fri', phishing: 71, legitimate: 201 },
    { date: 'Sat', phishing: 28, legitimate: 156 },
    { date: 'Sun', phishing: 34, legitimate: 189 },
  ];

  const distributionData = [
    { name: 'Phishing Detected', value: 329, color: '#EF4444' },
    { name: 'Legitimate', value: 1486, color: '#10B981' },
    { name: 'Suspicious', value: 127, color: '#F59E0B' },
  ];

  const keywordData = [
    { keyword: 'verify account', count: 87 },
    { keyword: 'urgent action', count: 65 },
    { keyword: 'click here', count: 58 },
    { keyword: 'suspended', count: 45 },
    { keyword: 'confirm identity', count: 38 },
  ];

  const stats = [
    {
      title: 'Total Scans',
      value: '1,942',
      change: '+12.5%',
      trend: 'up',
      icon: ScanSearch,
      color: 'blue',
      bgColor: 'bg-blue-500',
    },
    {
      title: 'Phishing Detected',
      value: '329',
      change: '+8.2%',
      trend: 'up',
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-500',
    },
    {
      title: 'Legitimate Messages',
      value: '1,486',
      change: '+15.3%',
      trend: 'up',
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-500',
    },
    {
      title: 'Detection Accuracy',
      value: '97.8%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'purple',
      bgColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Real-time phishing detection overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg border border-green-200">
          <Activity className="w-5 h-5" />
          <span>System Active</span>
        </div>
      </div>

      <Link
        to="/learn"
        className="block bg-indigo-50 border border-indigo-100 rounded-xl p-5 hover:bg-indigo-100 transition-colors"
      >
        <p className="text-indigo-900">Learning Center</p>
        <p className="text-indigo-800 mt-1">
          Read short lessons on phishing, SMS scams, email threats, and what to do if you already clicked a link.
        </p>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-gray-900 mb-4">Weekly Detection Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="phishing" stroke="#EF4444" strokeWidth={2} name="Phishing" />
              <Line type="monotone" dataKey="legitimate" stroke="#10B981" strokeWidth={2} name="Legitimate" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-gray-900 mb-4">Message Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((Number(percent) || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Keyword Analysis */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-gray-900 mb-4">Top Phishing Keywords</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={keywordData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="keyword" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
            />
            <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-gray-900">Recent Phishing Alerts</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { time: '2 mins ago', message: 'Your account has been suspended...', risk: 'High', sender: '+94771234567' },
            { time: '15 mins ago', message: 'Click here to verify your banking details...', risk: 'High', sender: 'noreply@bank-verify.com' },
            { time: '1 hour ago', message: 'Urgent: Confirm your identity within 24 hours...', risk: 'Medium', sender: '+94712345678' },
            { time: '3 hours ago', message: 'You have won Rs. 100,000! Claim now...', risk: 'High', sender: '+94723456789' },
          ].map((alert, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-gray-500">{alert.time}</span>
                    <span className="text-gray-500">From: {alert.sender}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-white ${
                  alert.risk === 'High' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {alert.risk} Risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
