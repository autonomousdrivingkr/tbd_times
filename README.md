# Tibedra — 매일 아침 AI·투자 뉴스 브리핑

전세계 **AI/인공지능**과 **투자/금융** 뉴스를 신뢰할 수 있는 매체의 공개 RSS 피드에서
매일 아침 자동으로 모아 한 페이지에서 보여주는 데일리 브리핑 사이트입니다. 본문 사이에
**Google AdSense** 광고를 배치해 수익화할 수 있습니다.

- 프레임워크: **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4**
- 데이터: 매체 RSS → 헤드라인·요약·원문 링크 (전문 복사 ✕, 출처 링크 ○)
- 자동 갱신: **Vercel Cron**(매일 06:00 KST) + 30분 ISR 캐싱
- 배포: **Vercel** 권장

---

## 1. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값은 비워둬도 동작 (광고는 자리표시로 표시)
npm run dev                  # http://localhost:3000
```

> 광고 환경변수를 비워두면 광고 자리에 점선 "광고 영역" 박스가 표시되어
> 레이아웃을 미리 확인할 수 있습니다.

## 2. Google AdSense 연결

1. <https://www.google.com/adsense> 에서 가입하고 이 사이트를 등록합니다.
2. 승인 후 **게시자 ID**(`ca-pub-XXXXXXXXXXXXXXXX`)와 광고 단위별 **슬롯 ID**를 발급합니다.
3. 환경변수에 입력합니다.

```env
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_INLINE=1234567890
NEXT_PUBLIC_ADSENSE_SLOT_FEED=2345678901
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR=3456789012
```

- `NEXT_PUBLIC_ADSENSE_CLIENT`만 넣으면 광고 스크립트, `google-adsense-account` 메타,
  `/ads.txt`가 **자동 생성**됩니다.
- 슬롯 ID까지 넣으면 해당 지면에 실제 광고가 렌더됩니다.

> ⚠️ AdSense 승인 정책상 콘텐츠는 **요약 + 출처 링크** 방식이어야 안전합니다(전문 복제 ✕).
> 이 프로젝트는 그렇게 구성되어 있습니다.

## 3. Vercel 배포 & 매일 아침 자동 갱신

```bash
npm i -g vercel
vercel            # 프로젝트 링크
vercel --prod     # 프로덕션 배포
```

Vercel 프로젝트 환경변수에 위 값들과 함께 다음을 등록하세요.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 배포 도메인 (예: `https://tibedra.com`) |
| `CRON_SECRET` | Vercel Cron 인증용 임의 문자열 (Vercel이 자동으로 헤더에 첨부) |
| `REVALIDATE_TOKEN` | 수동 갱신용 토큰 (`/api/revalidate?token=...`) |

`vercel.json`에 정의된 Cron이 매일 **21:00 UTC = 06:00 KST**에 `/api/revalidate`를 호출해
뉴스를 강제 새로고침합니다. 수동 갱신은:

```bash
curl "https://<도메인>/api/revalidate?token=<REVALIDATE_TOKEN>"
```

## 4. 뉴스 소스 추가/변경

`lib/sources.ts`의 `SOURCES` 배열에 `{ name, url, category }`를 추가하면 됩니다.
RSS/Atom 피드면 모두 동작하며, 개별 피드 오류는 자동으로 건너뜁니다.

## 폴더 구조

```
app/
  layout.tsx            루트 레이아웃 (폰트/메타/광고 스크립트)
  page.tsx              홈 (톱스토리 + AI/투자 섹션)
  ai/ , investment/     카테고리 페이지
  about/ , privacy/     소개 / 개인정보 처리방침
  api/revalidate/       아침 자동 갱신 엔드포인트
  ads.txt/              AdSense ads.txt 동적 생성
  sitemap.ts, robots.ts SEO
components/             Header, Footer, NewsCard, AdSlot 등
lib/                    sources(소스목록), rss(수집·정규화), format(시간표시)
```

## 면책

모든 콘텐츠는 정보 제공 목적이며 투자 권유가 아닙니다. 기사 저작권은 각 매체에 있습니다.
