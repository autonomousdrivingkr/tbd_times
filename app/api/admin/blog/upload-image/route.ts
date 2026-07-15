import { NextRequest, NextResponse } from "next/server";
import { isAuthedRequest } from "@/lib/admin-auth";
import {
  hasImageStore,
  isAllowedImageType,
  isWithinSizeLimit,
  uploadBlogImage,
} from "@/lib/blog-images";

export const dynamic = "force-dynamic";

/** 관리자 에디터에서 대표 이미지 파일을 업로드받아 공개 URL을 반환한다. */
export async function POST(req: NextRequest) {
  if (!isAuthedRequest(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasImageStore()) {
    return NextResponse.json({ ok: false, error: "image_store_not_configured" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file_required" }, { status: 400 });
  }
  if (!isAllowedImageType(file.type)) {
    return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
  }
  if (!isWithinSizeLimit(file.size)) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const url = await uploadBlogImage(buffer, file.type);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[blog-images] upload failed", err);
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
