type ProoflineLogoProps = {
  className?: string;
};

export function ProoflineLogo({ className }: ProoflineLogoProps) {
  return (
    <img
      src="/proofline-shield-logo.svg"
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}
