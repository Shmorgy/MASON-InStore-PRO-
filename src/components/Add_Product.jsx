// src/components/Add_Product.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { db, storage } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../productStyles.css";

export default function AddProduct({
  onClose,
  collectionOptions = [],
  tagOptions = []
}) {
  const modalRef = useRef(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [stock, setStock] = useState(0);
  const [collections, setCollections] = useState([]);
  const [tags, setTags] = useState([]);

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

  // ---------------- Tag toggle helpers ----------------
  const toggleValue = (value, list, setList) => {
    setList((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  // ---------------- Modal content ----------------
  const modalContent = (
    <div className="product-modal show">
      <div ref={modalRef} className="product-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="modal-grid-wrapper">
          {/* LEFT IMAGE */}
          <img
            className="modal-main-image"
            src={images[0] || "/placeholder.png"}
            alt={name || "Preview"}
          />

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
              <label>Price:
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label>Stock:
                <input type="number" min="0" value={stock} onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))} />
              </label>
            </div>

            <div className="modal-info">Collections</div>
            <div className="tag-container">
              {collectionOptions.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`tag-btn ${collections.includes(c) ? "active" : ""}`}
                  onClick={() => toggleValue(c, collections, setCollections)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="modal-info">Tags</div>
            <div className="tag-container">
              {tagOptions.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`tag-btn ${tags.includes(t) ? "active" : ""}`}
                  onClick={() => toggleValue(t, tags, setTags)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div >
              <input className="modal-info" type="file" multiple onChange={(e) => handleFiles(e.target.files)} />
              {uploading && <p>Uploading…</p>}
            </div>

            

            <div className="modal-buttons">
              <button className="modal-btn primary" onClick={addProduct}>Add Product</button>
              <button className="modal-btn secondary" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------- Render as portal ----------------
  return createPortal(modalContent, document.body);
}
