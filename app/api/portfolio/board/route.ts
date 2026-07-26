import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/portfolio/auth";
import { prisma } from "@/lib/portfolio/db";
import { containsBlockedContent } from "@/lib/portfolio/moderation-wordlist";
import { moderatePostAsync } from "@/lib/portfolio/moderation";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { title, content } = parsed.data;
  if (containsBlockedContent(title) || containsBlockedContent(content)) {
    return NextResponse.json({ error: "Content not allowed" }, { status: 422 });
  }

  const post = await prisma.post.create({
    data: { title, content, authorId: session.user.id },
  });

  try {
    after(() => moderatePostAsync(post.id, title, content));
  } catch (err) {
    console.error("[board] failed to schedule moderation", err);
  }

  return NextResponse.json(post, { status: 201 });
}
