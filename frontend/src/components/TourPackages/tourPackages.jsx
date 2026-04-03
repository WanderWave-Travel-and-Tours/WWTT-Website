// src/components/TourPackages/tourPackages.jsx
import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AllTours from './allTours';
import './tourPackages.css';
import { ToastProvider, useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import MascotGif from '../MascotGif/MascotGif';
import usePageTracker from '../../hooks/usePageTracker';

// ============================================================
// INNER COMPONENT — uses useToast hook (must be inside ToastProvider)
// ============================================================
function TourPackagesContent() {
  const toast = useToast();
  const navigate = useNavigate();
  const toursRef = useRef(null);

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scopeFilter, setScopeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [currency, setCurrency] = useState('PHP');
  const exchangeRate = 58;

  // ============================================================
  // FETCH TOURS
  // ============================================================
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://wanderwaveph.onrender.com/api/tours/all');
        const data = await response.json();

        if (data.status === 'ok' && data.data) {
          // Filter out archived tours
          const activeTours = data.data.filter(tour => tour.isArchive !== 'Yes');
          setTours(activeTours);
        } else {
          setError('Failed to load tours.');
        }
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError('Unable to connect. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  // ── Page View Tracker ────────────────────────────────────────────
  // Fires once on mount — permanent dedup per visitor IP.
  usePageTracker('tours', '/tours', 'Tour Packages Page');

  // ============================================================
  // DERIVED FILTER OPTIONS
  // ============================================================
  const allDurations = useMemo(() => {
    const durations = new Set();
    tours.forEach(t => { if (t.duration) durations.add(t.duration); });
    return Array.from(durations).sort();
  }, [tours]);

  const allDestinations = useMemo(() => {
    const destinations = new Set();
    tours.forEach(t => { if (t.destination) destinations.add(t.destination); });
    return Array.from(destinations).sort();
  }, [tours]);

  // ============================================================
  // FILTERED TOURS
  // ============================================================
  const filteredTours = useMemo(() => {
    let result = [...tours];

    // Scope filter
    if (scopeFilter === 'local') {
      result = result.filter(t => t.category === 'Local');
    } else if (scopeFilter === 'international') {
      result = result.filter(t => t.category === 'International' || t.category === 'International Tour');
    } else if (scopeFilter === 'private') {
      result = result.filter(t => t.tourType === 'private');
    } else if (scopeFilter === 'joiners') {
      result = result.filter(t => t.tourType === 'joiners');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.duration?.toLowerCase().includes(q)
      );
    }

    // Price range
    const min = parseFloat(priceRange.min);
    const max = parseFloat(priceRange.max);
    if (!isNaN(min)) result = result.filter(t => (t.price || 0) >= min);
    if (!isNaN(max)) result = result.filter(t => (t.price || 0) <= max);

    // Duration
    if (selectedDuration) {
      result = result.filter(t => t.duration === selectedDuration);
    }

    // Destinations (checkbox)
    if (selectedDestinations.length > 0) {
      result = result.filter(t => selectedDestinations.includes(t.destination));
    }

    return result;
  }, [tours, scopeFilter, searchQuery, priceRange, selectedDuration, selectedDestinations]);

  // ============================================================
  // BOOK NOW HANDLER — navigate to services page or open inquiry
  // ============================================================
  const handleBookNow = (tour) => {
    // Navigate to services/contact page with tour pre-selected
    // or you can open a booking modal here — adjust to your routing
    navigate('/services', { state: { selectedTour: tour } });
  };

  const openGHLChat = () => {
    if (typeof window.openGHLChat === 'function') {
      window.openGHLChat();
    }
  };

  return (
    <div className="tour-packages-page">

      {/* ── Hero section (matches top-section-bg style) ── */}
      <section className="tours-top-section-bg">
        <div className="tours-content-container">
          {loading ? (
            <div className="tours-loading-state">
              <div className="tours-loading-spinner"></div>
              <p>Loading tour packages...</p>
            </div>
          ) : error ? (
            <div className="tours-error-state">
              <h3>Oops! Something went wrong.</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          ) : (
            <AllTours
              tours={filteredTours}
              toursRef={toursRef}
              scopeFilter={scopeFilter}
              onScopeChange={setScopeFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              allDurations={allDurations}
              selectedDestinations={selectedDestinations}
              setSelectedDestinations={setSelectedDestinations}
              allDestinations={allDestinations}
              currency={currency}
              exchangeRate={exchangeRate}
              setCurrency={setCurrency}
              onBookNow={handleBookNow}
            />
          )}
        </div>
      </section>

      {/* ── Scrolling location bar (matches packageDeals divider) ── */}
      <div className="tours-section-divider">
        <div className="tours-divider-airplane-container">
          <img
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/696e04c1439b6b5ce06f5f51.webp"
            alt="Animated Airplane"
            className="tours-divider-airplane"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="tours-divider-bar">
          <div className="tours-divider-wrapper">
            <div className="tours-divider-group">
              <span className="tours-divider-label">TOUR DESTINATIONS IN THE PHILIPPINES:</span>
              <span>Siargao</span> • <span>Boracay</span> • <span>El Nido</span> •{' '}
              <span>Coron</span> • <span>Cebu</span> • <span>Bohol</span> •{' '}
              <span>Puerto Princesa</span> • <span>Ilocos</span> • <span>Sagada</span> •{' '}
              <span>Baguio</span> • <span>Siquijor</span> • <span>Batanes</span>
            </div>
            <div className="tours-divider-group" aria-hidden="true">
              <span className="tours-divider-label">INTERNATIONAL TOURS:</span>
              <span>Thailand</span> • <span>Vietnam</span> • <span>Singapore</span> •{' '}
              <span>Kuala Lumpur</span> • <span>Hong Kong</span> • <span>Macau</span> •{' '}
              <span>Bali, Indonesia</span> • <span>China</span>
            </div>
            <div className="tours-divider-group" aria-hidden="true">
              <span className="tours-divider-label">TOUR DESTINATIONS IN THE PHILIPPINES:</span>
              <span>Siargao</span> • <span>Boracay</span> • <span>El Nido</span> •{' '}
              <span>Coron</span> • <span>Cebu</span> • <span>Bohol</span> •{' '}
              <span>Puerto Princesa</span> • <span>Ilocos</span> • <span>Sagada</span> •{' '}
              <span>Baguio</span> • <span>Siquijor</span> • <span>Batanes</span>
            </div>
            <div className="tours-divider-group" aria-hidden="true">
              <span className="tours-divider-label">INTERNATIONAL TOURS:</span>
              <span>Thailand</span> • <span>Vietnam</span> • <span>Singapore</span> •{' '}
              <span>Kuala Lumpur</span> • <span>Hong Kong</span> • <span>Macau</span> •{' '}
              <span>Bali, Indonesia</span> • <span>China</span>
            </div>
          </div>
        </div>
      </div>

      <MascotGif onClick={openGHLChat} />
    </div>
  );
}

// ============================================================
// OUTER WRAPPER — provides Toast context
// ============================================================
function TourPackages() {
  return (
    <ToastProvider>
      <TourPackagesContent />
    </ToastProvider>
  );
}

export default TourPackages;