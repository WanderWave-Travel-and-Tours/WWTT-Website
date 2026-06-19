import React from 'react';
import { Link } from 'react-router-dom'; // Import Link para sa internal navigation
import './footer.css';

function Footer() {
  const logoUrl = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png";

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-grid">
          
          {/* About Section */}
          <div className="footer-about">
            <img src={logoUrl} alt="Wanderwave Travel & Tours" className="footer-logo" width="260" height="130" />
            <p>
              Your trusted partner in creating unforgettable travel experiences across the Philippines and beyond.
            </p>
          </div>

          {/* Quick Links Section (UPDATED) */}
          <div className="footer-links">
            <h4>QUICK LINKS</h4>
            <ul>
              <li>
                <Link to="/flights">Flight Search</Link>
              </li>
              <li>
                <Link to="/packages">Package Deals</Link>
              </li>
              <li>
                <Link to="/other-services">Other Services</Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="footer-contact">
            <h4>GET IN TOUCH</h4>
            <ul>
              <li>
                <i className="fas fa-envelope"></i>
                <span>info@wanderwavetravelandtours.com</span>
              </li>
              <li>
                <i className="fas fa-phone"></i>
                <span>+63 966 820 0292</span>
              </li>
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <span>Nueva Ecija, Philippines</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
      
      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} <span>Wanderwave Travel and Tours.</span> All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;