export default function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 animate-pulse rounded-full bg-accent" />
        <div className="h-1 w-1 animate-pulse rounded-full bg-accent" style={{ animationDelay: '0.15s' }} />
        <div className="h-1 w-1 animate-pulse rounded-full bg-accent" style={{ animationDelay: '0.3s' }} />
        <span className="ml-2 text-[11px] tracking-wide text-text-muted">Loading data</span>
      </div>
    </div>
  );
}
