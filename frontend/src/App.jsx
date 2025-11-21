import { useState } from 'react';
import { Menu, X } from 'lucide-react'; 
import './App.css';
import FlightSearch from './components/flightSearch/flightSearch.jsx';
import PackageDeals from './components/packagedeals/packageDeals.jsx';
import Footer from './components/footer/footer.jsx';
import OtherServices from './components/otherservices/otherservices.jsx'; 

const Profile = () => (
  <div className="page-container">
    <div className="page-content">
      <h1 className="page-title">Profile</h1>
      <p className="page-description">Manage your account settings and profile information</p>
    </div>
  </div>
);

const Help = () => (
  <div className="page-container">
    <div className="page-content">
      <h1 className="page-title">Help & Support</h1>
      <p className="page-description">Get help with your flights and bookings</p>
    </div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState('packages'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoWhiteNav = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69083320f6799f841b19821b.png"; 
  const logoBlueHeader = "https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691413034dedcf3e7fbc3e80.png"; 

  const pages = {
    flights: { name: 'Flight Search', component: FlightSearch },
    packages: { name: 'Package Deals', component: PackageDeals },
    otherservices: { name: 'Other Services', component: OtherServices },
    profile: { name: 'Profile', component: Profile },
    help: { name: 'Help & Support', component: Help },
  };

  const CurrentComponent = pages[currentPage].component;

  const handleMobileLinkClick = (pageKey) => {
    setCurrentPage(pageKey);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="brand" onClick={() => handleMobileLinkClick('flights')}>
            <img 
              src={logoWhiteNav}
              alt="Wanderwave" 
              className="brand-logo brand-logo-desktop"
            />
            <img 
              src={logoWhiteNav} 
              alt="Wanderwave" 
              className="brand-logo brand-logo-mobile-nav"
            />
          </div>

          <div className="nav-links">
            {Object.entries(pages).map(([key, page]) => (
              <button
                key={key}
                onClick={() => setCurrentPage(key)}
                className={`nav-btn ${currentPage === key ? 'active' : ''}`}
              >
                {page.name}
              </button>
            ))}
          </div>
          <div className="nav-actions">
            <button className="book-now-btn">BOOK NOW</button>
          </div>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </nav>

      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <img 
            src={logoBlueHeader} 
            alt="Wanderwave Travel & Tours"
            className="brand-logo brand-logo-mobile"
          />
          <button 
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
        </div>
        
        <div className="mobile-nav-links">
          {Object.entries(pages).map(([key, page]) => (
            <button
              key={key}
              onClick={() => handleMobileLinkClick(key)}
              className={`nav-btn ${currentPage === key ? 'active' : ''}`}
            >
              {page.name}
            </button>
          ))}
        </div>
        
        <button className="book-now-btn">BOOK NOW</button>
      </div>

      <main className="main-content">
        <CurrentComponent />
      </main>
      <Footer />
    </div>
  );
}

export default App;