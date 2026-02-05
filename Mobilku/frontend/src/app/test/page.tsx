'use client';

import { useState } from 'react';
import { Input } from '@/lib/components/ui/Input';

export default function TestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="max-w-md mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">Input Component Test</h1>
      
      <div className="mb-4">
        <Input
          label="Email"
          type="email"
          placeholder="test@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="mt-2 text-sm">Value: {email}</p>
      </div>

      <div className="mb-4">
        <Input
          label="Password"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-2 text-sm">Value: {password}</p>
      </div>

      <p className="text-gray-600">If you can type above, the Input component is working!</p>
    </div>
  );
}
