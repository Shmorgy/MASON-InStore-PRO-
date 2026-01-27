import { Helmet } from "react-helmet-async";
import Home from "./Home.jsx";
import About from "./About.jsx";

function page () {
  return (
    <>
    <Helmet>
      <title>Hello there</title>
    </Helmet>

    
    <section className="paywall"> 
      <h1>Maxx Bassett</h1>
      <p>Bank : Capitec</p>
       <p>Account Name : MR M BASSETT</p>
       <p>Account Number : 2017370270</p>
    </section>

    <section className="paywall2"> 
      <h1>Maxx Bassett</h1>
      <p>Bank : Capitec</p>
       <p>Account Name : MR M BASSETT</p>
       <p>Account Number : 2017370270</p>
    </section>
    
    </> 
  )

};


export default page;