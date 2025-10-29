'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, FileText, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/contexts/I18nContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { state } = useCart();
  const { t } = useI18n();

  const navItems = [
    { href: '/marketplace', icon: Home, label: t('common.home') },
    { href: '/marketplace/cart', icon: ShoppingCart, label: t('common.cart') },
    { href: '/marketplace/orders', icon: FileText, label: t('common.orders') },
    { href: '/marketplace/profile', icon: User, label: t('common.more') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                isActive
                  ? 'text-blue-500 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6 mb-1" />
                {item.label === t('common.cart') && state.itemCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {state.itemCount > 99 ? '99+' : state.itemCount}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}