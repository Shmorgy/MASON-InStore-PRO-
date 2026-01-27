import { useRef, useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useStore } from "../context/StoreProvider.jsx";

function Layout() {
  const { isAdmin, user, logout } = useAuth();
  const { storeName } = useStore(); 
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const toggleMenu = () => setOpen((v) => !v);

  const go = (path) => () => {
    setOpen(true);
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/sign_in", { replace: true });
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section>
      
      <section className="TOPBAH">
        <button className="SB" onClick={go("/home")}>
          {storeName}
          
        </button>

        {!user ? (
          <button className="NB" onClick={go("/sign_in")}>
            Sign In / Up
          </button>
        ) : (
          <button className="NB" onClick={toggleMenu}>
            Navigate
          </button>
        )}
      </section>

      {!open && (
        <section ref={wrapperRef} className="FULLBAH">
          <section className="filter_grid">
            <button className="FB" onClick={go("/store")}>Store</button>
            {user && <button className="FB" onClick={go("/profile")}>Profile</button>}
            
            {user && <button className="FB" onClick={go("/orders")}>Orders</button>}
            {isAdmin && <button className="FB" onClick={go("/setup")}>Setup</button>}
            {user && <button className="FB" onClick={handleLogout}>Logout</button>}
          </section>
        </section>
      )}

      <main className = "page-offset" >
        <Outlet />
      </main>
    </section>
  );
}

export default Layout;
