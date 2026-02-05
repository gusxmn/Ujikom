'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (error) {
      // Error sudah ditangani di AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      email: 'customer@example.com',
      password: 'Customer123!',
      description: 'Regular customer account'
    },
    {
      email: 'jane@example.com',
      password: 'Jane123!',
      description: 'Another test customer'
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition font-medium"
        >
          <ArrowLeft size={18} />
          Back to Login Options
        </Link>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Customer Login</CardTitle>
            <CardDescription>
              Sign in to shop and manage your orders
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                fullWidth
                className="mt-6"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>

              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Demo Customer Accounts
              </h4>
              <div className="space-y-3">
                {demoAccounts.map((account, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 hover:border-blue-300 transition cursor-pointer bg-gray-50 group"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-gray-500">{account.description}</p>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <div className="font-mono text-gray-700 bg-white p-2 rounded mt-1 border">
                          {account.email}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Password:</span>
                        <div className="font-mono text-gray-700 bg-white p-2 rounded mt-1 border">
                          {account.password}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEmail(account.email);
                        setPassword(account.password);
                      }}
                      className="w-full mt-3 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition"
                    >
                      Use Demo Account
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Help */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                ℹ️ Browse products, manage your orders, and track shipments. For admin access, use the Admin Login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
