import { useEffect } from "react";
import { useStore } from "../context/StoreProvider";


export function FaviconAndTitle() {
  const { store, storeName } = useStore();
  const t = false
  useEffect(() => {
    if (!store) return;

    // Set page title
    document.title = storeName || "My Store";

    // Set favicon dynamically
    if (store.localLogoUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
     
      if (t){
        link.href = "src/images/DESIGN.png";
      } else {
         link.href = store.localLogoUrl;
      }
    }
  }, [store, storeName]);

  return null; // no visual output
}
