'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/commons/components/button';
import { useAppStore } from '@/commons/stores/useAppStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAppStore();

  if (!user) {
    router.replace('/auth/login?redirect=/profile');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <h2 className="text-xl font-semibold mt-6 mb-4">My Page</h2>
      <p className="mb-8">Logged in as <span className="font-medium">{user.email}</span></p>
      <div className="w-full max-w-xs space-y-3">
        <Button className="w-full" onClick={() => router.push('/profile/settings')}>Settings</Button>
        <Button className="w-full" onClick={() => router.push('/profile/help')}>Help & Support</Button>
        <Button className="w-full bg-red-500 hover:bg-red-600 text-white" onClick={() => { logout(); router.replace('/auth/login'); }}>Logout</Button>
      </div>
    </div>
  );
}
