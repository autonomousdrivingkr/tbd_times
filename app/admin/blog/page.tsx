import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { readStore, hasBlobStore } from "@/lib/blog-store";
import PostList from "@/components/admin/PostList";
import LogoutButton from "@/components/admin/LogoutButton";

export default async function AdminBlogPage() {
  await requireAdminPage();

  if (!hasBlobStore()) {
    return (
      <div className="container-page max-w-3xl py-12">
        <p className="rounded-md border border-line bg-paper p-4 text-sm text-muted">
          Vercel Blob 스토어가 연결되어 있지 않아 관리자 블로그 저장소를 사용할 수 없습니다.
          프로젝트에 Blob 스토어를 연결해 주세요.
        </p>
      </div>
    );
  }

  const posts = await readStore(true);
  posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="flex items-center justify-between border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">블로그 관리</h1>
          <p className="mt-1 text-sm text-muted">
            매일 자동 생성된 초안을 검토·발행하거나, 새 글을 직접 작성할 수 있습니다.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href="/admin/blog/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + 새 글 작성
        </Link>
      </div>

      <div className="mt-6">
        <PostList posts={posts} />
      </div>
    </div>
  );
}
