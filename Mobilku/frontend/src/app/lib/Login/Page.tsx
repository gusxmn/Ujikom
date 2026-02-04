'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Car, LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
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

  const demoCredentials = [
    { 
      label: 'Admin', 
      email: 'admin@example.com', 
      password: 'Admin123!',
      description: 'Full access to admin panel'
    },
    { 
      label: 'Customer', 
      email: 'customer@example.com', 
      password: 'Customer123!',
      description: 'Regular user for shopping'
    },
    { 
      label: 'Customer 2', 
      email: 'jane@example.com', 
      password: 'Jane123!',
      description: 'Another test customer'
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Car className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Online Shop Mobil</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Demo Accounts</CardTitle>
              <CardDescription>
                Try these pre-configured accounts for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoCredentials.map((account) => (
                  <div
                    key={account.label}
                    className="border rounded-lg p-4 hover:border-blue-300 transition cursor-pointer group"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {account.label}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">{account.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition"
                      >
                        Use
                      </Button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                          {account.email}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Password:</span>
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                          {account.password}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Features */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">Platform Features</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Secure authentication with JWT</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span>Role-based access control</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Integrated payment gateway</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    <span>Real-time order tracking</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}