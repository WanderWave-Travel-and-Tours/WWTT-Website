import React from 'react';
import './Footer.css';

function Footer() {
  // Logo galing sa navbar mo
  const logoUrl = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png";

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-grid">
          
          {/* Column 1: About */}
          <div className="footer-about">
            <img src={logoUrl} alt="Wanderwave Travel & Tours" className="footer-logo" />
            <p>
              Your trusted partner in creating unforgettable travel experiences across the Philippines and beyond.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-links">
            <h4>QUICK LINKS</h4>
            <ul>
              <li><a href="#">Flight Search</a></li>
              <li><a href="#">Package Deals</a></li>
              <li><a href="#">My Bookings</a></li>
              <li><a href="#">Profile</a></li>
              <li><a href="#">Help & Support</a></li>
            </ul>
          </div>

          {/* Column 3: Get in Touch */}
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
      
      {/* Bottom Copyright Bar */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} <span>Wanderwave Travel and Tours.</span> All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;