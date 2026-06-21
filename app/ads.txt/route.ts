// /ads.txt — AdSense 가 게시자 인증에 사용하는 파일.
// NEXT_PUBLIC_ADSENSE_CLIENT(예: ca-pub-1234...) 가 설정되면 자동으로 라인을 생성한다.

export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const pub = client.replace(/^ca-/, ""); // ca-pub-XXXX → pub-XXXX
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : "# AdSense 퍼블리셔 ID 를 NEXT_PUBLIC_ADSENSE_CLIENT 환경변수에 설정하면 이 파일이 자동 생성됩니다.\n";

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
