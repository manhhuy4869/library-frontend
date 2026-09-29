export function EmptyState({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-ink-soft">
        {children}
      </td>
    </tr>
  );
}
