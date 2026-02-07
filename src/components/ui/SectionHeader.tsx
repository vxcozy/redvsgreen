interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function SectionHeader({ title, children }: Props) {
  return (
    <div className="mb-1.5 flex items-center justify-between px-1 sm:mb-2">
      <div className="flex items-center gap-2">
        <span className="h-3 w-[2px] rounded-full bg-accent sm:h-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-secondary sm:text-[11px] sm:tracking-[0.2em]">
          {title}
        </span>
      </div>
      {children && (
        <div className="flex items-center gap-2 sm:gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
