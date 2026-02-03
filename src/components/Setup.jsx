import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { useStore } from "../context/StoreProvider.jsx";
import ColorPickerBlock from "./tools/colorPickerBlock.jsx";
/* ───────── Presets ───────── */
const THEME_PRESETS = [
  {
    name: "Forest",
    topColor: "rgba(0, 115, 48, 0.53)",
    accentColor: "rgb(35, 108, 58)",
    primaryColor: "rgb(255, 255, 255)",
    secondaryColor: "rgb(255, 255, 255)",
    backgroundValue: "rgba(15,17,31,0.9)",
    backgroundType: "gradient",
    gradientColors: {
      start: "rgba(95, 255, 106, 0.65)",
      end: "rgb(32, 102, 61)",
    },
    fontTitle: "Roboto",
    fontText: "F25",
  },
  {
    name: "Ocean Blue",
    topColor: "rgba(67, 139, 154, 0.53)",
    accentColor: "rgb(202, 253, 255)",
    primaryColor: "rgba(52,152,219,1)",
    secondaryColor: "rgb(72, 46, 204)",
    backgroundValue: "rgba(15,17,31,0.9)",
    backgroundType: "solid",
    gradientColors: {
      start: "rgba(52,152,219,1)",
      end: "rgba(46,204,113,1)",
    },
    fontTitle: "var(--font-title)",
    fontText: "var(--font-text)",
  },
  {
    name: "Sunset",
    topColor: "rgba(255, 68, 0, 0.47)",
    accentColor: "rgb(255, 255, 255)",
    primaryColor: "rgba(231,76,60,1)",
    secondaryColor: "rgba(241,196,15,1)",
    backgroundValue: "rgb(148, 91, 25)",
    backgroundType: "solid",
    gradientColors: {
      start: "rgba(231,76,60,1)",
      end: "rgba(241,196,15,1)",
    },
    fontTitle: "Georgia",
    fontText: "Georgia",
  },
  {
    name: "Purple Mist",
    topColor: "rgb(155, 89, 182)",
    accentColor: "rgb(255, 255, 255)",
    primaryColor: "rgba(155,89,182,1)",
    secondaryColor: "rgba(52,152,219,1)",
    backgroundValue: "rgba(30,30,60,0.9)",
    backgroundType: "solid",
    gradientColors: {
      start: "rgba(155,89,182,1)",
      end: "rgba(52,152,219,1)",
    },
    fontTitle: "Verdana",
    fontText: "Verdana",
  },
  {
    name: "Default",
    topColor: "rgba(255, 255, 255, 0.19)",
    accentColor: "rgb(255, 255, 255)",
    primaryColor: "rgb(255, 255, 255)",
    secondaryColor: "rgb(255, 255, 255)",
    backgroundValue: "rgba(0, 0, 0, 0.9)",
    backgroundType: "solid",
    gradientColors: {
      start: "rgba(155,89,182,1)",
      end: "rgba(52,152,219,1)",
    },
    fontTitle: "Arial",
    fontText: "Arial",
  },
];

