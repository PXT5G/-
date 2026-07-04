'use client';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-white/50 max-w-xs">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onPress}
          className="mt-4 px-4 py-2 rounded-xl bg-banana-gold text-black text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
