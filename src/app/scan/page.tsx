'use client';

import { Button } from '@/commons/components/button';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-semibold mb-6">Scan Menu</h2>
      <p className="text-muted-foreground mb-8">(Camera integration TBD)</p>
      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
}
