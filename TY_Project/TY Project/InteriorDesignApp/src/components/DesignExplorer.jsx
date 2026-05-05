import React, { useState } from "react";
import "./DesignExplorer.css";


const DesignExplorer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          searchTerm
        )}&per_page=12&client_id=LzdmuFYF4oKoQP78rTzuUHF1qAUJLViS7QrrRxU8G08`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError("Error fetching data. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="services-section">
      <h2>Discover Your Design Destiny</h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="search-bar"
          placeholder="Search e.g. living room decor"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {/* Error */}
      {error && <p className="error-text">{error}</p>}

      {/* Loading */}
      {loading && <p>Loading...</p>}

      {/*  Results */}
      <div className="results-grid">
        {results.length > 0 ? (
          results.map((item) => (
            <div key={item.id} className="image-card">
              <img
                src={item.urls.small}
                alt={item.alt_description || "Interior Image"}
              />
              <p>{item.alt_description || "Untitled"}</p>
            </div>
          ))
        ) : (
          !loading && <p className="no-results">No results yet. Try searching!</p>
        )}
      </div>
    </section>
  );
};

export default DesignExplorer;
