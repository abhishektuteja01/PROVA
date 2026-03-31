"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: "5px 12px", fontSize: "11px" },
  md: { padding: "8px 16px", fontSize: "13px" },
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  style,
}: ButtonProps) {
  const base: React.CSSProperties = {
    fontFamily: "var(--font-geist)",
    fontWeight: 500,
    borderRadius: "2px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "opacity 0.15s ease, background 0.15s ease",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    ...SIZE_STYLES[size],
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--color-accent)",
      color: "#fff",
      border: "1px solid var(--color-accent)",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-secondary)",
      border: "1px solid transparent",
    },
    outline: {
      background: "transparent",
      color: "var(--color-text-primary)",
      border: "1px solid var(--color-border)",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variantStyles[variant], ...style }}
    >
      {children}
    </button>
  );
}
