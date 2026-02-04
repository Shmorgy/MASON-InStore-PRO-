import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getProductImage } from "../utils/getProductImage";
import { db, storage } from "../firebase.js";
import { doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { triggerTextRipple } from "../hooks/useTextRipple.js";
import "../productStyles.css";
import { useCart } from "../context/CartContext.jsx";

export default function ProductCard({
  product,
  isExpanded,
  onExpand,
  onClose,
  isAdmin,
  ownOutsideClick = false,
  grid,
  onDeleteProduct,
  editFeaturedMode = false
}) {
  const modalRef = useRef(null);
  const firstImage = getProductImage(product);
 

  // Editable fields
  const [setfilters, setSetFilters] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(product.name || "");
  const [desc, setDesc] = useState(product.desc || "");
  const [price, setPrice] = useState(product.price || 0);
  const [images, setImages] = useState(product.imageUrls || []);
  const [currentImage, setCurrentImage] = useState(0);
  const [stock, setStock] = useState(product.stock ?? 0);
  const [featured, setFeatured] = useState(product.featured || false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tags, setTags] = useState(product.tags || []);
  const [collections, setCollections] = useState(product.collections || []);
  const [allTags, setAllTags] = useState([]);
  const [allColls, setAllColls] = useState([]);
  const [quantity, setQuantity] = useState(1);

   const { addToCart, cart } = useCart();
   const cartItem = cart.find((item) => item.id === product.id);
   const cartQuantity = cartItem ? cartItem.quantity : 0;
  // Sync local state with product updates
  useEffect(() => {
    setName(product.name || "");
    setDesc(product.desc || "");
    setPrice(product.price || 0);
    setImages(product.imageUrls || []);
    setStock(product.stock ?? 0);
    setFeatured(product.featured || false);
    setTags(product.tags || []);
    setCollections(product.collections || []);
    setCurrentImage(0);
    setQuantity(1);
  }, [product]);

  // Fetch all tags and collections when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const unsub = onSnapshot(doc(db, "storeData", "filters"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setAllTags(data.tags ?? []);
      setAllColls(data.collections ?? []);
    });
    return () => unsub();
  }, [isExpanded]);

  // Outside click closes modal
  useEffect(() => {
    if (!isExpanded || !ownOutsideClick) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, onClose, ownOutsideClick]);

  // Handle file uploads
  const handleFiles = async (files) => {
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

  // Save edits
  const saveChanges = async () => {
    if (!name.trim()) return alert("Name required");
    if (!images.length) return alert("At least one image required");

    await updateDoc(doc(db, "products", product.id), {
      name: name.trim(),
      desc: desc.trim(),
      price: parseFloat(price),
      stock: Math.max(0, parseInt(stock)),
      featured,
      imageUrls: images,
      tags,
      collections,
    });

    alert("Saved!");
    setEditMode(false);
  };

  // Delete product
  const deleteProduct = async () => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    setDeleting(true);
    try {
      for (const url of images) {
        if (!url) continue;
        try {
          const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
          await deleteObject(ref(storage, path));
        } catch (err) {
          console.warn("Failed to delete image:", url, err);
        }
      }
      await deleteDoc(doc(db, "products", product.id));
      onClose?.();
      onDeleteProduct?.(product.id);
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product. See console.");
    } finally {
      setDeleting(false);
    }
  };

  const prevImage = () =>
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);

  // Modal content
  const modalContent =
    isExpanded && (
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
            <div className="modal-main-image-wrapper">
              {images.length > 1 && (
                <button className="arrow left" onClick={prevImage}>
                  []
                </button>
              )}
              <img
                className="modal-main-image"
                src={images[currentImage] || firstImage}
                alt={name || product.name}
              />
              {images.length > 1 && (
                <button className="arrow right" onClick={nextImage}>
                  []
                </button>
              )}

              {images.length > 1 && (
                <div className="image-dots">
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${idx === currentImage ? "active" : ""}`}
                      onClick={() => setCurrentImage(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT PANEL */}
            <div className="modal-right">
              {editMode && isAdmin ? (
                <>
                  <input
                    className="modal-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                  />
                  <textarea
                    className="modal-description-box"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Description"
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
                        onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      />
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={() => setFeatured(!featured)}
                      />{" "}
                      Featured
                    </label>
                  </div>

                  <button
                    className="modal-btn"
                    style={{
                      width: "max-content",
                      background: "black",
                      color: "white",
                      maxHeight: "fit-content",
                    }}
                    onClick={() => setSetFilters((v) => !v)}
                  >
                    Set Filters
                  </button>

                  {setfilters && (
                    <div>
                      <label className="modal-filters">Tags</label>
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

                      <label className="modal-filters">Collections</label>
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

                  <div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    {uploading && <p>Uploading…</p>}
                  </div>

                  <div className="modal-buttons">
                    <button className="modal-btn primary" onClick={saveChanges}>
                      Save
                    </button>
                    <button
                      className="modal-btn secondary"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="modal-btn danger"
                      onClick={deleteProduct}
                      disabled={deleting}
                      style={{ backgroundColor: "#ff4d4f", color: "#fff" }}
                    >
                      {deleting ? "Deleting…" : "Delete Product"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="modal-name">{product.name}</h2>
                  <div className="modal-description-box">
                    <p className="modal-description">
                      {product.desc || "No description available"}
                    </p>
                  </div>

                  <div className="modal-info-label">
                    <div>Price: R{product.price}</div>
                    <div>Stock: {stock}</div>
                    {cartQuantity > 0 && <div>In Cart: {cartQuantity}</div>}
                  </div>

                  <div className="modal-buttons">
                    <button
                      className="modal-btn primary"
                      disabled={stock <= 0 || cartQuantity >= stock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (stock <= 0 || cartQuantity >= stock) return;
                        addToCart({ ...product, quantity });
                        triggerTextRipple(e);
                        
                      }}
                    >
                      {stock >= 0 ? "Add to Cart" : cartQuantity >= stock ? "max in cart":"Out of Stock"}
                    </button>
                    {isAdmin && (
                      <button
                        className="modal-btn secondary"
                        onClick={() => setEditMode(true)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );

  // Collapsed card
  return (
    <>
      {!isExpanded && (
        <div
          className={`product-card ${grid ? "grid-mode" : "list-mode"}`}
          onClick={() => onExpand?.(product)}
          style={{ position: "relative" }}
        >
          {editFeaturedMode && isAdmin && (
            <label
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(255,255,255,0.9)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
                zIndex: 10,
                cursor: "pointer",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={featured}
                onChange={async () => {
                  const f = !featured;
                  setFeatured(f);
                  await updateDoc(doc(db, "products", product.id), { featured: f });
                }}
              />
              Featured
            </label>
          )}

          <div className="product-card-image-wrapper">
            <img src={firstImage} alt={product.name} />
          </div>

          <div className="product-card-info">
            <div className="product-card-title">{product.name}</div>
            <p className="product-card-price">R{product.price}</p>
            <p className="product-card-description">
              {product.desc?.slice(0, 70)}
              {product.desc?.length > 70 ? "..." : ""}
            </p>

            {isAdmin && (
              <button
                className="modal-btn danger"
                disabled={deleting}
                style={{
                  bottom: "0",
                  backgroundColor: "#ff4d4f",
                  color: "#fff",
                  fontSize: 12,
                }}
                onClick={async (e) => {
                  e.stopPropagation();
                  await deleteProduct();
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      )}

      {isExpanded ? createPortal(modalContent, document.body) : null}
    </>
  );
}
