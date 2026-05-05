import React, { useState } from "react";

export default function DecorSearch({ onSelect, selectedDecor = [] }) {

  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {

    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/search-decor?q=${query}`
      );

      const data = await res.json();
      setResults(data.results || []);

    } catch (err) {
      setResults([]);
    }

    setLoading(false);
  };

  const isSelected = (id) =>
    selectedDecor.some(d => d.id === id);

  return (
    <div>

      <h3>Search Decor</h3>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search sofa, lamp..."
      />

      <button onClick={search}>
        {loading ? "Searching..." : "Search"}
      </button>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {results.map(item => (
          <div key={item.id}>
            <img src={item.image} width="120" />
            <p>{item.displayName}</p>

            <button
              onClick={() => onSelect(item)}
              disabled={isSelected(item.id)}
            >
              {isSelected(item.id) ? "Selected" : "Select"}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}