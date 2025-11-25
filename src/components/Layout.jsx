// ...existing code...
import { useState } from "react";
import  {StoreName}  from "./VALUES.jsx"
import { useNavigate } from "react-router-dom";


function Layout(){
  const navigate = useNavigate();
  const [open, setSwitch] = useState(true);
  const switchy = () => setSwitch(v => !v);
  const go = (path) => () => {
    {open ? (null):(switchy())};
    navigate(path);
  };
  

  return (
    <>
      {open ? (
        <section className="TOPBAH">
          <button className="SB" onClick={go("/home")}>{StoreName}</button>
          <button className="NB" onClick={switchy}>sign in</button>
        </section>
      ) : (
        <>
        <section className="TOPBAH">
          <button className="SB" onClick={go("/home")}>{StoreName}</button>
          <button className="NB" onClick={switchy}>sign in</button>
        </section>
        <div className="centered"> 
          <section className="FULLBAH"> 
            <section className="product_grid">
              <button className="SB" onClick={go("/store")}>Store</button>
              <button className="SB" onClick={go("/profile")}>Profile</button>
              <button className="SB" onClick={go("/contact")}>Contact</button>
              <button className="SB" onClick={go("/settings")}>Settings</button>
              <button className="SB" onClick={go("/page")}>Pages</button>
              <button className="SB" onClick={go("/home")}>{StoreName}</button>
        
            </section>
          </section>
          
        </div>
       
    
        </>
      )}
    </>
  );
}
export default Layout;
// ...existing code...