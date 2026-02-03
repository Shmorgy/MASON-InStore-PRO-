import React, { useEffect, useState, useCallback, useRef } from "react";

import { ChromePicker } from "react-color";

export default function ColorPickerBlock({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  const toggleOpen = (e) => {
    
    setIsOpen((prev) => !prev);
  };

  

  // Convert RGBA to hex for ChromePicker
  const { r, g, b, a } = parseRgba(value);
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)}`;

  function parseRgba(rgba) {
  if (typeof rgba !== "string") return { r: 0, g: 0, b: 0, a: 1 };
  const match = rgba.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
  );
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  };
}

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          onClick={toggleOpen}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "8px",
            border: "2px solid #333",
            backgroundColor: hex,
            cursor: "pointer",
            color:"rgb(255, 255, 255)",
            position:"relative"
          }}
        />
        <span style={{ fontSize: "0.95rem", fontWeight: "500", minWidth: "90px", color:"rgb(255, 255, 255)" }}>
          {label}
        </span>
      </div>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()} // prevent clicks inside picker from closing
          style={{ position: "absolute", zIndex: 1000, marginTop: "0.5rem", }}
        >
          <ChromePicker
            
            color={hex}
            onChange={(c) => {
              const { r, g, b, a } = c.rgb;
              onChange(`rgba(${r},${g},${b},${a})`);
            }}
          />
        </div>
      )}
    </div>
  );
}