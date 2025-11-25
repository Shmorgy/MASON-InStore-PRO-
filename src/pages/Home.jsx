import { Helmet } from "react-helmet-async";
import Settings from "../components/Settings.jsx";  

function page () {

  return (
    <>
    <Helmet>
      <title>Home</title>
    </Helmet>
    
    <section className="HERO"> 
      <h1>Welcome to {Settings.SName}</h1>
      
    </section>
    <div className='gap' style={{height: '2.5dvh'}}></div>
    </> 
  )

};


export default page;