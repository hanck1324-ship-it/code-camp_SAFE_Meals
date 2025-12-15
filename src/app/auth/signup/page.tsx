"use client";
import { useAuth } from "@/app/_providers/auth-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signup(email, pw);
    router.push("/dashboard");
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-semibold">회원가입</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 w-60 mx-auto"
      >
        <input
          className="border px-3 py-2 rounded"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="패스워드"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <button
          type="submit"
          className="bg-emerald-500 text-white py-2 rounded mt-2"
        >
          가입하기
        </button>
      </form>
    </main>
  );
}

