export default function Loading() {
  return (
    <div className="container-page py-8">
      <div className="mb-8 h-12 animate-pulse rounded-lg bg-line/60" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-line/60" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-line/60" />
          <div className="h-4 w-full animate-pulse rounded bg-line/40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-md bg-line/60" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-full animate-pulse rounded bg-line/50" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-line/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
