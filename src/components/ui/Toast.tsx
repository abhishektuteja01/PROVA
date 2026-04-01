"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "warning";
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  error: {
    bg: "color-mix(in srgb, var(--color-critical) 12%, var(--color-bg-secondary))",
    border: "color-mix(in srgb, var(--color-critical) 30%, transparent)",
    color: "var(--color-critical)",
  },
  success: {
    bg: "color-mix(in srgb, var(--color-compliant) 12%, var(--color-bg-secondary))",
    border: "color-mix(in srgb, var(--color-compliant) 30%, transparent)",
    color: "var(--color-compliant)",
  },
  warning: {
    bg: "color-mix(in srgb, var(--color-warning) 12%, var(--color-bg-secondary))",
    border: "color-mix(in srgb, var(--color-warning) 30%, transparent)",
    color: "var(--color-warning)",
  },
};

export default function Toast({
  message,
  type = "error",
  visible,
  onClose,
  duration = 6000,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [visible, onClose, duration]);

  const styles = TYPE_STYLES[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            background: styles.bg,
            border: `1px solid ${styles.border}`,
            borderRadius: "2px",
            padding: "12px 20px",
            maxWidth: "420px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              color: styles.color,
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {message}
          </span>
          <button
            onClick={onClose}
            aria-label="Dismiss notification"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              padding: "2px",
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
