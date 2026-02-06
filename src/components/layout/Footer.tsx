export default function Footer() {
  return (
    <footer className="border-t border-border-default py-6">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 md:px-6">
        <p className="text-[10px] tracking-wide text-text-muted">
          Data collected via publicly available sources
        </p>
        <p className="text-[10px] tracking-wide text-text-muted">
          <span className="text-red-streak">RED</span>
          <span className="mx-1 text-text-muted/50">vs</span>
          <span className="text-green-streak">GREEN</span>
        </p>
      </div>
    </footer>
  );
}
