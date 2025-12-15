'use client';

import { Button } from '@/commons/components/button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-semibold mb-6">SAFE Meals Dashboard</h2>
      <div className="space-y-4 w-full max-w-xs">
        <Button className="w-full" onClick={() => router.push('/scan')}>Scan Menu</Button>
        <Button className="w-full" onClick={() => router.push('/profile')}>My Page</Button>
      </div>
    </div>
  );
}
