export const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const smoothTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 35,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export const slideUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
  transition: springTransition,
};

export const slideDown = {
  initial: { opacity: 0, y: -40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
  transition: springTransition,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: springTransition,
};

export const bootSequence = {
  logo: {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
  progress: {
    initial: { width: '0%' },
    animate: { width: '100%' },
    transition: { duration: 2.5, ease: 'easeInOut' },
  },
};

export const unlockAnimation = {
  lockScreen: {
    exit: { y: '-100%', opacity: 0 },
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  },
  homeScreen: {
    initial: { scale: 1.1, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] },
  },
};


export const appIconBounce = {
  whileTap: { scale: 0.85 },
  transition: { type: 'spring' as const, stiffness: 500, damping: 15 },
};

export const dockAnimation = {
  initial: { y: 100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { delay: 0.2, ...springTransition },
};

/** iPhone 16 Pro Max Dynamic Island — idle 126×37pt, top inset 11pt */
export const islandExpand = {
  idle: { width: 126, height: 37, borderRadius: 20 },
  compact: { width: 236, height: 37, borderRadius: 20 },
  expanded: { width: 384, height: 172, borderRadius: 44 },
  activity: { width: 236, height: 37, borderRadius: 20 },
};

export const controlCenterSlide = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
  transition: { type: 'spring' as const, stiffness: 300, damping: 35 },
};

export const notificationSlide = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: springTransition,
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: springTransition,
};
