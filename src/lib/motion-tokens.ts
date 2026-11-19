export const motionTokens = {
  duration: { fast: 0.18, slow: 0.6, orbit: 80, float: 6 },
  easing: { smooth: [0.22, 1, 0.36, 1] as const, linear: "linear" as const },
  distance: { sm: 8, lg: 24 },
};

export const springs = {
  gentle: { type: "spring" as const, stiffness: 120, damping: 14 },
};
