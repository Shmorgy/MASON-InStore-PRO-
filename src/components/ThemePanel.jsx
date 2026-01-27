import React, { useEffect, useState } from "react";

/* ───────── safe defaults ───────── */
const SAFE_THEME_SHAPE = {
  backgroundType: "solid",
  backgroundValue: "rgba(0,0,0,0.1)",
  primaryColor: "rgba(52,152,219,1)",
  secondaryColor: "rgba(46,204,113,1)",
  fontTitle: "Arial",
  fontText: "Arial",
  gradientColors: {
    start: "rgba(0,0,0,0.2)",
    end: "rgba(0,0,0,0.4)",
  },
};

/* ───────── helpers ───────── */
function normalizeTheme(input) {
  return {
    ...SAFE_THEME_SHAPE,
    ...input,
    gradientColors: {
      ...SAFE_THEME_SHAPE.gradientColors,
      ...(input?.gradientColors || {}),
    },
  };
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

/* ───────── component ───────── */
export default function ThemePanel({ theme, onSave }) {
  const [draftTheme, setDraftTheme] = useState(() => normalizeTheme(theme));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setDraftTheme(normalizeTheme(theme));
    setIsDirty(false);
  }, [theme]);

  const updateDraft = (updater) => {
    setDraftTheme((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setIsDirty(true);
      return normalizeTheme(next);
    });
  };

  const saveTheme = () => {
    onSave(draftTheme);
    setIsDirty(false);
  };

  const cancelChanges = () => {
    setDraftTheme(normalizeTheme(theme));
    setIsDirty(false);
  };

  const bg = parseRgba(draftTheme.backgroundValue);
  const primary = parseRgba(draftTheme.primaryColor);
  const secondary = parseRgba(draftTheme.secondaryColor);
  const gradStart = parseRgba(draftTheme.gradientColors.start);
  const gradEnd = parseRgba(draftTheme.gradientColors.end);

  return (
    <div style={panelStyle}>
      <h2>Theme Customisation</h2>

      <Section title="Background">
        <select
          value={draftTheme.backgroundType}
          onChange={(e) =>
            updateDraft((t) => ({ ...t, backgroundType: e.target.value }))
          }
          style={inputStyle}
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
        </select>

        <ColorControl
          label="Background Color"
          color={bg}
          onChange={(hex, a) =>
            updateDraft((t) => ({ ...t, backgroundValue: hexToRgba(hex, a) }))
          }
        />
      </Section>

      {draftTheme.backgroundType === "gradient" && (
        <Section title="Gradient">
          <ColorControl
            label="Gradient Start"
            color={gradStart}
            onChange={(hex, a) =>
              updateDraft((t) => ({
                ...t,
                gradientColors: { ...t.gradientColors, start: hexToRgba(hex, a) },
              }))
            }
          />
          <ColorControl
            label="Gradient End"
            color={gradEnd}
            onChange={(hex, a) =>
              updateDraft((t) => ({
                ...t,
                gradientColors: { ...t.gradientColors, end: hexToRgba(hex, a) },
              }))
            }
          />
        </Section>
      )}

      <Section title="Brand Colors">
        <ColorControl
          label="Primary Color"
          color={primary}
          onChange={(hex, a) =>
            updateDraft((t) => ({ ...t, primaryColor: hexToRgba(hex, a) }))
          }
        />
        <ColorControl
          label="Secondary Color"
          color={secondary}
          onChange={(hex, a) =>
            updateDraft((t) => ({ ...t, secondaryColor: hexToRgba(hex, a) }))
          }
        />
      </Section>

      <Section title="Fonts">
        <input
          style={inputStyle}
          value={draftTheme.fontTitle}
          onChange={(e) => updateDraft((t) => ({ ...t, fontTitle: e.target.value }))}
        />
        <input
          style={inputStyle}
          value={draftTheme.fontText}
          onChange={(e) => updateDraft((t) => ({ ...t, fontText: e.target.value }))}
        />
      </Section>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={saveTheme}
          disabled={!isDirty}
          style={{ ...buttonStyle, opacity: isDirty ? 1 : 0.5 }}
        >
          Save Theme
        </button>

        {isDirty && <button onClick={cancelChanges} style={secondaryButtonStyle}>Cancel</button>}
      </div>
    </div>
  );
}

/* ───────── helpers ───────── */
function ColorControl({ label, color, onChange }) {
  const hex = `#${((1 << 24) + (color.r << 16) + (color.g << 8) + color.b)
    .toString(16)
    .slice(1)}`;
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value, color.a)} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={color.a}
          onChange={(e) => onChange(hex, Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

/* ───────── styles ───────── */
const panelStyle = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(12px)",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
};

const inputStyle = {
  width: "100%",
  padding: "0.6rem",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  marginBottom: "0.75rem",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.4rem",
  fontWeight: "bold",
};

const buttonStyle = {
  padding: "0.7rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: "var(--FA-color)",
  color: "#fff",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  padding: "0.7rem 1.5rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.3)",
  background: "transparent",
  color: "#fff",
};
