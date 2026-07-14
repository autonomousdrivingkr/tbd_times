import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-auth";
import { getStoredPost } from "@/lib/blog-store";
import PostForm from "@/components/admin/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminPage();
  const { slug } = await params;
  const post = await getStoredPost(slug, true);
  if (!post) notFound();

  return (
    <div className="container-page max-w-3xl py-10">
      <p className="text-sm">
        <Link href="/admin/blog" className="text-accent hover:underline">
          ← 블로그 관리
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-2xl font-bold border-b border-line pb-6">글 수정</h1>
      <div className="mt-6">
        <PostForm mode="edit" initial={post} />
      </div>
    </div>
  );
}
