export function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center text-xs text-muted">
      <div className="mb-3 text-muted2">{icon}</div>
      <div className="mb-2 font-gilroy-bold text-lg font-bold text-muted2">
        {title}
      </div>
      {sub}
    </div>
  );
}
