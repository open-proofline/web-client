import { Badge } from "../catalyst/badge";

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = value ?? "unknown";
  const color =
    normalized === "active" || normalized === "open"
      ? "lime"
      : normalized === "closed" || normalized === "complete"
        ? "zinc"
        : normalized === "revoked" || normalized === "failed"
          ? "red"
          : "amber";

  return <Badge color={color}>{normalized.replaceAll("_", " ")}</Badge>;
}
