import { useEffect } from "react";

export default function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    }

    if (active) document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler, active]);
}
