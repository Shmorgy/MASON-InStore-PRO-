// ...existing code...
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreName} from "./VALUES";

function Setup(){

  const CHANGE = (event) => {
    setStoreName(event.target.value);
  };

  

  return (
    <>
     <h2>Setup Page</h2>
      <input 
        type="text" 
        placeholder={StoreName}
        onChange={CHANGE} 
        value={StoreName}
      />
      <div>Current: {StoreName  }</div>
    </>
  );
}
export default Setup;
// ...existing code...