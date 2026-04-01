"use client";

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  style?: React.CSSProperties;
}

export default function TextArea({
  value,
  onChange,
  placeholder,
  rows = 8,
  maxLength,
  style,
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      style={{
        fontFamily: "var(--font-geist)",
        fontSize: "13px",
        color: "var(--color-text-primary)",
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        borderRadius: "2px",
        padding: "12px",
        width: "100%",
        resize: "vertical",
        lineHeight: 1.6,
        ...style,
      }}
    />
  );
}
