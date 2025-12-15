'use client';

import { Button } from '@/commons/components/button';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col p-4">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <p className="mb-8 text-muted-foreground">(Settings content TBD)</p>
      <Button onClick={() => router.back()}>Back</Button>
    </div>
  );
}

