type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
};

type ContentSectionProps = {
  title?: string;
  eyebrow?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
};

type InlineStatusProps = {
  tone?: "info" | "warning" | "danger" | "success";
  role?: "status" | "alert";
  children: React.ReactNode;
};

type MetadataRowItem = {
  label: string;
  value?: React.ReactNode;
};

const statusClasses = {
  info: "border-proofline-info/40 bg-proofline-info-bg text-proofline-info",
  warning:
    "border-proofline-warning/40 bg-proofline-warning-bg text-proofline-warning",
  danger:
    "border-proofline-danger/40 bg-proofline-danger-bg text-proofline-danger",
  success:
    "border-proofline-success/40 bg-proofline-success-bg text-proofline-success",
};

export function PageHeader({ eyebrow, title, body, action }: PageHeaderProps) {
  return (
    <section className="rounded-lg border border-proofline-border bg-proofline-surface p-5 shadow-lg shadow-proofline-bg-deep/20 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-sm font-medium text-proofline-text-muted">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 break-words text-2xl font-semibold text-proofline-text">
            {title}
          </h1>
          {body ? (
            <div className="mt-3 max-w-3xl text-sm leading-6 text-proofline-text-secondary">
              {body}
            </div>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

export function ContentSection({
  title,
  eyebrow,
  trailing,
  children,
}: ContentSectionProps) {
  return (
    <section className="rounded-lg border border-proofline-border bg-proofline-surface p-5 shadow-lg shadow-proofline-bg-deep/20 sm:p-6">
      {title || eyebrow || trailing ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow ? (
              <p className="text-sm font-medium text-proofline-text-muted">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="text-lg font-semibold text-proofline-text">
                {title}
              </h2>
            ) : null}
          </div>
          {trailing ? (
            <div className="text-sm text-proofline-text-muted">{trailing}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function InlineStatus({
  tone = "info",
  role = "status",
  children,
}: InlineStatusProps) {
  return (
    <div
      role={role}
      className={`rounded-md border p-3 text-sm leading-6 ${statusClasses[tone]}`}
    >
      {children}
    </div>
  );
}

export function MetadataRow({
  title,
  items,
  status,
  href,
}: {
  title: React.ReactNode;
  items: MetadataRowItem[];
  status?: React.ReactNode;
  href?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="break-words font-medium text-proofline-text">
          {title}
        </div>
        {href ? <div className="mt-1">{href}</div> : null}
      </div>
      <dl className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs font-medium uppercase text-proofline-text-muted">
              {item.label}
            </dt>
            <dd className="mt-1 break-words text-sm text-proofline-text-secondary">
              {item.value ?? "Not set"}
            </dd>
          </div>
        ))}
      </dl>
      {status ? <div className="lg:justify-self-end">{status}</div> : null}
    </div>
  );
}
