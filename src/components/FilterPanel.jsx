import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import "../styles.css";

export default function FilterPanel({
  selectedCollections = [],
  selectedTags = [],
  setCollections,
  setTags,
  priceRange = [0, 10000],
  setPriceRange,
  isAdmin = false,
  onEditFilters
}) {
  const [minPrice, setMinPrice] = useState(priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(priceRange[1]);

  const [availableCollections, setAvailableCollections] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      const docRef = doc(db, "storeData", "main");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setAvailableCollections(
          (data.collections || []).map(c =>
            typeof c === "string" ? { id: c, name: c } : c
          )
        );
        setAvailableTags(
          (data.tags || []).map(t =>
            typeof t === "string" ? { id: t, name: t } : t
          )
        );
      }
    };
    fetchFilters();
  }, []);

  // Toggle collection selection
  const toggleCollection = (id) => {
    setCollections(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Toggle tag selection
  const toggleTag = (id) => {
    setTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const applyPrice = () => {
    setPriceRange([Number(minPrice), Number(maxPrice)]);
  };

  const titleStyle = {
    color: "var(--FA-color)",
    fontSize: "0.85rem",
    marginBottom: "6px"
  };

  const panelStyle = {
    padding: "8px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#222"
  };

  return (
    <div className="filter-panel">

      {isAdmin && (
        <button onClick={onEditFilters} className="Admin_button">
          Edit Filters
        </button>
      )}

      {/* Collections */}
      <div>
        <div style={titleStyle}>Collections</div>
        <section
          style={{
            overflowY: "auto",
            maxHeight: "60px",
            scrollbarColor: "transparent transparent",
            scrollBehavior: "smooth"
          }}
        >
          <div style={panelStyle}>
            {availableCollections.map(col => (
              <label
                key={col.id}
                style={{ display: "block", color: "#fff", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(col.id)}
                  onChange={() => toggleCollection(col.id)}
                />{" "}
                {col.name}
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Tags */}
      <div style={{ marginTop: "12px" }}>
        <div style={titleStyle}>Tags</div>
        <section
          style={{
            overflowY: "auto",
            maxHeight: "60px",
            scrollbarColor: "transparent transparent",
            scrollBehavior: "smooth"
          }}
        >
          <div style={panelStyle}>
            {availableTags.map(tag => (
              <label
                key={tag.id}
                style={{ display: "block", color: "#fff", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />{" "}
                {tag.name}
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Price Range */}
      <div style={{ marginTop: "12px" }}>
        <div style={titleStyle}>Price Range</div>
        <div
          style={{
            ...panelStyle,
            display: "flex",
            gap: "8px",
            alignItems: "center",
            color:"white"
          }}
        >
          <input
            type="number"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            placeholder="Min"
            style={{ width: "80px", padding: "4px" }}
          />
          <span style={{ color: "#fff" }}>–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder="Max"
            style={{ width: "80px", padding: "4px" }}
          />
          <button
            onClick={applyPrice}
            style={{
              padding: "4px 10px",
              borderRadius: "12px",
              border: "1px solid #666",
              background: "#333",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
