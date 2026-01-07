'use client';

export interface SkeletonLoaderProps {
  height?: string;
  width?: string;
  rounded?: string;
}

export function SkeletonLoader({ height = 'h-8', width = 'w-full', rounded = 'rounded' }: SkeletonLoaderProps) {
  return <div className={`${height} ${width} ${rounded} bg-gray-200 animate-pulse`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <SkeletonLoader height="h-12" width="w-3/4" />
      <SkeletonLoader height="h-8" width="w-full" />
      <SkeletonLoader height="h-8" width="w-5/6" />
      <div className="flex gap-2 pt-2">
        <SkeletonLoader height="h-8" width="w-1/4" />
        <SkeletonLoader height="h-8" width="w-1/4" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full">
        <thead className="border-b bg-neutral-50">
          <tr>
            {[1, 2, 3, 4].map(i => (
              <th key={i} className="px-4 py-2 text-left">
                <SkeletonLoader height="h-4" width="w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b">
              {[1, 2, 3, 4].map(colIdx => (
                <td key={colIdx} className="px-4 py-3">
                  <SkeletonLoader height="h-4" width="w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
