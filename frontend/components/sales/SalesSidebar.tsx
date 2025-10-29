'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ChartPieIcon,
  BellIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/sales/dashboard', icon: ChartBarIcon },
  { name: 'Leads', href: '/sales/leads', icon: UserGroupIcon },
  { name: 'Tasks', href: '/sales/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Activities', href: '/sales/activities', icon: CalendarDaysIcon },
  { name: 'Call Center', href: '/sales/calls', icon: PhoneIcon },
  { name: 'Analytics', href: '/sales/analytics', icon: ChartPieIcon },
  { name: 'Reports', href: '/sales/reports', icon: ChartBarIcon },
];

const secondaryNavigation = [
  { name: 'Notifications', href: '/sales/notifications', icon: BellIcon },
  { name: 'Settings', href: '/sales/settings', icon: Cog6ToothIcon },
];

interface SalesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SalesSidebar({ isOpen, onClose }: SalesSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`fixed left-0 top-0 w-64 h-full bg-white shadow-sm border-r border-gray-200 z-50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:pt-16 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        {/* Mobile header with close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-800">Sales CRM</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 pt-4 lg:pt-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="border-t border-gray-200 px-4 py-4 space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Performance Summary */}
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-semibold mb-2">This Month</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Leads</span>
                <span className="font-semibold">23</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Closed</span>
                <span className="font-semibold">7</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Revenue</span>
                <span className="font-semibold">£15.2k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}