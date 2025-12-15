'use client';

'use client';

import { useState } from 'react';
import { Button } from '@/commons/components/button';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';

const mockCategories = ['Egg', 'Milk', 'Peanuts', 'Shellfish', 'Wheat'];

export default function AllergyOnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const toggle = (item: string) => {
    setSelected((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const handleNext = () => {
    // TODO: persist to store
    router.push('/onboarding/diet');
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    completeOnboarding();
    router.push('/dashboard');
  };

  return (
    <>
      <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto pb-24">
        <h2 className="text-xl font-semibold mb-4">Select Allergy Categories</h2>
        <ul className="flex flex-col gap-2 flex-1 overflow-y-auto pb-4">
          {mockCategories.map((c) => (
            <li
              key={c}
              className={`border rounded p-3 cursor-pointer ${selected.includes(c) ? 'bg-emerald-100 border-emerald-400' : 'bg-white'}`}
              onClick={() => toggle(c)}
            >
              {c}
            </li>
          ))}
        </ul>
        <Button
          disabled={selected.length === 0}
          onClick={handleNext}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-4"
        >
          Next
        </Button>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          이전
        </Button>
        <Button variant="outline" onClick={handleSkip}>
          Skip
        </Button>
      </div>
    </>
  );
}

