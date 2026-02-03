import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "../carousel.css";

export default function Carousel({ featured = [], isAdmin = false }) {
  const [hovered, setHovered] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [magnetActive, setMagnetActive] = useState(false);

  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const modalRef = useRef(null);

  const posRef = useRef(0);
  const velocityRef = useRef(0.5);

  const maxVelocity = 0.5;
  const friction = 0.05;
  const magnetFriction = 0.03;

  /* ------------------------- Admin action ------------------------- */
  const removeFeatured = async (product) => {
    await updateDoc(doc(db, "products", product.id), { featured: false });
  };

  /* ------------------------- Scroll magnet ------------------------ */
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerY = window.innerHeight / 2;
      const distance = Math.abs(rect.top + rect.height / 2 - centerY);
      setMagnetActive(distance < rect.height / 2 + 50);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ----------------------- Carousel motion ------------------------ */
  useEffect(() => {
    let raf;
    const animate = () => {
      if (!trackRef.current) return;
      const currentFriction = magnetActive ? magnetFriction : friction;
      velocityRef.current = hovered
        ? Math.max(velocityRef.current - currentFriction, 0)
        : Math.min(velocityRef.current + currentFriction, maxVelocity);
      posRef.current -= velocityRef.current;
      const trackWidth = trackRef.current.scrollWidth / 2;
      if (Math.abs(posRef.current) >= trackWidth) posRef.current = 0;
      trackRef.current.style.transform = `translateX(${posRef.current}px)`;
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, [hovered, magnetActive]);

  /* ---------------------- Lock body scroll ------------------------ */
  useEffect(() => {
    document.body.style.overflow = selectedProduct ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  /* --------------------- Outside click modal --------------------- */
  useEffect(() => {
    if (!selectedProduct) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setSelectedProduct(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedProduct]);

  /* --------------------- Duplicate items -------------------------- */
  const repeatCount = featured.length < 3 ? 6 : 2;
  const displayItems = Array.from({ length: repeatCount }).flatMap(() => featured);

  /* ------------------------ Modal content ------------------------- */
  const modalContent = selectedProduct && (
    <div className="product-modal show">
      <div ref={modalRef} className="product-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>✕</button>

        <div className="modal-grid-wrapper">
          {/* LEFT IMAGE */}
          <img
            className="modal-main-image"
            src={selectedProduct.imageUrls?.[0] || selectedProduct.imageUrl || "/placeholder.png"}
            alt={selectedProduct.name}
          />

          {/* RIGHT PANEL */}
          <div className="modal-right">
            <h2 className="modal-name">{selectedProduct.name}</h2>

            <div className="modal-description-box">
              <p className="modal-description">
                {selectedProduct.desc || selectedProduct.description || "No description available."}
              </p>
            </div>

            {isAdmin && (
              <div className="modal-buttons">
                <button
                  className="modal-btn danger"
                  onClick={() => {
                    removeFeatured(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  Remove from Featured
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* --------------------- Carousel --------------------- */}
      <div
        ref={containerRef}
        className={`carousel-container ${magnetActive ? "magnet-active" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="carousel-track" ref={trackRef}>
          {displayItems.map((p, idx) => (
            <div key={`${p.id}-${idx}`} className="F-card" onClick={() => setSelectedProduct(p)}>
              <div className="product-name">{p.name}</div>
              <img src={p.imageUrls?.[0] || p.imageUrl || "/placeholder.png"} alt={p.name} />
              
            </div>
          ))}
        </div>
      </div>

      {/* --------------------- Modal (via portal) --------------------- */}
      {selectedProduct && createPortal(modalContent, document.body)}
    </>
  );
}
