import { redirect } from "next/navigation";
import { isAdminEnabled, isAdminPageAuthed } from "@/lib/admin-auth";
import LoginForm from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  if (await isAdminPageAuthed()) redirect("/admin/blog");

  return (
    <div className="container-page flex min-h-screen max-w-sm flex-col justify-center py-12">
      <h1 className="font-serif text-2xl font-bold">관리자 로그인</h1>
      <p className="mt-1 text-sm text-muted">Tibedra 블로그 관리자 도구</p>
      {isAdminEnabled() ? (
        <LoginForm />
      ) : (
        <p className="mt-6 rounded-md border border-line bg-paper p-4 text-sm text-muted">
          관리자 기능이 비활성화되어 있습니다. ADMIN_PASSWORD 환경변수를 설정해 주세요.
        </p>
      )}
    </div>
  );
}
