"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="text-sm text-muted hover:text-accent">
      로그아웃
    </button>
  );
}
