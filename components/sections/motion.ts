import type { Transition, Variants } from "framer-motion";

export const revealViewport = {
  once: true,
  amount: 0.22,
  margin: "0px 0px -10% 0px",
} as const;

export const revealTransition: Transition = {
  type: "spring",
  stiffness: 118,
  damping: 20,
  mass: 0.7,
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const revealCard: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const revealTimelineCard: Variants = {
  hidden: { opacity: 0, x: 26, y: 14, scale: 0.985 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1 },
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
