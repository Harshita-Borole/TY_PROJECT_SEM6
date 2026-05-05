import { useState, useEffect } from 'react';
import './App.css';
import Frontpage from './components/Frontpage';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';

import Contact from './components/Contact';
import Portfolio from './components/Portfolio';
import Bookappointment from './components/Bookappointment';
import Footer from './components/Footer';
import PricingCalculator from './components/PricingCalculator';
import RoomAnalysis from './components/RoomAnalysis';
import DesignExplorer from './components/DesignExplorer';
import RepairsMaintenance from './components/RepairsMaintenance';


function App() {
  const location = useLocation();

  // Backend health check
  useEffect(() => {
    fetch(("http://localhost:5000/ping")
)
      .then(res => res.json())
      .then(data => console.log("Backend response:", data))
      .catch(err => console.error("Error fetching backend:", err));
  }, []);

  return (
    <div className="app-container">
      <header className={`top-section ${location.pathname === "/" ? "frontpage-active" : ""}`}>
        <Navbar />
        {location.pathname === "/" && <Frontpage />}
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/designexplorer" element={<DesignExplorer />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/bookappointment" element={<Bookappointment />} />
          <Route path="/pricing" element={<PricingCalculator />} />
          <Route path="/roomanalysis" element={<RoomAnalysis />} />
          <Route path="/repairs" element={<RepairsMaintenance />} />
    

        </Routes>
      </main>

      {location.pathname === "/" && <Footer />}
    </div>
  );
}

export default App;
