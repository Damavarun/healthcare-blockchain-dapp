import React, { useState, useEffect } from "react";
import heroImage from "../assets/hero.png";

function LoginPage({ connectWallet }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const scrollToAbout = () => {
    const section = document.getElementById("about-section");
    section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="hero-container">

        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀" : "🌙"}
        </button>

        {/* LEFT */}
        <div className="hero-left">
          <h1>
            Secure Blockchain <br />
            Healthcare Made <br />
            Simple & Transparent
          </h1>

          <p>
            Manage medical records securely using blockchain technology.
            Patient-controlled access. Verified doctors. Immutable data.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={connectWallet}>
              Connect Wallet
            </button>

            <button className="secondary-btn" onClick={scrollToAbout}>
              Learn More
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="hero-right">
          <img src={heroImage} alt="Healthcare Illustration" />
        </div>
      </div>

      {/* ABOUT SECTION */}
      <div id="about-section" className="about-section">
        <h2>Why Blockchain Healthcare?</h2>
        <p>
          Our decentralized healthcare system ensures patient-controlled
          access, verified medical professionals, and tamper-proof
          records stored securely on blockchain technology.
        </p>
      </div>
    </>
  );
}

export default LoginPage;
