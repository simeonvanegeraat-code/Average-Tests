export default function BlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-28 -left-24 h-80 w-80 rounded-full blur-3xl bg-emerald-400/20" />
      <div className="absolute -bottom-24 -right-20 h-96 w-96 rounded-full blur-3xl bg-cyan-400/20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl bg-pink-400/10" />
    </div>
  );
}
