export function Badge({ variant, children }: { variant: 'warning' | 'neutral'; children: React.ReactNode }) {
  return <span className={variant === 'warning' ? 'badge-warning' : 'badge-neutral'}>{children}</span>;
}
