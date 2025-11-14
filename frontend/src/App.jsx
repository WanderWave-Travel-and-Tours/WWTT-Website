import { useState } from 'react'
import './App.css'
import FlightSearch from './components/flightSearch';

const Dashboard = () => (
  <div className="min-h-screen bg-blue-50 p-8">
    <h1 className="text-4xl font-bold text-blue-900">Dashboard</h1>
    <p className="mt-4 text-gray-700">Welcome to the dashboard page</p>
  </div>
)

const Bookings = () => (
  <div className="min-h-screen bg-green-50 p-8">
    <h1 className="text-4xl font-bold text-green-900">My Bookings</h1>
    <p className="mt-4 text-gray-700">View and manage your flight bookings here</p>
  </div>
)

const Profile = () => (
  <div className="min-h-screen bg-purple-50 p-8">
    <h1 className="text-4xl font-bold text-purple-900">Profile</h1>
    <p className="mt-4 text-gray-700">Manage your account settings and profile information</p>
  </div>
)

const Help = () => (
  <div className="min-h-screen bg-yellow-50 p-8">
    <h1 className="text-4xl font-bold text-yellow-900">Help & Support</h1>
    <p className="mt-4 text-gray-700">Get help with your flights and bookings</p>
  </div>
)

function App() {
  const [currentPage, setCurrentPage] = useState('flights')

  const pages = {
    flights: { name: 'Flight Search', component: FlightSearch },
    dashboard: { name: 'Dashboard', component: Dashboard },
    bookings: { name: 'My Bookings', component: Bookings },
    profile: { name: 'Profile', component: Profile },
    help: { name: 'Help & Support', component: Help },
  }

  const CurrentComponent = pages[currentPage].component

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="font-bold text-2xl text-blue-600">WWTT</div>

            {/* Navigation Buttons */}
            <div className="flex gap-2 flex-wrap justify-center">
              {Object.entries(pages).map(([key, page]) => (
                <button
                  key={key}
                  onClick={() => setCurrentPage(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === key
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {page.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="transition-all duration-300">
        <CurrentComponent />
      </main>
    </div>
  )
}

export default App
