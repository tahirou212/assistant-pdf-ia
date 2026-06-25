export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-slate-600 border-t-brand-500 rounded-full animate-spin"
    />
  )
}
