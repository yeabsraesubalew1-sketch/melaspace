import type { Transition, Variants } from "framer-motion";

export const revealViewport = {
  once: true,
  amount: 0.12,
  margin: "0px 0px -30px 0px",
} as const;

export const revealTransition: Transition = {
  duration: 0.52,
  ease: [0.21, 0.47, 0.32, 0.98],
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

// Pure translation + opacity prevents mobile WebKit subpixel text snapping (the "blink" at end of scale)
export const revealCard: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const revealTimelineCard: Variants = {
  hidden: { opacity: 0, x: 20, y: 10 },
  visible: { opacity: 1, x: 0, y: 0 },
};

export const revealStagger: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
};
