import { useState } from 'react';
import React from 'react';

import { Link, useLocation } from 'react-router-dom';
import { displayNameFromEmail } from '../auth/apiAuth.js';
import { 
  LayoutDashboard, 
  ScanSearch, 
  History, 
  Database, 
  BarChart3, 
  FileText, 
  ScrollText, 
  Users, 
  LogOut,
  Shield,
  MessageCircle,
  GraduationCap
} from 'lucide-react';

export default function Navigation({ userRole, userEmail, onLogout }) {
  const location = useLocation();
  const normalizedRole = typeof userRole === "string" ? userRole.toLowerCase() : null;

  const sidebarName = userEmail
    ? displayNameFromEmail(userEmail)
    : userRole
      ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)} User`
      : "User";
  const avatarLetter = (sidebarName[0] || "?").toUpperCase();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'analyst', 'user'] },
    { path: '/scanner', icon: ScanSearch, label: 'Message Scanner', roles: ['admin', 'analyst', 'user'] },
    { path: '/history', icon: History, label: 'Scan History', roles: ['admin', 'analyst', 'user'] },
    { path: '/dataset', icon: Database, label: 'Dataset Manager', roles: ['admin', 'analyst'] },
    { path: '/data-quality', icon: BarChart3, label: 'Data Quality', roles: ['admin', 'analyst'] },
    { path: '/logs', icon: ScrollText, label: 'Logs Viewer', roles: ['admin', 'analyst'] },
    { path: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'analyst'] },
    { path: '/chatbot', icon: MessageCircle, label: 'Chatbot', roles: ['admin', 'analyst', 'user'] },
    { path: '/learn', icon: GraduationCap, label: 'Learning Center', roles: ['admin', 'analyst', 'user'] },
    { path: '/users', icon: Users, label: 'User Management', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => normalizedRole && item.roles.includes(normalizedRole));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white">PhishGuard</h2>
            <p className="text-slate-400">Detection System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white">
              {avatarLetter}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white truncate" title={userEmail || undefined}>{sidebarName}</p>
            <p className="text-slate-400">Active Session</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
