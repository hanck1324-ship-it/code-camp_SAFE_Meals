"use client";
import { HomeScreen } from "@/components/home-screen";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  
  return (
    <HomeScreen
      userProfile={{ allergies: [], diets: [] }}
      onScanMenu={() => router.push("/scan")}
      onOpenProfile={() => router.push("/profile")}
      language="ko"
      onLanguageChange={() => {}}
    />
  );
}

