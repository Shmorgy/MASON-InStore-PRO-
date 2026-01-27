import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Smoothly scroll to the top
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]); // Runs whenever the route changes

  return null;
};

export default ScrollToTop;
