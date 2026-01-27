  import React, { useEffect, useState, useCallback } from "react";
  import { useNavigate } from "react-router-dom";
  import { db } from "../firebase.js";
  import { useAuth } from "../context/AuthContext.jsx";
  import {
    doc,
    setDoc,
    getDocs,
    getDoc,
    deleteDoc,
    updateDoc,
    collection,
  } from "firebase/firestore";

  /* ───────── Presets ───────── */
  const THEME_PRESETS = [
    {
      name: "Ocean Blue",
      primaryColor: "rgba(52,152,219,1)",
      secondaryColor: "rgba(46,204,113,1)",
      backgroundValue: "rgba(15,17,31,0.9)",
      backgroundType: "solid",
      gradientColors: {
        start: "rgba(52,152,219,0.2)",
        end: "rgba(46,204,113,0.2)",
      },
    },
    {
      name: "Sunset",
      primaryColor: "rgba(231,76,60,1)",
      secondaryColor: "rgba(241,196,15,1)",
      backgroundValue: "rgba(44,62,80,0.9)",
      backgroundType: "solid",
      gradientColors: {
        start: "rgba(231,76,60,0.3)",
        end: "rgba(241,196,15,0.3)",
      },
    },
    {
      name: "Purple Mist",
      primaryColor: "rgba(155,89,182,1)",
      secondaryColor: "rgba(52,152,219,1)",
      backgroundValue: "rgba(30,30,60,0.9)",
      backgroundType: "solid",
      gradientColors: {
        start: "rgba(155,89,182,0.3)",
        end: "rgba(52,152,219,0.3)",
      },
    },
  ];

  /* ───────── Default Safe Theme ───────── */
  const SAFE_THEME_SHAPE = {
    name: "",
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

  /* ───────── Theme Helpers ───────── */

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
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (!match) return { r: 0, g: 0, b: 0, a: 1 };
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
      a: match[4] !== undefined ? Number(match[4]) : 1,
    };
  }

  /* ───────── Main Component ───────── */

  export default function Setup() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [theme, setTheme] = useState(null);
    const [defaultTheme, setDefaultTheme] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDirty, setIsDirty] = useState(false);

    /* ───────── Admin Guard ───────── */

    useEffect(() => {
      if (!isAdmin) navigate("/store");
    }, [isAdmin, navigate]);

    /* ───────── Load Themes ───────── */

    useEffect(() => {
      if (!isAdmin) return;

      const loadThemes = async () => {
        const defaultRef = doc(db, "storeData", "default");
        const originalRef = doc(db, "storeData", "original");
        const customRef = doc(db, "storeData", "custom");

        const [defaultSnap, originalSnap, customSnap] = await Promise.all([
          getDoc(defaultRef),
          getDoc(originalRef),
          getDoc(customRef),
        ]);

        if (!defaultSnap.exists()) {
          console.error("storeData/default does not exist");
          return;
        }

        const defaultData = defaultSnap.data();
        setDefaultTheme(defaultData);

        if (!originalSnap.exists()) {
          await setDoc(originalRef, {
            ...defaultData,
            createdAt: new Date(),
          });
        }

        const activeTheme = customSnap.exists()
          ? customSnap.data()
          : defaultData;

        setTheme(normalizeTheme(activeTheme));
        setIsDirty(false);
      };

      loadThemes().catch(console.error);
    }, [isAdmin]);

    /* ───────── Load Users ───────── */

    useEffect(() => {
      if (!isAdmin) return;

      const loadUsers = async () => {
        const snap = await getDocs(collection(db, "users"));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      };

      loadUsers().catch(console.error);
    }, [isAdmin]);

    /* ───────── Theme Mutators ───────── */

    const updateTheme = useCallback((patch) => {
      setTheme((prev) => {
        const next = { ...prev, ...patch };
        return next;
      });
      setIsDirty(true);
    }, []);

    const applyPreset = useCallback((presetName) => {
      const preset = THEME_PRESETS.find((p) => p.name === presetName);
      if (!preset) return;
      setTheme(normalizeTheme(preset));
      setIsDirty(true);
    }, []);

    /* ───────── Save Theme ───────── */

    const saveThemeToFirestore = async () => {
      if (!theme) return;

      try {
        await setDoc(
          doc(db, "storeData", "custom"),
          { ...theme, updatedAt: new Date() },
          { merge: true }
        );
        alert("Theme saved");
        setIsDirty(false);
      } catch (err) {
        console.error(err);
        alert("Failed to save theme");
      }
    };

    /* ───────── Reset Theme ───────── */

    const resetToDefault = async () => {
      if (!window.confirm("Reset theme to default?")) return;

      try {
        await deleteDoc(doc(db, "storeData", "custom"));
        setTheme(normalizeTheme(defaultTheme));
        setIsDirty(false);
        alert("Theme reset to default");
      } catch (err) {
        console.error(err);
        alert("Failed to reset theme");
      }
    };

    /* ───────── Admin Toggle ───────── */

    const toggleAdmin = async (userId, currentValue) => {
      try {
        await updateDoc(doc(db, "users", userId), { admin: !currentValue });
        setUsers((u) =>
          u.map((x) => (x.id === userId ? { ...x, admin: !currentValue } : x))
        );
      } catch (err) {
        console.error(err);
        alert("Failed to update admin status");
      }
    };

    /* ───────── Filters ───────── */

    const filteredUsers = users.filter(
      (u) =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!theme || !defaultTheme) {
      return <div style={{ color: "#fff" }}>Loading store setup…</div>;
    }

    /* ───────── Debug Color Blocks ───────── */

    const renderColorBlock = (color, label) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginRight: "0.5rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: color,
            border: "1px solid #fff",
            borderRadius: "4px",
          }}
        />
        <span style={{ fontSize: "0.7rem" }}>{label}</span>
      </div>
    );

    /* ───────── Render ───────── */

    return (
      <div style={{ padding: "2rem", color: "#000000", minHeight: "100vh", background: "#ffffff74" }}>
        <h1 style={{ marginBottom: "1.5rem" }}>Store Setup</h1>

        {/* ───────── Theme Presets ───────── */}
        <div
          style={{
            ...glassCardStyle,
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2>Theme Presets</h2>

          <select
            value={theme.name || ""}
            onChange={(e) => applyPreset(e.target.value)}
            style={inputStyle}
          >
            <option value="" disabled>Select a preset</option>
            {THEME_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", flexDirection: "row" }}>
            {renderColorBlock(theme.primaryColor, "Accent")}
            {renderColorBlock(theme.primaryColor, "Top")}
            {renderColorBlock(theme.primaryColor, "Primary")}
            {renderColorBlock(theme.secondaryColor, "Secondary")}
            {renderColorBlock(theme.backgroundValue, "Background")}
          </div>
        </div>

        {/* ───────── Theme Editor + Preview ───────── */}
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          {/* Theme Editor */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={glassCardStyle}>
              <h2>Theme Editor</h2>

              <Section title="Background">
                <select
                  value={theme.backgroundType}
                  onChange={(e) => updateTheme({ backgroundType: e.target.value })}
                  style={inputStyle}
                >
                  <option value="solid">Solid</option>
                  <option value="gradient">Gradient</option>
                </select>

                <ColorControl
                  label="Background Color"
                  color={parseRgba(theme.backgroundValue)}
                  onChange={(hex, a) =>
                    updateTheme({ backgroundValue: hexToRgba(hex, a) })
                  }
                />

                {theme.backgroundType === "gradient" && (
                  <Section title="Gradient">
                    <ColorControl
                      label="Gradient Start"
                      color={parseRgba(theme.gradientColors.start)}
                      onChange={(hex, a) =>
                        updateTheme({
                          gradientColors: {
                            ...theme.gradientColors,
                            start: hexToRgba(hex, a),
                          },
                        })
                      }
                    />

                    <ColorControl
                      label="Gradient End"
                      color={parseRgba(theme.gradientColors.end)}
                      onChange={(hex, a) =>
                        updateTheme({
                          gradientColors: {
                            ...theme.gradientColors,
                            end: hexToRgba(hex, a),
                          },
                        })
                      }
                    />
                  </Section>
                )}
              </Section>

              <Section title="Brand Colors">
                <ColorControl
                  label="Top Color"
                  color={parseRgba(theme.topColor)}
                  onChange={(hex, a) =>
                    updateTheme({ topColor: hexToRgba(hex, a) })
                  }
                />

                <ColorControl
                  label="Accent Color"
                  color={parseRgba(theme.accentColor)}
                  onChange={(hex, a) =>
                    updateTheme({ accentColor: hexToRgba(hex, a) })
                  }
                />

                <ColorControl
                  label="Primary Color"
                  color={parseRgba(theme.primaryColor)}
                  onChange={(hex, a) =>
                    updateTheme({ primaryColor: hexToRgba(hex, a) })
                  }
                />

                <ColorControl
                  label="Secondary Color"
                  color={parseRgba(theme.secondaryColor)}
                  onChange={(hex, a) =>
                    updateTheme({ secondaryColor: hexToRgba(hex, a) })
                  }
                />
              </Section>

              {/* Fonts */}
              <Section title="Fonts">
                <div style={{ display: "flex", gap: "1rem", width: "fit-content" }}>
                  <FontSelect
                    label="Title Font"
                    value={theme.fontTitle}
                    onChange={(v) => updateTheme({ fontTitle: v })}
                  />
                  <FontSelect
                    label="Text Font"
                    value={theme.fontText}
                    onChange={(v) => updateTheme({ fontText: v })}
                  />
                </div>
              </Section>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  style={buttonStyle}
                  onClick={saveThemeToFirestore}
                  disabled={!isDirty}
                >
                  Save Theme
                </button>

                <button
                  style={secondaryButtonStyle}
                  onClick={() => {
                    setTheme(normalizeTheme(defaultTheme));
                    setIsDirty(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h2>Preview</h2>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                overflow: "hidden",
                width: "100%",
                height: "200px",
                fontFamily: theme.fontText,
                color: theme.primaryColor,
                display: "flex",
                flexDirection: "column",
                background:
                  theme.backgroundType === "solid"
                    ? theme.backgroundValue
                    : `linear-gradient(135deg, ${theme.gradientColors.start}, ${theme.gradientColors.end})`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 1rem",
                  backgroundColor: theme.secondaryColor,
                  color: theme.primaryColor,
                  fontFamily: theme.fontTitle,
                  fontWeight: "bold",
                }}
              >
                <span>My Store</span>
                <span>Navigate</span>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "1rem",
                  textAlign: "center",
                  color: theme.primaryColor,
                  fontFamily: theme.fontText,
                }}
              >
                <p>
                  Welcome to your store! This panel previews your theme colors and
                  fonts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── User Management ───────── */}
        <div style={glassCardStyle}>
          <h2>User Management</h2>

          <input
            style={{ ...inputStyle, marginBottom: "1rem" }}
            placeholder="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ul style={{ listStyle: "none", padding: 0 }}>
            {filteredUsers.map((u) => (
              <li key={u.id} style={userRowStyle}>
                <span>{u.email}</span>
                <button
                  style={smallButtonStyle}
                  onClick={() => toggleAdmin(u.id, !!u.admin)}
                >
                  {u.admin ? "Revoke Admin" : "Make Admin"}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <button
            style={{ ...buttonStyle, background: "rgba(231,76,60,0.85)" }}
            onClick={resetToDefault}
          >
            Reset Theme to Default
          </button>
        </div>
      </div>
    );
  }

  /* ───────── UI Helpers ───────── */

  function Section({ title, children }) {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>{title}</h3>
        {children}
      </div>
    );
  }

  function FontSelect({ label, value, onChange }) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>{label}</label>
        <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Roboto">Roboto</option>
          <option value="Montserrat">Montserrat</option>
        </select>
      </div>
    );
  }

  function ColorControl({ label, color, onChange }) {
    const hex = `#${((1 << 24) + (color.r << 16) + (color.g << 8) + color.b)
      .toString(16)
      .slice(1)}`;

    return (
      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value, color.a)}
          />
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

  /* ───────── Styles ───────── */

  const glassCardStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1.5rem",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem",
    borderRadius: "6px",
    border: "1px solid #aaa",
    background: "#111",
    color: "#fff",
  };

  const buttonStyle = {
    padding: "0.6rem 1rem",
    border: "none",
    borderRadius: "6px",
    background: "rgba(52,152,219,0.85)",
    color: "#fff",
    cursor: "pointer",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "rgba(189,195,199,0.85)",
  };

  const smallButtonStyle = {
    padding: "0.3rem 0.6rem",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    background: "rgba(52,152,219,0.8)",
    color: "#fff",
  };

  const labelStyle = {
    fontSize: "0.85rem",
    marginBottom: "0.25rem",
  };

  const userRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  };
