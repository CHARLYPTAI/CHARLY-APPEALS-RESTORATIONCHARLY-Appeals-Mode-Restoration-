'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  tenant_type: string;
  user: {
    sub: string;
    tenant_type: string;
    aud: string;
  };
}

export default function CommercialDashboardPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('auth_token');
      const tenantType = localStorage.getItem('tenant_type');

      if (!token || tenantType !== 'COMMERCIAL') {
        router.push('/login/commercial');
        return;
      }

      try {
        const response = await fetch('/api/v1/auth/validate', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user.tenant_type === 'COMMERCIAL') {
            setUserInfo(data);
          } else {
            throw new Error('Invalid tenant type');
          }
        } else {
          throw new Error('Token validation failed');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_type');
        router.push('/login/commercial');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_type');
    router.push('/login/commercial');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                CHARLY Commercial
              </h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                Commercial Tenant
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {userInfo?.user.sub}
              </span>
              
              {/* Portal Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    // Clear current session and redirect to residential portal
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('tenant_type');
                    // Navigate to residential login
                    window.location.href = `${window.location.protocol}//${window.location.hostname}:3001/login/residential`;
                  }}
                  className="inline-flex items-center px-3 py-2 border border-green-300 dark:border-green-600 shadow-sm text-sm font-medium rounded-lg text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors duration-200"
                  title="Switch to Residential Portal"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
                  </svg>
                  Residential
                </button>
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
            <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-4">
              Welcome to CHARLY Commercial
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Professional property tax appeal platform for commercial real estate. 
              Your tenant isolation is working correctly - you have access to commercial routes under /c/*.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Portfolio Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Manage your commercial property portfolio and assessments.
              </p>
              <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                View Portfolio
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Valuation Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Perform income, sales, and cost approach analysis.
              </p>
              <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                Start Analysis
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Appeal Packets
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Generate professional appeal dossiers for filing.
              </p>
              <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                Create Packet
              </button>
            </div>
          </div>

          {/* API Testing Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tenant Isolation Test
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Test tenant isolation by attempting to access residential endpoints (should fail):
            </p>
            <div className="space-y-2">
              <div className="text-sm">
                <strong>Current Access:</strong> Commercial API endpoints at /api/v1/c/*
              </div>
              <div className="text-sm">
                <strong>Blocked Access:</strong> Residential API endpoints at /api/v1/r/* (403 Forbidden expected)
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}