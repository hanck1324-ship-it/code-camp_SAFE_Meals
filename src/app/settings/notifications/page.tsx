"use client";
import { NotificationsScreen } from "@/components/profile/notifications-screen";
import { RequireAuth } from "@/components/auth/require-auth";

export default function NotificationsSettingsPage() {
  return (
    <RequireAuth>
      <NotificationsScreen onBack={() => {}} language="ko" />
    </RequireAuth>
  );
}