/* ───────── Default Safe Theme ───────── */
const SAFE_THEME_SHAPE = {
  name: "",
  backgroundType: "solid",
  backgroundValue: "",
  primaryColor: "",
  secondaryColor: "",
  topColor: "",
  accentColor: "",
  fontTitle: "Arial",
  fontText: "Arial",
  gradientColors: {
    start: "rgba(0,0,0,1)",
    end: "rgba(0,0,0,1)",
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

/* ───────── Main Component ───────── */
export default function Setup() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { storeName } = useStore();

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

      const activeTheme = customSnap.exists() ? customSnap.data() : defaultData;
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
    setTheme((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }, []);

  const applyPreset = useCallback((presetName) => {
    const preset = THEME_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setTheme(normalizeTheme(preset));
    setIsDirty(true);
  }, []);

  /* ───────── Save / Reset ───────── */
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
      (u.username &&
        u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!theme || !defaultTheme) {
    return <div style={{ color: "#fff" }}>Loading store setup…</div>;
  }











  

  /* ───────── Computed Styles ───────── */
  const bg =
    theme.backgroundType === "solid"
      ? theme.backgroundValue
      : `linear-gradient(135deg, ${theme.gradientColors.start}, ${theme.gradientColors.end})`;

  /* ───────── Render ───────── */
  return (
    <div
      style={{
        objectFit: "contain",
        padding: "clamp(1rem, 3vw, 2.5rem)",
        color: "#000",
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        background: "linear-gradient(135deg, #f5f7fa00 0%, #c3cfe200 100%)",
      }}
    >
      {/* Theme Editor + Preview */}
      <div style={glassCardStyle}>
        

        {/* Main Layout Grid */}
        <div
          className="theme-layout"
          style={{
            display: "grid",
            gridColumn: "1 / -1",
            gridTemplateColumns: "280px 1fr 480px",
            gap: "2.5rem",
            alignItems: "start",
            maxHeight:"fit-content"
          }}
        >
          {/* Left Column - Brand Colors & Background */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxHeight:"50vh", }}>
            {/* Brand Colors Section */}
            <Section title="Brand Colors">
              <ColorPickerBlock
                label="Top Bar"
                value={theme.topColor}
                onChange={(v) => updateTheme({ topColor: v })}
                
              />
              <ColorPickerBlock
                label="Accent"
                value={theme.accentColor}
                onChange={(v) => updateTheme({ accentColor: v })}
              />
              <ColorPickerBlock
                label="Primary"
                value={theme.primaryColor}
                onChange={(v) => updateTheme({ primaryColor: v })}
              />
              <ColorPickerBlock
                label="Secondary"
                value={theme.secondaryColor}
                onChange={(v) => updateTheme({ secondaryColor: v })}
              />
            </Section>

            {/* Background Section */}
            <Section title="Background">
              <select
                value={theme.backgroundType}
                onChange={(e) =>
                  updateTheme({ backgroundType: e.target.value })
                }
                style={{ ...inputStyle, width: "100%",  }}
              >
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
              </select>
              {theme.backgroundType === "gradient" ? (
                <div style={{ marginTop: "1.25rem" }}>
                  <ColorPickerBlock
                    label="Start"
                    value={theme.gradientColors.start}
                    onChange={(v) =>
                      updateTheme({
                        gradientColors: { ...theme.gradientColors, start: v },
                      })
                    }
                  />
                  <ColorPickerBlock
                    label="End"
                    value={theme.gradientColors.end}
                    onChange={(v) =>
                      updateTheme({
                        gradientColors: { ...theme.gradientColors, end: v },
                      })
                    }
                  />
                </div>
              ) : (
                <div style={{ marginTop: "1.25rem" }}>
                  <ColorPickerBlock
                    label="Color"
                    value={theme.backgroundValue}
                    onChange={(v) => updateTheme({ backgroundValue: v })}
                  />
                </div>
              )}
            </Section>
          </div>

          {/* Center Column - Presets & Fonts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Theme Presets */}
            <Section title="Quick Presets">
              <select
                value={theme.name || ""}
                onChange={(e) => applyPreset(e.target.value)}
                style={{ ...inputStyle, width: "100%", textAlign: "left" }}
              >
                <option value="" disabled>
                  Choose a preset theme...
                </option>
                {THEME_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  gap: "1rem",
                  marginTop: "1.25rem",
                  padding: "1rem",
                  background: "rgba(0,0,0,0.02)",
                  borderRadius: "12px",
                }}
              >
                {renderColorBlock(theme.topColor, "Top")}
                {renderColorBlock(theme.accentColor, "Accent")}
                {renderColorBlock(theme.primaryColor, "Primary")}
                {renderColorBlock(theme.secondaryColor, "Secondary")}
              </div>
            </Section>

            {/* Fonts Section */}
            <Section title="Typography">
              <FontSelect
                label="Heading Font"
                value={theme.fontTitle}
                onChange={(v) => updateTheme({ fontTitle: v })}
              />
              <FontSelect
                label="Body Font"
                value={theme.fontText}
                onChange={(v) => updateTheme({ fontText: v })}
              />
            </Section>

            
          </div>
          
          {/* Right Column - Live Preview */}
          <div style={previewWrapperStyle}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              
              
            }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
                Live Preview
              </h3>
              <span style={{ 
                fontSize: "0.75rem", 
                color: "#666",
                background: "#e9ecef",
                padding: "0.25rem 0.75rem",
                borderRadius: "12px",
                fontWeight: "500",
              }}>
                Updates in real-time
              </span>
            </div>
            <div
              className="preview-panel"
              style={{
                objectFit:"contain",

                fontFamily: theme.fontText,
                background: bg,
                color: theme.primaryColor,
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <header
                style={{
                  ...headerStyle,
                  backgroundColor: theme.topColor,
                  color: theme.primaryColor,
                  fontFamily: theme.fontTitle,
                }}
              >
                <div style={{ fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.02em" }}>
                  {storeName || "Your Store"}
                </div>

                <button
                  style={{
                    ...signInButtonStyle,
                    backgroundColor: "transparent",
                    color: theme.primaryColor,
                    
                  }}
                >
                  Sign In
                </button>
              </header>

              {/* Body */}
              <main style={bodyStyle}>
                {/* Hero Section */}
                <section style={heroSectionStyle}>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: theme.fontTitle,
                      color: theme.primaryColor,
                      fontSize: "1.75rem",
                      fontWeight: "700",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    Welcome to {storeName || "Your Store"}
                  </h2>
                  <p
                    style={{
                      ...heroSubtitleStyle,
                      color: theme.primaryColor,
                      fontFamily: theme.fontText,
                      opacity: 0.85,
                    }}
                  >
                    Beautiful storefront. Seamless checkout. Built for growth.
                  </p>

                  <button
                    style={{
                      ...ctaButtonStyle,
                      backgroundColor: theme.primaryColor,
                      color: theme.accentColor,
                      fontFamily: theme.fontText,
                    }}
                  >
                    See Demo →
                  </button>
                </section>

                {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "0.75rem",
                marginTop: "auto",
                paddingTop: "2rem",
                justifyContent:"space-evenly"
              }}
            >
              <button
                style={{ 
                  ...buttonStyle, 
                  opacity: isDirty ? 1 : 0.5,
                  cursor: isDirty ? "pointer" : "not-allowed",
                }}
                onClick={saveThemeToFirestore}
                disabled={!isDirty}
              >
                💾 Save 
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() => {
                  setTheme(normalizeTheme(defaultTheme));
                  setIsDirty(false);
                }}
              >
                🚫 Cancel 
              </button>
              <button
                style={{ ...buttonStyle, background: "rgb(255, 0, 0)" }}
                onClick={resetToDefault}
              >
                ⚠️ Reset 
              </button>
            </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}

/* ───────── UI Helpers ───────── */
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>  
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", fontWeight: "600" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FontSelect({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
      <label style={labelStyle}>{label}</label>
      <select
        style={{ ...inputStyle, width: "100%" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
       <option value="F25" style={{ fontFamily: "F25" }}>F25</option>
      <option value="Prole" style={{ fontFamily: "Prole" }}>Prole</option>
      <option value="Arial" style={{ fontFamily: "Arial" }}>Arial</option>
      <option value="Verdana" style={{ fontFamily: "Verdana" }}>Verdana</option>
      <option value="Helvetica" style={{ fontFamily: "Helvetica" }}>Helvetica</option>
      <option value="Georgia" style={{ fontFamily: "Georgia" }}>Georgia</option>
      <option value="Times New Roman" style={{ fontFamily: "Times New Roman" }}>Times New Roman</option>
      <option value="Courier New" style={{ fontFamily: "Courier New" }}>Courier New</option>
      <option value="Roboto" style={{ fontFamily: "Roboto" }}>Roboto</option>
      <option value="Montserrat" style={{ fontFamily: "Montserrat" }}>Montserrat</option>


      </select>
    </div>
  );
}

function renderColorBlock(color, label) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
      <div
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: color,
          border: "2px solid #333",
          borderRadius: "8px",
        }}
      />
      <span style={{ fontSize: "0.7rem", color: "#000000" }}>{label}</span>
    </div>
  );
}

