// ...existing code...
import { useState } from "react";
import { useNavigate } from "react-router-dom";


function ShopBar({grid, setGrid}){
  const navigate = useNavigate();
  const [open, setSwitch] = useState(true);
  const switchy = () => setSwitch(v => !v);
  const toggle = () => setGrid(v => !v);
  const go = (path) => () => {
    switchy();
    navigate(path);
  };
  

  return (
    <>
      {open ? (
        <section className="SHOPBAH">
          <button className="SB" onClick={switchy}>Filters</button>
          <button className="SB" onClick={toggle}>TOGGLE</button>
          <button className="NB" onClick={switchy}>Cart</button>
        </section>
      ) : (
        <>
        <section className="SHOPBAH">
          <button className="SB" onClick={switchy}>Filters</button>
          <button className="SB" onClick={toggle}>TOGGLE</button>
          <button className="NB" onClick={switchy}>Cart</button>
        
        
          <section className="FILTERBAH"> 
            <section className="product_grid">
              <section className="SB" onClick={go("/store")}>Collections</section>
              <section className="SB" onClick={go("/profile")}>Tags</section>
              <section className="SB" onClick={go("/contact")}>Price-Range</section>
            </section>
          </section>
        </section>
          
     
       
    
        </>
      )}
    </>
  );
}
export default ShopBar;
// ...existing code...