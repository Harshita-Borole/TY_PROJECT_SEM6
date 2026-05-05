import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Load login data from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });

      // Save EXACT user object returned by backend
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setIsLoggedIn(true);
      setUser(response.user);

      setShowModal(false);
      setFormData({ email: '', password: '' });
      alert('Login successful!');
      
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    setIsLoggedIn(false);
    setUser(null);

    alert('Logged out successfully!');
  };

  return (
    <>
      <nav className="navbar">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/designexplorer">Design Explorer</Link></li>
          <li><Link to="/portfolio">Portfolio</Link></li>
          <li><Link to="/bookappointment">Book Appointment</Link></li>
          <li><Link to="/pricing">Pricing Calculator</Link></li>
          <li><Link to="/roomanalysis">AI Analysis</Link></li>
          <li><Link to="/repairs">Repairs</Link></li>
        </ul>

        <div className="signin-container">
          {!isLoggedIn ? (
            <button onClick={() => setShowModal(true)}>Sign In</button>
          ) : (
            <div className="user-info">
              <button className="signout-button" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {showModal && !isLoggedIn && (
        <div className="modal-overlay">
          <div className="modal-box">
            <form onSubmit={handleLogin}>
              {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

              <input
                type="email"
                name="email"
                placeholder="Email"
                className="modal-input"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                className="modal-input"
                value={formData.password}
                onChange={handleInputChange}
                required
              />

              <button type="submit" className="modal-button" disabled={loading}>
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </form>

            <button
              className="close-button"
              onClick={() => {
                setShowModal(false);
                setError('');
                setFormData({ email: '', password: '' });
              }}
            >
              X
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
