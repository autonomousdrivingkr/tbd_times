import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import PostForm from "@/components/admin/PostForm";

export default async function NewPostPage() {
  await requireAdminPage();

  return (
    <div className="container-page max-w-3xl py-10">
      <p className="text-sm">
        <Link href="/admin/blog" className="text-accent hover:underline">
          ← 블로그 관리
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-2xl font-bold border-b border-line pb-6">새 글 작성</h1>
      <div className="mt-6">
        <PostForm mode="new" />
      </div>
    </div>
  );
}
