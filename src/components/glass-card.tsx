export function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-glass border border-hairline bg-glass shadow-glass backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}
