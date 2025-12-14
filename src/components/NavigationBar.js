import React from 'react';
import './NavigationBar.css';

function NavigationBar() {
  return (
    <nav className="navigation-bar">
      <div className="nav-content">
        <div className="nav-title">
          <h1>CHEMODERMA</h1>
        </div>
        <div className="nav-search">
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
          />
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;

