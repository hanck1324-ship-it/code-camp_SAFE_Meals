"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, ChevronLeft } from "lucide-react";
import { Button } from "@/commons/components/button";
import { useAppStore } from "@/commons/stores/useAppStore";
import { translations } from "@/lib/translations";

export default function SafetyCardPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const t = translations[language] || translations['en'];

  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // auto-focus whenever screen mounts or pin changes
  useEffect(() => {
    if (!unlocked) {
      inputRef.current?.focus();
    }
  }, [unlocked, pin]);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) setPin(pin + digit);
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const onUnlock = () => {
    if (pin.length === 4) {
      setUnlocked(true);
    }
  };

  const allergy = "쌀"; // TODO: fetch from user profile
  const allergyEn = "Rice";

  if (unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-white pt-4 px-4">
        {/* Top bar */}
        <div className="w-full flex items-center mb-2">
          <button onClick={() => router.back()} className="p-2 mr-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Icon */}
        <div className="mt-12 mb-8">
          <div className="w-24 h-24 bg-red-500/90 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
            <ShieldAlert className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Korean message */}
        <div className="border-2 border-red-400 rounded-3xl p-6 w-full max-w-md text-center mb-6">
          <p className="text-xl leading-relaxed font-medium whitespace-pre-wrap">
            저는 <span className="text-red-500 font-semibold">{allergy}</span> 알레르기가 있습니다{"\n"}
            이 음식에 <span className="text-red-500 font-semibold">{allergy}</span>가 들어있나요?
          </p>
        </div>

        {/* English message */}
        <div className="bg-gray-50 rounded-3xl p-4 w-full max-w-md text-center text-gray-700">
          I have <span className="text-red-500 font-semibold">{allergyEn}</span> allergies.
          Does this food contain <span className="text-red-500 font-semibold">{allergyEn}</span>?
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f5fffa] pt-4 px-4">
      {/* Top bar */}
      <div className="w-full flex items-center mb-2">
        <button onClick={() => router.back()} className="p-2 mr-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium">{t.enterSecurityPin ?? 'Enter PIN'}</h1>
      </div>

      {/* Icon */}
      <div className="mt-8 mb-6">
        <div className="w-24 h-24 bg-gradient-to-b from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
          <Lock className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Title & description */}
      <h2 className="text-xl font-semibold mb-2">{t.protectedAccess}</h2>
      <p className="text-gray-500 mb-6 text-center max-w-xs">{t.pinDescription}</p>

      {/* PIN boxes */}
      <div
        className="flex gap-4 mb-8"
        onClick={() => inputRef.current?.focus()}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-14 h-14 rounded-2xl border-2 border-gray-200 flex items-center justify-center text-2xl font-medium bg-white"
          >
            {pin[i] || ""}
          </div>
        ))}
      </div>

      <Button
        className="w-full max-w-md h-12 rounded-2xl bg-green-400 disabled:bg-green-200 mb-8"
        disabled={pin.length < 4}
        onClick={onUnlock}
      >
        {t.unlock}
      </Button>

      {/* Info box */}
      <div className="w-full max-w-md bg-white p-4 rounded-2xl border border-gray-200 flex gap-2 items-start">
        <ShieldAlert className="w-5 h-5 text-green-600 mt-1" />
        <p className="text-sm leading-relaxed text-gray-700">
          {t.pinSecurityInfo}
        </p>
      </div>

      <p className="mt-8 text-sm text-gray-400">{t.demoPin}</p>

      {/* Hidden input to capture digits */}
      <input
        type="number" inputMode="numeric" pattern="[0-9]*"
        autoFocus
        value=""
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "");
          if (val.length === 0) return;
          const last = val.slice(-1);
          handleDigit(last);
          e.target.value = "";
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace") {
            e.preventDefault();
            handleBackspace();
          }
        }}
        className="opacity-0 w-0 h-0 absolute"
      />
    </div>
  );
}

