import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { doc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";

export default function EditFiltersModal({
  open,
  onClose
}) {
  const [newCollection, setNewCollection] = useState("");
  const [newTag, setNewTag] = useState("");
  const [localCollections, setLocalCollections] = useState([]);
  const [localTags, setLocalTags] = useState([]);

  useEffect(() => {
    if (!open) return;

    const unsub = onSnapshot(
      doc(db, "storeData", "filters"),
      snap => {
        if (snap.exists()) {
        const data = snap.data();
        setLocalCollections(data.collections || []);
        setLocalTags(data.tags || []);
      } else {
        // Initialize doc if it doesn't exist
        setDoc(doc(db, "storeData", "filters"), { collections: [], tags: [] });
      }},
      err => console.error("Firestore modal error:", err)
    );

    return () => unsub();
  }, [open]);

  if (!open) return null;

  const saveToFirestore = async (collections, tags) => {
    await updateDoc(doc(db, "storeData", "filters"), {
      collections,
      tags
    });
  };

  const addCollection = () => {
    const v = newCollection.trim();
    if (!v || localCollections.includes(v)) return;
    const updated = [...localCollections, v];
    setLocalCollections(updated);
    saveToFirestore(updated, localTags);
    setNewCollection("");
  };

  const deleteCollection = (col) => {
    const updated = localCollections.filter(c => c !== col);
    setLocalCollections(updated);
    saveToFirestore(updated, localTags);
  };

  const addTag = () => {
    const v = newTag.trim();
    if (!v || localTags.includes(v)) return;
    const updated = [...localTags, v];
    setLocalTags(updated);
    saveToFirestore(localCollections, updated);
    setNewTag("");
  };

  const deleteTag = (tag) => {
    const updated = localTags.filter(t => t !== tag);
    setLocalTags(updated);
    saveToFirestore(localCollections, updated);
  };

  const titleStyle = {
    color: "rgb(255, 255, 255)",
    fontSize: "0.85rem",
    marginBottom: "6px"
  };

  const panelStyle = {
    padding: "8px",
    border: "1px solid #444",
    borderRadius: "8px",
    background: "#222"
  };

  const scrollSectionStyle = {
    overflowY: "scroll",
    maxHeight: "60px",
    scrollbarColor: "transparent transparent",
    scrollBehavior: "smooth"
  };

  return (
    <section className="grid">
      <div className="edit-filter-panel" onClick={onClose}  style={{backgroundColor: "var(--top)",borderRadius: "5px",border: "2px solid var(--accent)"}}>
        <div onClick={e => e.stopPropagation()}>

          {/* Collections */}
          <div>
            <div style={titleStyle}>Edit Collections</div>
            {localCollections.length === 0 && (
              <p className="muted">No collections yet</p>
            )}

            <section style={scrollSectionStyle}>
              <div style={panelStyle}>
                {localCollections.map(c => (
                  <div
                    key={c}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                      color: "rgb(255, 255, 255)"
                    }}
                  >
                    <span>{c}</span>
                    <button
                      className="filter-panel-del"
                      onClick={() => deleteCollection(c)}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <input
                value={newCollection}
                onChange={e => setNewCollection(e.target.value)}
                placeholder="New collection"
              />
              <button className="filter-panel-add" onClick={addCollection}>
                Add
              </button>
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginTop: "16px" }}>
            <div style={titleStyle}>Edit Tags</div>
            {localTags.length === 0 && (
              <p className="muted">No tags yet</p>
            )}

            <section style={scrollSectionStyle}>
              <div style={panelStyle}>
                {localTags.map(t => (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                      color: "#fff"
                    }}
                  >
                    <span>{t}</span>
                    <button
                      className="filter-panel-del"
                      onClick={() => deleteTag(t)}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="New tag"
              />
              <button className="filter-panel-add" onClick={addTag}>
                Add
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "flex-end"
            }}
          >
            <button
              className="filter-panel-close"
              onClick={onClose}
              style={{ padding: "6px 12px", background:"var(--accent)" }}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
