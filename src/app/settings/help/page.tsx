"use client";
import { HelpSupportScreen } from "@/components/profile/help-support-screen";
import { RequireAuth } from "@/components/auth/require-auth";

export default function HelpPage() {
  return (
    <RequireAuth>
      <HelpSupportScreen onBack={() => {}} language="ko" />
    </RequireAuth>
  );
}

