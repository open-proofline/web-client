import { ProoflineLogo } from "./ProoflineLogo";

type AuthScreenProps = {
  title: string;
  lead: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthScreen({ title, lead, children, footer }: AuthScreenProps) {
  return (
    <section className="mx-auto w-full max-w-md rounded-lg border border-proofline-border bg-proofline-surface p-5 shadow-lg shadow-proofline-bg-deep/20 sm:p-6">
      <div className="flex items-start gap-3">
        <ProoflineLogo className="size-16 shrink-0 scale-125 object-contain" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-proofline-text-muted">
            Proofline
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-proofline-text">
            {title}
          </h1>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-proofline-text-secondary">
        {lead}
      </p>

      <div className="mt-6">{children}</div>

      {footer ? (
        <div className="mt-5 text-sm leading-6 text-proofline-text-secondary">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
