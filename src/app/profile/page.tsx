"use client";
import { ProfileScreen } from "@/components/profile-screen";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_providers/auth-provider";

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <ProfileScreen
      userProfile={{ allergies: [], diets: [] }}
      onNavigate={(screen) => {
        if (screen === 'notifications') router.push('/settings/notifications');
        else if (screen === 'languageSettings') router.push('/settings/language');
        else if (screen === 'help') router.push('/settings/help');
        else if (screen === 'safetyCard') router.push('/safety-card');
        else if (screen === 'safetyProfileEdit') router.push('/profile/edit');
      }}
      language="ko"
      onLanguageChange={() => {}}
      onLogout={() => {
        logout();
        router.push('/auth/login');
      }}
    />
  );
}

