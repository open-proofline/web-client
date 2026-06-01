export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = value ?? "unknown";
  const classes =
    normalized === "active" || normalized === "open"
      ? "border-proofline-success/40 bg-proofline-success-bg text-proofline-success"
      : normalized === "closed" || normalized === "complete"
        ? "border-proofline-border bg-proofline-surface-elevated text-proofline-text-secondary"
        : normalized === "revoked" || normalized === "failed"
          ? "border-proofline-danger/40 bg-proofline-danger-bg text-proofline-danger"
          : "border-proofline-warning/40 bg-proofline-warning-bg text-proofline-warning";

  return (
    <span
      className={`inline-flex w-fit items-center self-start rounded-md border px-2 py-1 text-xs font-medium ${classes}`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
