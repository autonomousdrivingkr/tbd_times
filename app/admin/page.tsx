import { redirect } from "next/navigation";
import { isAdminPageAuthed } from "@/lib/admin-auth";

// /admin 자체는 페이지가 없어 404가 나므로, 로그인 여부에 따라 적절한 곳으로 보낸다.
export default async function AdminRootPage() {
  redirect((await isAdminPageAuthed()) ? "/admin/blog" : "/admin/login");
}
