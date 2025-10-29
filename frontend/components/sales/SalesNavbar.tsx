'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Image from 'next/image';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface SalesNavbarProps {
  onMenuClick: () => void;
}

export default function SalesNavbar({ onMenuClick }: SalesNavbarProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <Image
            src="/logo1.jpeg"
            alt="Premier Decorations"
            width={120}
            height={40}
            className="h-6 lg:h-8 w-auto"
          />
          <span className="text-lg lg:text-xl font-semibold text-gray-800 hidden sm:block">Sales CRM</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v5" />
            </svg>
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium">{user?.fullName}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
                  <div className="font-medium">{user?.fullName}</div>
                  <div className="text-xs">{user?.email}</div>
                </div>
                <button
                  onClick={() => {/* Profile logic */}}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile Settings
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}