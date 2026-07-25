export function EntranceChips({ entrances }: { entrances: string[] }) {
  if (entrances.length === 0) {
    return <p className="text-sm text-charcoal-muted">No entrances currently affected</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {entrances.map((e) => (
        <span
          key={e}
          className="rounded-full bg-surface-muted border border-line px-2.5 py-1 text-xs font-medium text-charcoal-muted"
        >
          {e}
        </span>
      ))}
    </div>
  );
}
