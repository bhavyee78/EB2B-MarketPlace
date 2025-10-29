'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, Settings, Globe, HelpCircle, Info, LogOut, Phone, Mail } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import LanguageSelector from '@/components/LanguageSelector';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const menuItems = [
    {
      section: t('profile.account'),
      items: [
        {
          icon: User,
          label: t('profile.personalInfo'),
          href: '#',
          description: 'Manage your personal information'
        },
        {
          icon: Settings,
          label: t('profile.accountSettings'),
          href: '#',
          description: 'Account preferences and security'
        },
      ]
    },
    {
      section: t('profile.preferences'),
      items: [
        {
          icon: Globe,
          label: t('profile.language'),
          href: '#',
          description: 'Change app language',
          hasLanguageSelector: true
        },
      ]
    },
    {
      section: t('profile.support'),
      items: [
        {
          icon: Phone,
          label: t('profile.contactUs'),
          href: 'tel:+442012345678',
          description: 'Get in touch with our team'
        },
        {
          icon: HelpCircle,
          label: t('profile.helpCenter'),
          href: '#',
          description: 'FAQs and help articles'
        },
        {
          icon: Info,
          label: t('profile.about'),
          href: '#',
          description: 'About Premier Marketplace'
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src="/logo.jpeg"
                    alt="Premier Logo"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* User Info Section */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user?.fullName || 'Guest User'}
              </h2>
              <p className="text-gray-600">{user?.email || 'Not logged in'}</p>
              <div className="flex items-center mt-1">
                <Globe className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500">Premier Marketplace</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-4 space-y-6">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">{section.section}</h3>
            </div>
            <div className="divide-y">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {item.hasLanguageSelector ? (
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <item.icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                        </div>
                        <LanguageSelector />
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <item.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 text-gray-400">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center space-x-3 hover:bg-red-50 transition-colors text-left"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-600">{t('profile.logout')}</p>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
          </button>
        </div>

        {/* Version Info */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            {t('profile.version')} 1.0.0
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}