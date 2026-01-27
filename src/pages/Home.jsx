// src/components/Home.jsx
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import About from "./About";
import { useStore } from "../context/StoreProvider";

function Home() {
  const { storeName } = useStore(); // always from mainStore
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{String(storeName) || "unset"}</title>
      </Helmet>

      <main className="page-container">
        <section>
          <h1 className="tagline">welcome to</h1>
        </section>

        <h1 className="storename">{storeName}</h1>

        <div className="centered-button">
          <button onClick={() => navigate("/store")}>To Store</button>
        </div>


        <About />
      </main>

      {/*<div className="CONTACTBAH">
        <button className="LB">
          23 Blaauwberg Rd, Blouberstrand, Cape Town, 7441
        </button>
        <button className="LB">Follow on Instagram</button>
      </div>*/}

    </>
  );
}

export default Home;
