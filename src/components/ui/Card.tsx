"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
  delay?: number;
}

const baseStyle: React.CSSProperties = {
  background: "var(--color-bg-secondary)",
  border: "1px solid var(--color-border)",
  borderRadius: "2px",
  padding: "24px",
};

export default function Card({
  children,
  className,
  style,
  animate = false,
  delay = 0,
}: CardProps) {
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
        className={className}
        style={{ ...baseStyle, ...style }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={className} style={{ ...baseStyle, ...style }}>
      {children}
    </div>
  );
}
