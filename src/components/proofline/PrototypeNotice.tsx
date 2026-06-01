export function PrototypeNotice() {
  return (
    <div className="border-b border-zinc-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <strong>Experimental prototype. Not for emergency reliance.</strong>
        <span>
          Users or trusted contacts remain responsible for contacting emergency
          services.
        </span>
      </div>
    </div>
  );
}
