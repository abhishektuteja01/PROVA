"use client";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  style,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      style={{
        fontFamily: "var(--font-geist)",
        fontSize: "13px",
        color: "var(--color-text-primary)",
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        borderRadius: "2px",
        padding: "7px 12px",
        width: "100%",
        ...style,
      }}
    />
  );
}
