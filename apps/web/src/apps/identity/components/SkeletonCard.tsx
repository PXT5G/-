'use client';

export function SkeletonCard() {
  return (
    <div className="w-full max-w-[340px] mx-auto rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-3 w-20 bg-white/10 rounded" />
        <div className="h-5 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="flex gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded-lg" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-white/10 rounded-xl" />
        <div className="flex-1 h-12 bg-white/10 rounded-lg self-center" />
      </div>
    </div>
  );
}
