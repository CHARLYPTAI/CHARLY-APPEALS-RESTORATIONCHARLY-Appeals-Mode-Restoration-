import React, { useState, useEffect } from 'react';
import { authService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuth() {
  const [authStatus, setAuthStatus] = useState('checking...');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const testAuth = async () => {
    try {
      setAuthStatus('Testing authentication...');
      setError(null);

      console.log('TestAuth: Starting authentication test');
      
      // Test if already authenticated
      const isAuth = authService.isAuthenticated();
      console.log('TestAuth: Currently authenticated:', isAuth);
      
      if (!isAuth) {
        console.log('TestAuth: Attempting login...');
        const result = await authService.login({
          email: "admin@charly.com",
          password: "CharlyCTO2025!"
        });
        
        console.log('TestAuth: Login successful:', result.user.email);
        setUser(result.user);
        setAuthStatus('✅ Authentication successful!');
      } else {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setAuthStatus('✅ Already authenticated!');
      }
      
    } catch (err) {
      console.error('TestAuth: Authentication failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setAuthStatus('❌ Authentication failed');
    }
  };

  useEffect(() => {
    testAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>🔐 Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="font-medium text-blue-900">Status:</p>
            <p className="text-blue-800">{authStatus}</p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium text-red-900">Error:</p>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          {user && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-medium text-green-900">User Info:</p>
              <pre className="text-green-800 text-xs mt-2 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
          
          <Button onClick={testAuth} className="w-full">
            🔄 Test Authentication Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}