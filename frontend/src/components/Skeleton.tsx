type SkeletonProps = {
  className?: string;
};

/** Base shimmer block */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-3">
      <Skeleton className="aspect-[4/3] w-full rounded-[1.25rem]" />
      <div className="space-y-2 px-2 pb-3 pt-4">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-[80%] rounded-full" />
        <Skeleton className="h-4 w-[40%] rounded-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div
      className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading product"
    >
      <div>
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <Skeleton className="h-16 w-16 rounded-xl" />
          <Skeleton className="h-16 w-16 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4 pt-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-10 w-[80%] rounded-xl" />
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-12 w-28 rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function LandingSkeleton() {
  return (
    <div className="spatial-canvas" aria-busy="true" aria-label="Loading storefront">
      <div className="spatial-layer px-4 pb-16 pt-2 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="h-[min(72vh,580px)] min-h-[400px] w-full rounded-[2rem]" />
        </div>
        <div className="mx-auto mt-10 max-w-7xl">
          <Skeleton className="mx-auto mb-4 h-8 w-56 rounded-full" />
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-[1.5rem]" />
            ))}
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-7xl space-y-10">
          <Skeleton className="h-28 w-full rounded-[2rem]" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton({
  rows = 8,
  cols = 7,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b border-white/5">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton
                className={`h-4 rounded-full bg-white/10 ${
                  c === 0 ? "h-12 w-12 rounded-lg" : c === 1 ? "w-40" : "w-16"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
