import { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import PaymentForm from './components/Payment';
import AddProduct from './components/AddProduct';
import RoomInput from './components/RoomInput';
import Recommendation from './components/Recommendation';
import Dashboard from './components/Dashboard';

// ── Global back button ────────────────────────────────────────────────────────
const NO_BACK_ROUTES = ['/', '/dashboard'];
const BACK_LABELS = {
  '/room-input':      '← Room Planner',
  '/recommendation':  '← Recommendations',
  '/contact':         '← Contact',
  '/portfolio':       '← Portfolio',
  '/bookappointment': '← Book Appointment',
  '/pricing':         '← Pricing Calculator',
  '/roomanalysis':    '← AI Analysis',
  '/repairs':         '← Repairs',
  '/payment':         '← Payment',
  '/addproduct':      '← Add Product',
  '/designexplorer':  '← Design Explorer',
};

function GlobalBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (NO_BACK_ROUTES.includes(location.pathname)) return null;
  return (
    <button className="global-back-btn" onClick={() => navigate(-1)}>
      {BACK_LABELS[location.pathname] || '← Back'}
    </button>
  );
}

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    fetch("http://localhost:5000/ping")
      .then(res => res.json())
      .then(data => console.log("Backend response:", data))
      .catch(err => console.error("Error fetching backend:", err));
  }, []);

  return (
    <div className="app-container">

      {/*
        ── KEY FIX ──────────────────────────────────────────────────────────
        The Navbar is ALWAYS shown on inner pages (contact, portfolio etc.)
        BUT on the home page "/", Home.jsx controls everything including
        showing Frontpage — so we HIDE the navbar on home to avoid
        the navbar appearing twice (once here + once inside Frontpage via Home).
        
        Actually: show Navbar only on non-home routes.
        Home.jsx renders its own full-page experience (Frontpage → roles → dashboard)
        ─────────────────────────────────────────────────────────────────────
      */}
      {!isHome && (
        <header className="top-section">
          <Navbar />
        </header>
      )}

      {/* Back button on inner pages */}
      <GlobalBackButton />

      <main className="main-content">
        <Routes>
          {/*
            Home renders the full experience:
            Frontpage hero → Role Selection → Dashboard
            It manages its own Navbar via Frontpage.
          */}
          <Route path="/"               element={<Home />} />
          <Route path="/dashboard"      element={<Dashboard />} />
          <Route path="/contact"        element={<Contact />} />
          <Route path="/designexplorer" element={<DesignExplorer />} />
          <Route path="/portfolio"      element={<Portfolio />} />
          <Route path="/bookappointment"element={<Bookappointment />} />
          <Route path="/pricing"        element={<PricingCalculator />} />
          <Route path="/roomanalysis"   element={<RoomAnalysis />} />
          <Route path="/repairs"        element={<RepairsMaintenance />} />
          <Route path="/payment"        element={<PaymentForm />} />
          <Route path="/addproduct"     element={<AddProduct />} />
          <Route path="/room-input"     element={<RoomInput />} />
          <Route path="/recommendation" element={<Recommendation />} />
        </Routes>
      </main>

      {isHome && <Footer />}
    </div>
  );
}

export default App;