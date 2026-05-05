import React from "react";
import "./Frontpage.css";
import Navbar from "./Navbar";

const Frontpage = ({ onStart }) => {
  return (
    // This is the ONLY place the hero renders.
    // It contains its own Navbar so the home page works standalone.
    <div className="frontpage-container">
      <Navbar onSignIn={onStart} />
      <img
        src="./images/FrontPage.jpg"
        alt="Interior Design Background"
        className="frontpage-image"
      />
      <div className="frontpage-overlay">
        <h1>Interior Design Pro</h1>
        <p>Your dream space is just a click away.</p>
        <button className="dashboard-btn" onClick={onStart}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Frontpage;