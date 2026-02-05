export default function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-border-default bg-bg-card p-5 ${className}`}>
      <div className="skeleton mb-3 h-3 w-24" />
      <div className="skeleton mb-2 h-8 w-32" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}
