import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/portfolio/auth";
import { prisma } from "@/lib/portfolio/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findFirst({
    where: { id, status: "PUBLISHED" },
    include: { author: { select: { id: true, name: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, authorId: session.user.id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.post.update({
    where: { id },
    data: { status: "REMOVED", removedReason: "user_delete" },
  });

  return new NextResponse(null, { status: 204 });
}
