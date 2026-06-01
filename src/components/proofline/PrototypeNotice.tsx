export function PrototypeNotice() {
  return (
    <div className="border-b border-proofline-warning bg-proofline-warning-bg px-4 py-3 text-sm text-proofline-text">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <strong className="text-proofline-warning">
          Experimental prototype. Not for emergency reliance.
        </strong>
        <span className="text-proofline-text-secondary">
          Users or trusted contacts remain responsible for contacting emergency
          services.
        </span>
      </div>
    </div>
  );
}
