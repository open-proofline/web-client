export function MetadataGrid({
  items,
}: {
  items: Array<{ label: string; value?: string | number | null | undefined }>;
}) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-lg border border-proofline-border bg-proofline-border sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 bg-proofline-surface px-4 py-3"
        >
          <dt className="text-xs font-medium uppercase text-proofline-text-muted">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm text-proofline-text">
            {item.value ?? "Not set"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
