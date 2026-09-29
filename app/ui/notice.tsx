export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-4 text-sm text-danger">{children}</p>;
}

export function SuccessNotice({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-4 rounded-md border border-success/20 bg-success/5 px-3 py-2 text-sm text-success">
      {children}
    </p>
  );
}
