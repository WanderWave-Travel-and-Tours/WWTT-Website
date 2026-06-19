// src/components/TourPackages/tourPackages.jsx
import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AllTours from './allTours';
import TourBooking from './tourBooking';
import './tourPackages.css';
import { ToastProvider, useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import MascotGif from '../MascotGif/MascotGif';
import WanderLoader from '../loading/WanderLoader';

// ============================================================
// INNER COMPONENT — uses useToast hook (must be inside ToastProvider)
// ============================================================
function TourPackagesContent({ currentUser: propCurrentUser = null }) {
  const toast = useToast();
  const navigate = useNavigate();
  const toursRef = useRef(null);

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Currently selected tour for the booking view ────────────────
  const [selectedTour, setSelectedTour] = useState(null);

  const [scopeFilter, setScopeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [currency, setCurrency] = useState('PHP');
  const exchangeRate = 58;

  // ============================================================
  // READ CURRENT USER FROM PROP OR LOCALSTORAGE
  // Prop takes priority. If not passed (e.g. route doesn't forward
  // it), we scan common localStorage keys so the wishlist heart
  // button always knows who is logged in.
  // ============================================================
  const [currentUser, setCurrentUser] = useState(propCurrentUser);

  useEffect(() => {
    // Prop already has a valid user — use it directly.
    if (propCurrentUser?._id) {
      setCurrentUser(propCurrentUser);
      return;
    }

    // Scan every key the app might use to persist auth state.
    const keysToTry = [
      'user',
      'loggedInUser',
      'userData',
      'currentUser',
      'authUser',
      'wanderwave_user',
    ];

    for (const key of keysToTry) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        // A real user object must have at least _id or id
        if (parsed && (parsed._id || parsed.id)) {
          // Normalise: make sure _id is always present
          if (!parsed._id && parsed.id) parsed._id = parsed.id;
          setCurrentUser(parsed);
          return;
        }
      } catch (_) {
        // Skip corrupted/non-JSON entries
      }
    }
  }, [propCurrentUser]);

  // ================================================
  // RESTORE SPECIFIC TOUR AFTER FLIGHT SEARCH
  // ================================================
  useEffect(() => {
    const pendingTourId = sessionStorage.getItem('pendingTourBookingId');
    if (!pendingTourId || tours.length === 0) return;

    const matchingTour = tours.find(t =>
      String(t._id || t.id) === String(pendingTourId)
    );

    if (matchingTour) {
      setSelectedTour(matchingTour);
      sessionStorage.removeItem('pendingTourBookingId'); // clear na
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tours]); // important: kapag may data na ang tours

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
        setError('Unable to connect. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

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

    if (scopeFilter === 'local') {
      result = result.filter(t => t.category === 'Local');
    } else if (scopeFilter === 'international') {
      result = result.filter(t => t.category === 'International' || t.category === 'International Tour');
    } else if (scopeFilter === 'private') {
      result = result.filter(t => t.tourType === 'private');
    } else if (scopeFilter === 'joiners') {
      result = result.filter(t => t.tourType === 'joiners');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.duration?.toLowerCase().includes(q)
      );
    }

    const min = parseFloat(priceRange.min);
    const max = parseFloat(priceRange.max);
    if (!isNaN(min)) result = result.filter(t => (t.price || 0) >= min);
    if (!isNaN(max)) result = result.filter(t => (t.price || 0) <= max);

    if (selectedDuration) {
      result = result.filter(t => t.duration === selectedDuration);
    }

    if (selectedDestinations.length > 0) {
      result = result.filter(t => selectedDestinations.includes(t.destination));
    }

    return result;
  }, [tours, scopeFilter, searchQuery, priceRange, selectedDuration, selectedDestinations]);

  // ============================================================
  // BOOK NOW — open TourBooking view with the selected tour
  // ============================================================
  const handleBookNow = (tour) => {
    setSelectedTour(tour);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Go Back from booking — return to the tours listing ──────────
  const handleGoBack = () => {
    setSelectedTour(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openGHLChat = () => {
    if (typeof window.openGHLChat === 'function') {
      window.openGHLChat();
    }
  };



  // ============================================================
  // RENDER — Booking view takes over the whole page when active
  // ============================================================
  if (selectedTour) {
    return (
      <TourBooking
        pkg={selectedTour}
        onGoBack={handleGoBack}
        currency={currency}
        exchangeRate={exchangeRate}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="tour-packages-page">

      {/* ── Tours Full-Screen Loader Overlay ─────────────────────────── */}
      <WanderLoader loading={loading} text="LOADING TOUR PACKAGES" />

      {/* ── Hero section ────────────────────────────────────────────── */}
      <section className="tours-top-section-bg">
        <div className="tours-content-container">
          {error ? (
            <div className="tours-error-state">
              <h3>Oops! Something went wrong.</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          ) : loading ? null : (
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
              currentUser={currentUser}
            />
          )}
        </div>
      </section>

      {/* ── Scrolling location bar ───────────────────────────────────── */}
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
function TourPackages({ currentUser = null }) {
  return (
    <ToastProvider>
      <TourPackagesContent currentUser={currentUser} />
    </ToastProvider>
  );
}

export default TourPackages;