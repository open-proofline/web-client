export function MetadataGrid({
  items,
}: {
  items: Array<{ label: string; value?: string | number | null | undefined }>;
}) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-3">
          <dt className="text-xs font-medium uppercase text-zinc-500">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm text-zinc-950">
            {item.value ?? "Not set"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
