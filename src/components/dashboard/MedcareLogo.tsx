export function MedcareLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl overflow-hidden ${className}`} style={{ backgroundColor: "#9B2761" }}>
      <div className="px-3 py-2 text-center">
        <div className="text-white font-bold text-lg tracking-wide leading-none">MED</div>
        <div className="text-white/80 font-light text-sm tracking-widest leading-none">CARE</div>
      </div>
    </div>
  );
}
