export function IconButton({
  label,
  onClick,
  expanded,
  children,
}: {
  label: string;
  onClick?: () => void;
  expanded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      title={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-hairline hover:text-foreground"
    >
      {children}
    </button>
  );
}