const glassCardStyle = {
  display: "grid",
  background: "rgba(255, 255, 255, 0.24)",
  backdropFilter: "blur(16px)",
  borderRadius: "20px",
  padding: "2.5rem",
  marginBottom: "2rem",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  border: "1px solid rgba(0, 0, 0, 0.62)",
};

const inputStyle = {
  padding: "0.875rem 1rem",
  borderRadius: "10px",
  border: "2px solid #e9ecef",
  background: "#111",
  color: "#fff",
  fontSize: "0.95rem",
  transition: "all 0.2s",
  outline: "none",
};

const buttonStyle = {
  padding: "0.875rem 1.5rem",
  border: "none",
  borderRadius: "10px",
  background: " #baff66 0%",
  color: "var(--accent)",
  cursor: "pointer",
  fontSize: "auto",
  fontWeight: "600",
  transition: "all 0.3s",
  boxShadow: "0 4px 1px var(--accent)",
  textAlign: "center"
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#ff9f5a",

};

const smallButtonStyle = {
  padding: "0.625rem 1.25rem",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  background: "rgba(220, 53, 69, 0.95)",
  color: "#fff",
  fontSize: "0.875rem",
  fontWeight: "600",
  whiteSpace: "nowrap",
  transition: "all 0.2s",
  boxShadow: "0 2px 8px rgba(220, 53, 69, 0.2)",
};

