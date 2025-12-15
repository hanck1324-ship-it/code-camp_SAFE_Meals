"use client";
import { LanguageSettingsScreen } from "@/components/profile/language-settings-screen";
import { useRouter } from "next/navigation";

export default function LanguageSettingsPage() {
  const router = useRouter();
  return (
    <LanguageSettingsScreen
      currentLanguage="ko"
      onBack={() => router.back()}
      onLanguageChange={() => {}}
    />
  );
}

