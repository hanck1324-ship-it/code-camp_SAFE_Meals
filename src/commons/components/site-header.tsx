"use client";
import { useAuth } from "@/app/_providers/auth-provider";
import Link from "next/link";

export default function SiteHeader() {
  const { profile } = useAuth();
  return (
    <header className="flex flex-col items-start space-y-1 py-4 px-4">
      <Link href="/" className="text-xl font-bold text-green-600">
        SafeMeals
      </Link>
      <span className="text-sm text-gray-500">
        {profile ? `${profile.real_name ?? profile.email} 님` : "안전하게, 어디서나"}
      </span>
    </header>
  );
}

