'use client';

interface AppPlaceholderProps {
  appId?: string;
  appName?: string;
}

export function AppPlaceholder({ appId, appName }: AppPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-black p-8">
      <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-4xl mb-4">
        📱
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{appName ?? 'App'}</h2>
      <p className="text-sm text-white/50 text-center max-w-xs">
        This application will be built in a future phase.
      </p>
      <p className="text-xs text-white/30 mt-4 font-mono">{appId}</p>
    </div>
  );
}
