'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SalesNavbar from '@/components/sales/SalesNavbar';
import SalesSidebar from '@/components/sales/SalesSidebar';

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SALESMAN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'SALESMAN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <SalesSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="flex-1 p-4 lg:p-6 lg:ml-64 transition-all duration-200 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}