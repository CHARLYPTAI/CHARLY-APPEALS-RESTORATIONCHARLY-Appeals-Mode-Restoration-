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

export default function ResidentialDashboardPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('auth_token');
      const tenantType = localStorage.getItem('tenant_type');

      if (!token || tenantType !== 'RESIDENTIAL') {
        router.push('/login/residential');
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
          if (data.user.tenant_type === 'RESIDENTIAL') {
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
        router.push('/login/residential');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_type');
    router.push('/login/residential');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto"></div>
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
                CHARLY Residential
              </h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Residential Tenant
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
                    // Clear current session and redirect to commercial portal
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('tenant_type');
                    // Navigate to commercial login
                    window.location.href = `${window.location.protocol}//${window.location.hostname}:3000/login/commercial`;
                  }}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 dark:border-blue-600 shadow-sm text-sm font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-200"
                  title="Switch to Commercial Portal"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Commercial
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
              Welcome to CHARLY Residential
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Simplified property tax appeals for homeowners. 
              Your tenant isolation is working correctly - you have access to residential routes under /r/*.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Property Check
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Get an instant analysis of your home's tax assessment.
              </p>
              <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                Start Check
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Home Valuation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Compare your home's assessed value with market data.
              </p>
              <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                View Valuation
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Appeal Filing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Generate your appeal packet for filing with the county.
              </p>
              <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                File Appeal
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Homeowner Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">No Upfront Costs</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pay only if we find savings</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">60-Second Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instant property assessment review</p>
                </div>
              </div>
            </div>
          </div>

          {/* API Testing Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tenant Isolation Test
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Test tenant isolation by attempting to access commercial endpoints (should fail):
            </p>
            <div className="space-y-2">
              <div className="text-sm">
                <strong>Current Access:</strong> Residential API endpoints at /api/v1/r/*
              </div>
              <div className="text-sm">
                <strong>Blocked Access:</strong> Commercial API endpoints at /api/v1/c/* (403 Forbidden expected)
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}