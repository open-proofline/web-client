export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-proofline-border bg-proofline-surface px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-proofline-text">{title}</h2>
      <p className="mt-2 text-sm text-proofline-text-muted">{body}</p>
    </div>
  );
}
