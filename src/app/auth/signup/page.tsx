'use client';

import { Button } from '@/commons/components/button';
import { Input } from '@/commons/components/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';

export default function SignupPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email });
    router.replace('/onboarding/allergy');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
        <h2 className="text-xl font-semibold text-center">Sign Up</h2>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-md">
          Continue
        </Button>
      </form>
    </div>
  );
}
