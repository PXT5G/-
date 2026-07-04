import { create } from 'zustand';

interface SoundState {
  enabled: boolean;
  volume: number;
  currentSound: string | null;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  play: (soundId: string) => void;
  stop: () => void;
}

const soundMap: Record<string, string> = {
  unlock: '/sounds/unlock.mp3',
  lock: '/sounds/lock.mp3',
  tap: '/sounds/tap.mp3',
  notification: '/sounds/notification.mp3',
  boot: '/sounds/boot.mp3',
  swipe: '/sounds/swipe.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
};

const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement {
  if (!audioCache.has(src)) {
    const audio = new Audio(src);
    audioCache.set(src, audio);
  }
  return audioCache.get(src)!;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  enabled: true,
  volume: 0.7,
  currentSound: null,

  setEnabled: (enabled) => set({ enabled }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  play: (soundId) => {
    const { enabled, volume } = get();
    if (!enabled || typeof window === 'undefined') return;

    const src = soundMap[soundId];
    if (!src) return;

    try {
      const audio = getAudio(src);
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
      set({ currentSound: soundId });
    } catch {
      // Audio playback not available
    }
  },

  stop: () => {
    audioCache.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    set({ currentSound: null });
  },
}));

export const SOUND_IDS = Object.keys(soundMap);