const labelStyle = {
  fontSize: "0.9rem",
  marginBottom: "0.5rem",
  fontWeight: "600",
  color: "#ffffff",
};

const userRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.25rem 0",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  gap: "1.5rem",
  transition: "background 0.2s",
};

/* Preview Styles */
const previewWrapperStyle = {
  position: "sticky",
  top: "2rem",
  alignSelf: "flex-start",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1.5rem 2rem",
  gap: "1rem",
};

const signInButtonStyle = {
  border: "none",
  padding: "0.625rem 1.25rem",
  borderRadius: "10px",
  fontSize: "0.9rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
};

const bodyStyle = {
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "2.5rem",
  

};

const heroSectionStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: "1rem",
  padding: "1rem 0",

};

const heroSubtitleStyle = {
  fontSize: "1rem",
  lineHeight: "1.6",
  maxWidth: "360px",
};

const ctaButtonStyle = {
  marginTop: "0.75rem",
  padding: "0.875rem 2rem",
  borderRadius: "12px",
  border: "none",
  fontSize: "1rem",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.3s",
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
};

const productSectionStyle = {
  paddingTop: "0.5rem",
};

const carouselTrackStyle = {
  display: "flex",
  gap: "1.25rem",
  overflowX: "auto",
  paddingBottom: "1rem",
  scrollbarWidth: "thin",
};

const productCardStyle = {
  minWidth: "160px",
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(10px)",
  borderRadius: "16px",
  padding: "1.25rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.875rem",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  transition: "all 0.3s",
  border: "1px solid rgba(255,255,255,0.5)",
};

const productImageStyle = {
  width: "100px",
  height: "100px",
  backgroundColor: "rgba(0,0,0,0.03)",
  borderRadius: "12px",
  border: "3px solid",
};

const productInfoStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontSize: "0.9rem",
  gap: "0.375rem",
  width: "100%",
};

const addToCartButtonStyle = {
  marginTop: "0.5rem",
  padding: "0.625rem 1.25rem",
  fontSize: "0.85rem",
  borderRadius: "10px",
  border: "2px solid",
  background: "transparent",
  cursor: "pointer",
  fontWeight: "700",
  transition: "all 0.2s",
  width: "100%",
};

// Add responsive styles via style injection
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('setup-responsive-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = 'setup-responsive-styles';
  style.textContent = `
    @media (max-width: 1200px) {
      .theme-layout {
        grid-template-columns: 260px 1fr 420px !important;
        gap: 1.5rem !important;
        
      }
      
    }
    
    @media (max-width: 1024px) {
      .theme-layout {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
      }
    }
    
    @media (max-width: 768px) {
      .theme-layout {
        gap: 1.5rem !important;
      }
    }
    
    /* Hover effects */
    button:hover:not(:disabled) {
      transform:  translateY(1px);
      
    }
    
    button:active:not(:disabled) {
      transform: translateY(0);
    }

    
    /* Scrollbar styling */
    .preview-panel ::-webkit-scrollbar {
      height: 6px;
    }
    
    .preview-panel ::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.05);
      border-radius: 10px;
      
    }
    
    .preview-panel ::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 10px;
    }
    
    .preview-panel ::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.3);
    }
    
    /* Product card hover */
    .preview-panel .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    /* Input focus */
    input:focus, select:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    }
    
    /* User row hover */
    li:hover {
      background: rgba(0,0,0,0.02);
    }
  `;
  document.head.appendChild(style);
}