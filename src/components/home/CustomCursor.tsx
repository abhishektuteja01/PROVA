"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [variant, setVariant] = useState<"default" | "pointer" | "text">("default");
  const [hidden, setHidden] = useState(true);

  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);

  const ringX = useSpring(mx, { stiffness: 180, damping: 22 });
  const ringY = useSpring(my, { stiffness: 180, damping: 22 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      setHidden(false);
    };

    const over = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const cursor = window.getComputedStyle(el).cursor;
      if (cursor === "pointer" || el.tagName === "A" || el.tagName === "BUTTON") {
        setVariant("pointer");
      } else if (cursor === "text") {
        setVariant("text");
      } else {
        setVariant("default");
      }
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    document.documentElement.addEventListener("mouseleave", () => setHidden(true));
    document.documentElement.addEventListener("mouseenter", () => setHidden(false));

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [mx, my]);

  const dotSize = variant === "pointer" ? 10 : 5;
  const ringSize = variant === "pointer" ? 48 : variant === "text" ? 4 : 36;

  return (
    <>
      {/* Dot — follows exactly */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: mx,
          y: my,
          translateX: "-50%",
          translateY: "-50%",
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          zIndex: 99999,
          pointerEvents: "none",
          opacity: hidden ? 0 : 1,
          transition: "width 0.2s ease, height 0.2s ease, opacity 0.25s ease",
        }}
      />
      {/* Ring — spring lag */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          border: variant === "pointer"
            ? "1.5px solid rgba(59,130,246,0.7)"
            : "1px solid rgba(255,255,255,0.22)",
          zIndex: 99998,
          pointerEvents: "none",
          opacity: hidden ? 0 : variant === "pointer" ? 1 : 0.5,
          transition: "width 0.25s ease, height 0.25s ease, opacity 0.25s ease, border-color 0.25s ease",
          backdropFilter: variant === "pointer" ? "invert(0.08)" : "none",
        }}
      />
    </>
  );
}
