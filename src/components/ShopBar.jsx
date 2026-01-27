import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../icons.css";
import "../filterpanel.css";
import FilterPanel from "./FilterPanel.jsx";
import EditFiltersModal from "../components/EditFiltersModal.jsx";

export default function ShopBar({
  grid, setGrid,
  cartCount,
  collections, setCollections,
  tags, setTags,
  priceRange, setPriceRange,
  filtersOpen, toggleFilters,
  isAdmin = false
}) {
  const [editFiltersOpen, setEditFiltersOpen] = useState(false);
  const navigate = useNavigate();

  const go = (path) => () => navigate(path);

  const iconTileStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.0)", // transparent clickable tile
    cursor: "pointer",
    margin: "0 4px",
    transition: "background 0.2s",
  };

  const iconTileHover = {
    background: "rgba(255,255,255,0.0)"
  };

  return (
    <>
      {/* Filter Panel */}
      {filtersOpen && (
        <FilterPanel
          selectedCollections={collections}
          setCollections={setCollections}
          selectedTags={tags}
          setTags={setTags}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          isAdmin={isAdmin}
          onEditFilters={() => setEditFiltersOpen(true)}
        />
      )}

      {/* ShopBar Controls */}
      <section className="SHOPBAH" style={{ display: "flex", gap: "8px", padding: "8px",justifyContent:"space-evenly" }}>

        {/* Filter Toggle */}
        <div
          style={iconTileStyle}
          onClick={toggleFilters}
          onMouseEnter={e => e.currentTarget.style.background = iconTileHover.background}
          onMouseLeave={e => e.currentTarget.style.background = iconTileStyle.background}
        >
          <div className={`filter-icon ${filtersOpen ? "open" : ""}`}>
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        {/* Grid/List Toggle */}
        <div
          style={iconTileStyle}
          onClick={() => setGrid(v => !v)}
          onMouseEnter={e => e.currentTarget.style.background = iconTileHover.background}
          onMouseLeave={e => e.currentTarget.style.background = iconTileStyle.background}
        >
          <div className={`grid-icon ${grid ? "grid" : "list"}`}>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
          </div>
        </div>

        {/* Cart Button */}
        <div
          style={iconTileStyle}
          onClick={go("/cart")}
          onMouseEnter={e => e.currentTarget.style.background = iconTileHover.background}
          onMouseLeave={e => e.currentTarget.style.background = iconTileStyle.background}
        >
          <div className="cart-icon">
            <div className="cart-body"></div>
            <div className="cart-handle"></div>
            <div className="wheel left-wheel"></div>
            <div className="wheel right-wheel"></div>
          </div>
          {cartCount > 0 && <span className="cart-bubble">{cartCount}</span>}
        </div>

      </section>

      {/* Admin Edit Filters Modal */}
      {isAdmin && editFiltersOpen && (
        <EditFiltersModal
          open={editFiltersOpen}
          onClose={() => setEditFiltersOpen(false)}
          collections={collections}
          setCollections={setCollections}
          tags={tags}
          setTags={setTags}
        />
      )}
    </>
  );
}
