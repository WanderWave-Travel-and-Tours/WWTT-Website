import React from 'react';
import './Footer.css';

function Footer() {
  const logoUrl = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png";

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-about">
            <img src={logoUrl} alt="Wanderwave Travel & Tours" className="footer-logo" />
            <p>
              Your trusted partner in creating unforgettable travel experiences across the Philippines and beyond.
            </p>
          </div>

          <div className="footer-links">
            <h4>QUICK LINKS</h4>
            <ul>
              <li><a href="#">Flight Search</a></li>
              <li><a href="#">Package Deals</a></li>
              <li><a href="#">My Bookings</a></li>
            </ul>
          </div>

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
      
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} <span>Wanderwave Travel and Tours.</span> All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;