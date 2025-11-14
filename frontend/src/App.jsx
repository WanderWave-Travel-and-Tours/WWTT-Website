import { useState } from 'react'
import './App.css'
import FlightSearch from './components/flightSearch/flightSearch';
import PackageDeals from './components/packageDeals/packageDeals';

const Bookings = () => (
  <div className="page-container">
    <div className="page-content">
      <h1 className="page-title">My Bookings</h1>
      <p className="page-description">View and manage your flight bookings here</p>
    </div>
  </div>
)

const Profile = () => (
  <div className="page-container">
    <div className="page-content">
      <h1 className="page-title">Profile</h1>
      <p className="page-description">Manage your account settings and profile information</p>
    </div>
  </div>
)

const Help = () => (
  <div className="page-container">
    <div className="page-content">
      <h1 className="page-title">Help & Support</h1>
      <p className="page-description">Get help with your flights and bookings</p>
    </div>
  </div>
)

function App() {
  const [currentPage, setCurrentPage] = useState('flights')

  const pages = {
    flights: { name: 'Flight Search', component: FlightSearch },
    packages: { name: 'Package Deals', component: PackageDeals },
    bookings: { name: 'My Bookings', component: Bookings },
    profile: { name: 'Profile', component: Profile },
    help: { name: 'Help & Support', component: Help },
  }

  const CurrentComponent = pages[currentPage].component

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-content">
          {/* Logo/Brand */}
          <div className="brand">
            <div className="brand-logo">
              <span className="logo-icon">🌊</span>
            </div>
            <span className="brand-text">WANDERWAVE</span>
          </div>

          {/* Navigation Buttons */}
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

          {/* Right Side Actions */}
          <div className="nav-actions">
            <button className="book-now-btn">BOOK NOW</button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="main-content">
        <CurrentComponent />
      </main>
    </div>
  )
}

export default App