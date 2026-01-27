export default function TextRipple({ x, y }) {
  return (
    <span
      className="text-ripple"
      style={{
        left: x,
        top: y,
        position: "fixed",
        pointerEvents: "none",
      }}
    >
      +
    </span>
  );
}
