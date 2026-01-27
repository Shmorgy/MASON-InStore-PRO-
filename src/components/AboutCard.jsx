import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AboutCard({ title, text, image, onSave, onRemove }) {
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentText, setCurrentText] = useState(text);
  const [currentImage, setCurrentImage] = useState(image);

  const handleSave = () => {
    onSave?.({
      title: currentTitle,
      text: currentText,
      image: currentImage,
    });
    setEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="about-card"
    >
     

      {/* LEFT: TEXT */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, columnSpan:1 }}>
        {editing && isAdmin ? (
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            style={{
              fontSize: 20,
              fontWeight: "bold",
              padding: 8,
              borderRadius: 6,
              border: "2px dotted rgba(0,0,0,0.2)",
              background:"transparent",
              marginBottom: 8,
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        ) : (
          <h2 style={{ margin: 0 }}>{currentTitle}</h2>
        )}

        {editing ? (
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              resize: "vertical",
              padding: 12,
              fontSize: 14,
              borderRadius: 8,
              border: "2px dotted rgba(0,0,0,0.15)",
              background: "rgba(81, 81, 81, 0.0)",
              boxSizing: "border-box",
              fontFamily:"F25"
            }}
          />
        ) : (
          <p style={{ lineHeight: 1.6, margin: 0, wordBreak:"break-word" }}>{currentText}</p>
        )}

        {isAdmin && (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {editing ? (
              <>
                <button className="Admin_button" onClick={handleSave}>
                  Save
                </button>
                <button
                  className="Admin_button"
                  onClick={() => {
                    setCurrentTitle(title);
                    setCurrentText(text);
                    setCurrentImage(image);
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="Admin_button"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                <button
                  className="Admin_button"
                  style={{ background: "#ff4d4f" }}
                  onClick={onRemove}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: IMAGE */}
      <div
        className="about-card-image"
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={currentTitle}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span style={{ textAlign: "center", opacity: 0.4, fontSize: 14 }}>
            Image
            <div>- click to upload -</div>
          </span>
        )}

        {editing && isAdmin && (
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              border: "2px dotted rgba(0,0,0,0.15)",
              background: "rgba(0,0,0,0.0)"
            }}
          />
        )}
      </div>
    </div>
  );
}
