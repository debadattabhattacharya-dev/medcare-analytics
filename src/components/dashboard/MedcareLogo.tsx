export function MedcareLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <span className="text-2xl font-light tracking-wider text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
        exotel
      </span>
    </div>
  );
}
