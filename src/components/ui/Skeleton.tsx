interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({
  width,
  height,
  borderRadius = 2,
  className = "",
  style,
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: "var(--color-bg-tertiary)",
        ...style,
      }}
    />
  );
}
