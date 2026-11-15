export function Loader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ivory" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <svg width="72" height="48" viewBox="0 0 72 48" aria-hidden>
          <path d="M4 44 Q36 -8 68 44" fill="none" stroke="#D8D3C9" strokeWidth="2" />
          <path d="M4 44 Q36 -8 68 44" fill="none" stroke="#B66A4A" strokeWidth="2" strokeDasharray="120" strokeDashoffset="120">
            <animate attributeName="stroke-dashoffset" values="120;0;-120" dur="2.2s" repeatCount="indefinite" />
          </path>
          <path d="M0 46h72" stroke="#262723" strokeWidth="1.5" />
        </svg>
        <p className="label">{label}</p>
      </div>
    </div>
  );
}
