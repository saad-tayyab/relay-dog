export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-dark-border" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-accent animate-spin" />
      </div>
    </div>
  );
}
