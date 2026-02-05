'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tokenPresent, setTokenPresent] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTokenPresent(!!localStorage.getItem('token'));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 pt-24">
        <div className="max-w-2xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Auth</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Auth State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {isLoading.toString()}</p>
            <p><strong>User:</strong></p>
            <pre className="bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Local Storage</h2>
          <div className="space-y-2">
            <p><strong>Token:</strong> {tokenPresent ? 'Present' : 'Missing'}</p>
            <p className="text-sm text-gray-600">Open browser console for more debug info</p>
          </div>
        </div>
      </div>
    </div>
  );
}
