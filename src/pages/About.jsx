import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useStore } from "../context/StoreProvider.jsx";
import AboutCard from "../components/AboutCard";
import { useAuth } from "../context/AuthContext.jsx";

export default function About() {
  const { storeName } = useStore();
  const { isAdmin } = useAuth();

  const [sections, setSections] = useState([
    {
      id: "about-1",
      title: "Why choose us?",
      text: "Tell people about your store!",
    },
  ]);

  const updateSection = (id, newText) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
    );
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: `about-${Date.now()}`,
        title: "New Section",
        text: "Add your content here...",
      },
    ]);
  };

  return (
    <>
      <Helmet>
        <title>{String(storeName) || "unset"}</title>
      </Helmet>

      <h1 className="auth-title">About Us</h1>

      <section
        className="card_grid"
        style={{
          gap: 20,
          justifyItems: "center",
          
        }}
      >
        {sections.map((section) => (
          <AboutCard
            key={section.id}
            title={section.title}
            text={section.text}
            onSave={(val) => updateSection(section.id, val)}
            onRemove={() =>
                      setSections(prev => prev.filter(s => s.id !== section.id))
                    }
          />
        ))}

        {isAdmin && (
          <button
            className="Admin_button"
            onClick={addSection}
            style={{
              marginTop: 10,
              width: 60,
              height: 60,
              fontSize: 28,
              borderRadius: "50%",
              alignSelf: "center",
              backgroundColor: "transparent",
              color:"var(--accent)",
              borderColor:"var(--accent)"
            }}
            aria-label="Add about section"
          >
            +
          </button>
        )}
      </section>

      
    </>
  );
}
