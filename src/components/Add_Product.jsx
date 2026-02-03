// src/components/Add_Product.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { db, storage } from "../firebase";
import { addDoc, collection, doc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../productStyles.css";

export default function AddProduct({ onClose, isAdmin }) {
  const modalRef = useRef(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [stock, setStock] = useState(0);
  const [tags, setTags] = useState([]);
  const [collections, setCollections] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allColls, setAllColls] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // ---------------- Outside click close ----------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // ---------------- File upload ----------------
  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const urls = [];
    for (const f of files) {
      const storageRef = ref(storage, `products/${Date.now()}-${f.name}`);
      const snap = await uploadBytes(storageRef, f);
      urls.push(await getDownloadURL(snap.ref));
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  // ---------------- Save new product ----------------
  const addProduct = async () => {
    if (!name.trim()) return alert("Product name required");
    if (!images.length) return alert("At least one image required");

    await addDoc(collection(db, "products"), {
      name: name.trim(),
      desc: desc.trim(),
      price: parseFloat(price) || 0,
      imageUrls: images,
      stock: Math.max(0, parseInt(stock, 10)),
      collections,
      tags,
      createdAt: new Date(),
      featured: false,
      new: true,
      salesCount: 0,
    });

    alert("Product added!");
    onClose?.();
  };

  // ---------------- Load filters ----------------
  useEffect(() => {
    if (!showFilters) return;
    const unsub = onSnapshot(doc(db, "storeData", "filters"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setAllTags(data.tags ?? []);
      setAllColls(data.collections ?? []);
    });
    return () => unsub();
  }, [showFilters]);

  const fileInputRef = useRef(null);

  // ---------------- Modal content ----------------
  const modalContent = (
    <div className="product-modal show">
      <div
        ref={modalRef}
        className="product-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="modal-grid-wrapper">
          {/* LEFT IMAGE */}
          <div className="modal-main-image">
            <img
              src={images[0] || "/placeholder.png"}
              alt={name || "Preview"}
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="modal-right">
            <input
              className="modal-name"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="modal-description-box"
              placeholder="Product Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />

            <div className="modal-info">
              <label>
                Price:
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <label>
                Stock:
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </label>

              {/* Custom Upload Button */}
            <div style={{ marginTop: "5vh", marginBottom:"-2.5vh" }}>
              <button
                className="modal-btn primary"
                style={{ background: "var(--FA-color)", color: "#000000", maxWidth: "fit-content", WebkitTextStroke:"0.5px var(--accent)" }}
                onClick={() => fileInputRef.current.click()}
              >
                Upload Images
              </button>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: "none",  }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              {uploading && <p>Uploading…</p>}
            </div>

             
              
            </div>

            {isAdmin && (
              <>
                <button
                  className="modal-btn"
                  style={{
                    width: "max-content",
                    background: "black",
                    color: "white",
                    maxHeight: "fit-content",
                  }}
                  onClick={() => setShowFilters((v) => !v)}
                >
                  Set Filters
                </button>
                {showFilters && (
                  <div className="modal-filters">
                    <label>Tags</label>
                    <ul className="modal-filters-text">
                      {allTags.map((tag) => (
                        <li key={tag}>
                          <label>
                            <input
                              type="checkbox"
                              checked={tags.includes(tag)}
                              onChange={() =>
                                setTags((prev) =>
                                  prev.includes(tag)
                                    ? prev.filter((t) => t !== tag)
                                    : [...prev, tag]
                                )
                              }
                            />
                            {tag}
                          </label>
                        </li>
                      ))}
                    </ul>

                    <label>Collections</label>
                    <ul className="modal-filters-text">
                      {allColls.map((coll) => (
                        <li key={coll}>
                          <label>
                            <input
                              type="checkbox"
                              checked={collections.includes(coll)}
                              onChange={() =>
                                setCollections((prev) =>
                                  prev.includes(coll)
                                    ? prev.filter((c) => c !== coll)
                                    : [...prev, coll]
                                )
                              }
                            />
                            {coll}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="modal-buttons">
              <button className="modal-btn primary" onClick={addProduct}>
                Add Product
              </button>
              <button className="modal-btn secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
