'use client';

import { useState } from 'react';
import { Button } from '@/commons/components/button';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';

const mockDietCategories = ['Vegan', 'Vegetarian', 'Pescatarian', 'Gluten-Free'];

export default function DietOnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (item: string) => {
    setSelected((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Select Diet Preferences</h2>
      <ul className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {mockDietCategories.map((c) => (
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
        onClick={handleFinish}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-4"
      >
        Finish
      </Button>
    </div>
  );
}

