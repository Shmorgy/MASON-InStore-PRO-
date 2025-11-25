// ...existing code...
import { Helmet } from "react-helmet-async";
import React, { useState, useEffect, useRef } from "react";
import ShopBar from "../components/ShopBar.jsx";

export default function Page() {
  const rootRef = useRef(null);
  const [grid, setGrid] = useState(false);

  useEffect(() => {
    const dur = 10;
    const root = rootRef.current;
    if (!root) return;

    // set per-group CSS animation duration for .group
    const groups = Array.from(root.querySelectorAll(".group"));
    groups.forEach((g) => {
      const d = g.children.length || 1;
      const T = dur * (d * 0.5);
      g.style.setProperty("--anim_dur", `${T}s`);
    });

    // auto-advance new_group: scroll to next card every 5s
    const nugroups = Array.from(root.querySelectorAll(".new_group"));
    const intervals = [];
    const resizeHandlers = [];

    nugroups.forEach((g) => {
      const items = Array.from(g.querySelectorAll(".card"));
      if (!items.length) return;

      const style = getComputedStyle(g);
      const gap = parseFloat(style.gap) || parseFloat(style.columnGap) || 16;

      // compute item width (including gap)
      let itemWidth = Math.round(items[0].getBoundingClientRect().width + gap);
      let index = 0;
      const count = items.length;

      // ensure start position
      g.scrollLeft = 0;

      const advance = () => {
        index = (index + 1) % count;
        g.scrollTo({ left: index * itemWidth, behavior: "smooth" });
      };

      const id = setInterval(advance, 5000);
      intervals.push(id);

      // recompute itemWidth on resize
      const onResize = () => {
        const first = g.querySelector(".card");
        if (first) {
          const rect = first.getBoundingClientRect();
          itemWidth = Math.round(rect.width + gap);
        }
      };
      window.addEventListener("resize", onResize);
      resizeHandlers.push(onResize);
    });

    return () => {
      intervals.forEach((id) => clearInterval(id));
      resizeHandlers.forEach((h) => window.removeEventListener("resize", h));
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Store</title>
      </Helmet>

      <div ref={rootRef}>
        <div>Featured</div>

        <div className="carousel">
          <div className="group">
            <div className="F-card">Item 1</div>
            <div className="F-card">Item 2</div>
            <div className="F-card">Item 3</div>
            <div className="F-card">Item 4</div>
            <div className="F-card">Item 5</div>
          </div>
          <div aria-hidden className="group">
            <div className="F-card">Item 1</div>
            <div className="F-card">Item 2</div>
            <div className="F-card">Item 3</div>
            <div className="F-card">Item 4</div>
            <div className="F-card">Item 5</div>
          </div>
        </div>

        <div>New Collection</div>

        <section className="B_group">
            <div className="B-card">Item 1</div>
            
        </section>
          
        

        <div>Products</div>

        {grid ? (
          <section>
            <section className="product_grid">
              <div className="card">Item 1</div>
              <div className="card">Item 2</div>
              <div className="card">Item 3</div>
              <div className="card">Item 4</div>
              <div className="card">Item 5</div>
              <div className="card">Item 6</div>
              <div className="card">Item 1</div>
              <div className="card">Item 2</div>
              <div className="card">Item 3</div>
              <div className="card">Item 4</div>
              <div className="card">Item 5</div>
              <div className="card">Item 6</div>
            </section>
          </section>
        ) : (
          <section className="product_list">
            <div className="card">Item 1</div>
            <div className="card">Item 2</div>
            <div className="card">Item 3</div>
            <div className="card">Item 4</div>
            <div className="card">Item 5</div>
            <div className="card">Item 6</div>
            <div className="card">Item 1</div>
            <div className="card">Item 2</div>
            <div className="card">Item 3</div>
            <div className="card">Item 4</div>
            <div className="card">Item 5</div>
            <div className="card">Item 6</div>
          </section>
        )}
        <div className="gap">gap</div>

        <ShopBar grid={grid} setGrid={setGrid} />
      </div>
    </>
  );
}
// ...existing code...