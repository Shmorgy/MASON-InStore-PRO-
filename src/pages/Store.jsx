import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, where, doc, getDoc, setDoc } from "firebase/firestore";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

import ProductCard from "../components/Product.jsx";
import AddProduct from "../components/Add_Product.jsx";
import ShopBar from "../components/ShopBar.jsx";
import EditFiltersModal from "../components/EditFiltersModal.jsx";
import Carousel from "../components/carousel.jsx";
import { db } from "../firebase.js";

export default function Store() {
  const rootRef = useRef(null);
  const { cart, addToCart } = useCart();
  const { isAdmin } = useAuth();

  const [grid, setGrid] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [topProduct, setTopProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null); // <-- ID instead of full object
  const [editFeaturedMode, setEditFeaturedMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editFiltersOpen, setEditFiltersOpen] = useState(false);

  // User-selected filters
  const [collections, setCollections] = useState([]);
  const [tags, setTags] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);

  // Firestore filters
  const [availableCollections, setAvailableCollections] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  const productsRef = collection(db, "products");
  const featuredQuery = query(productsRef, where("featured", "==", true));
  const topQuery = query(productsRef, orderBy("salesCount", "desc"));

  // Load Firestore filter options
  useEffect(() => {
    const loadFilters = async () => {
      const docRef = doc(db, "storeData", "main");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setAvailableCollections(data.collections || []);
        setAvailableTags(data.tags || []);
      }
    };
    loadFilters();
  }, []);

  // Listen to products, featured, topProduct
  useEffect(() => {
    const unsubProducts = onSnapshot(productsRef, snap => {
      const allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(allProducts);
      setFilteredProducts(applyFilters(allProducts));
    });

    const unsubFeatured = onSnapshot(featuredQuery, snap => {
      setFeatured(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTop = onSnapshot(topQuery, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTopProduct(docs[0] || null);
    });

    return () => {
      unsubProducts(); unsubFeatured(); unsubTop();
    };
  }, []);

  // Filter logic
  const applyFilters = (allProducts) => allProducts.filter(p => {
    if (collections.length && !collections.includes(p.collection)) return false;
    if (tags.length && !p.tags?.some(tag => tags.includes(tag))) return false;
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
    return true;
  });

  useEffect(() => {
    setFilteredProducts(applyFilters(products));
  }, [collections, tags, priceRange, products]);

  const handleAddToCart = (product) => addToCart(product);

  // Save updated collections/tags from EditFiltersModal
  const saveFilters = async (newCollections, newTags) => {
    setAvailableCollections(newCollections);
    setAvailableTags(newTags);
    await setDoc(doc(db, "storeData", "main"), {
      collections: newCollections,
      tags: newTags
    }, { merge: true });
  };

  return (
    <>
       {showAddProduct && (
          <AddProduct
            onClose={() => setShowAddProduct(false)}
            collectionOptions={availableCollections}
            tagOptions={availableTags}
          />
        )}
      <div className="page-container" ref={rootRef}>
        <Carousel featured={featured} isAdmin={isAdmin} />

        <h2 style={{textAlign:"center"}}>Store Favourite</h2>
          {topProduct && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              position: "relative",
              maxHeight:"60vh"
            }}> 
        <ProductCard
          key={topProduct.id}
          product={topProduct}
          isExpanded={expandedProductId === topProduct.id}
          onExpand={(p) => setExpandedProductId(p.id)}
          onClose={() => setExpandedProductId(null)}
          onAddToCart={handleAddToCart}
          isAdmin={isAdmin}
          ownOutsideClick={false}       // <-- prevent modal closing on outside click
          collectionOptions={availableCollections}
          tagOptions={availableTags}
          editFeaturedMode={editFeaturedMode}   
          grid={false}               
        />
        </div>
       
      )}



        {isAdmin && (
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
            <button  className="Admin_button" onClick={() => setShowAddProduct(prev => !prev)}>
              {showAddProduct ? "Close Add Product" : "Add Product"}
            </button>

            <button  className="Admin_button" onClick={() => setEditFeaturedMode(prev => !prev)}>
              {editFeaturedMode ? "Exit Featured Edit Mode" : "Edit Featured Products"}
            </button>

          </div>
        )}

       

        <EditFiltersModal
          open={editFiltersOpen}
          onClose={() => setEditFiltersOpen(false)}
          collections={availableCollections}
          setCollections={setAvailableCollections}
          tags={availableTags}
          setTags={setAvailableTags}
          saveFilters={saveFilters}
        />

        <h2 style={{ marginTop: 30, textAlign:"center" }}>Products</h2>
        <div style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              position: "relative",
              maxHeight:"60vh"
            }}> 
        {filteredProducts.length ? (
          <section className={grid ? "product_grid" : "product_list"}>
            {filteredProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                isExpanded={expandedProductId === p.id}
                onExpand={(p) => setExpandedProductId(p.id)}
                onClose={() => setExpandedProductId(null)}
                onAddToCart={handleAddToCart}
                isAdmin={isAdmin}
                ownOutsideClick
                collectionOptions={availableCollections}
                tagOptions={availableTags}
                editFeaturedMode={editFeaturedMode}
              />
            ))}

          </section>
        ) : <section className="center">No products match the filters</section>}
        </div>
        
      </div>
      <div style={{ height: "11vh" }}></div>
      <ShopBar
        grid={grid}
        setGrid={setGrid}
        cartCount={cart.length}
        collections={collections}
        setCollections={setCollections}
        tags={tags}
        setTags={setTags}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        filtersOpen={filtersOpen}
        toggleFilters={() => setFiltersOpen(prev => !prev)}
        isAdmin={isAdmin}
        availableCollections={availableCollections}
        availableTags={availableTags}
      />
    </>
  );
}
