// src/components/Transfers/transferPackages.jsx
import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AllTransfers from './allTransfers';
import TransferBooking from './TransferBooking';
import './transferPackages.css';
import { ToastProvider, useToast } from '../toast/ToastManager';
import MascotGif from '../MascotGif/MascotGif';
import { usePageTracker } from '../../hooks/usePageTracker';
import { useGHLTrigger } from '../../hooks/useGHLTrigger';

// ============================================================
// INNER COMPONENT — uses useToast hook (must be inside ToastProvider)
// ============================================================
function TransferPackagesContent() {
  const toast = useToast();
  const navigate = useNavigate();
  const transfersRef = useRef(null);

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [currency, setCurrency] = useState('PHP');
  const exchangeRate = 58;

  // ── Currently selected transfer for the booking view ────────────────────
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // ============================================================
  // FETCH TRANSFERS FROM /api/transfers
  // ============================================================
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        // Fetch all active transfers from the transfers collection
        const response = await fetch('https://wanderwaveph.onrender.com/api/transfers');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setTransfers(data.data);
        } else {
          setError('Failed to load transfer listings.');
        }
      } catch (err) {
        console.error('Error fetching transfers:', err);
        setError('Unable to connect. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  // ── Page View Tracker ────────────────────────────────────────────
  usePageTracker({ page: 'transfers', path: '/transfers', label: 'Tourist Transfers Page' });

  // ── GHL session guard — computed once per session mount ──────────
  const [ghlEnabled] = useState(() => !sessionStorage.getItem('ww_exit_shown'));

  // ── GHL Trigger — fires after 1 minute OR on exit intent ────────
  useGHLTrigger({
    enabled: ghlEnabled,
    delayMinutes: 1,
    triggerOnExit: true
  });

  // ── Stamp sessionStorage the moment the GHL form would appear ───
  useEffect(() => {
    if (!ghlEnabled) return;

    const markShown = () => sessionStorage.setItem('ww_exit_shown', 'true');

    const timer = setTimeout(markShown, 60 * 1000);

    const handleExitIntent = (e) => {
      if (e.clientY <= 0) markShown();
    };
    document.addEventListener('mouseleave', handleExitIntent);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleExitIntent);
    };
  }, [ghlEnabled]);

  // ============================================================
  // DERIVED FILTER OPTIONS — use packageDestination field
  // ============================================================
  const allDestinations = useMemo(() => {
    const destinations = new Set();
    transfers.forEach(t => { if (t.packageDestination) destinations.add(t.packageDestination); });
    return Array.from(destinations).sort();
  }, [transfers]);

  // ============================================================
  // FILTERED TRANSFERS
  // ============================================================
  const filteredTransfers = useMemo(() => {
    let result = [...transfers];

    // Search query — match on title, packageDestination, category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.packageDestination?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }

    // Price range — filter against oneWayPrice (starting price)
    const min = parseFloat(priceRange.min);
    const max = parseFloat(priceRange.max);
    if (!isNaN(min)) result = result.filter(t => (t.oneWayPrice || 0) >= min);
    if (!isNaN(max)) result = result.filter(t => (t.oneWayPrice || 0) <= max);

    // Destination checkboxes
    if (selectedDestinations.length > 0) {
      result = result.filter(t => selectedDestinations.includes(t.packageDestination));
    }

    return result;
  }, [transfers, searchQuery, priceRange, selectedDestinations]);

  // ============================================================
  // INQUIRE HANDLER — open TransferBooking view with selected transfer
  // ============================================================
  const handleInquire = (transfer) => {
    setSelectedTransfer(transfer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Go Back from booking — return to the transfers listing ──────────────
  const handleGoBack = () => {
    setSelectedTransfer(null);
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
  if (selectedTransfer) {
    return (
      <TransferBooking
        transfer={selectedTransfer}
        onGoBack={handleGoBack}
        currency={currency}
        exchangeRate={exchangeRate}
        currentUser={null}
      />
    );
  }

  return (
    <div className="transfer-packages-page">

      {/* ── Hero section (mirrors tours-top-section-bg) ── */}
      <section className="transfers-top-section-bg">
        <div className="transfers-content-container">
          {loading ? (
            <div className="transfers-loading-state">
              <div className="transfers-loading-spinner"></div>
              <p>Loading transfer packages...</p>
            </div>
          ) : error ? (
            <div className="transfers-error-state">
              <h3>Oops! Something went wrong.</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          ) : (
            <AllTransfers
              transfers={filteredTransfers}
              transfersRef={transfersRef}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedDestinations={selectedDestinations}
              setSelectedDestinations={setSelectedDestinations}
              allDestinations={allDestinations}
              currency={currency}
              exchangeRate={exchangeRate}
              setCurrency={setCurrency}
              onInquire={handleInquire}
            />
          )}
        </div>
      </section>

      {/* ── Scrolling location bar (mirrors tourPackages divider) ── */}
      <div className="transfers-section-divider">
        <div className="transfers-divider-airplane-container">
          <img
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/696e04c1439b6b5ce06f5f51.webp"
            alt="Animated Transfer Vehicle"
            className="transfers-divider-airplane"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="transfers-divider-bar">
          <div className="transfers-divider-wrapper">
            <div className="transfers-divider-group">
              <span className="transfers-divider-label">TRANSFER DESTINATIONS:</span>
              <span>Siargao</span> • <span>Boracay</span> • <span>El Nido</span> •{' '}
              <span>Coron</span> • <span>Cebu</span> • <span>Bohol</span> •{' '}
              <span>Puerto Princesa</span> • <span>Ilocos</span> • <span>Sagada</span> •{' '}
              <span>Baguio</span> • <span>Siquijor</span> • <span>Batanes</span>
            </div>
            <div className="transfers-divider-group" aria-hidden="true">
              <span className="transfers-divider-label">INTERNATIONAL TRANSFERS:</span>
              <span>Thailand</span> • <span>Vietnam</span> • <span>Singapore</span> •{' '}
              <span>Kuala Lumpur</span> • <span>Hong Kong</span> • <span>Macau</span> •{' '}
              <span>Bali, Indonesia</span> • <span>China</span>
            </div>
            <div className="transfers-divider-group" aria-hidden="true">
              <span className="transfers-divider-label">TRANSFER DESTINATIONS:</span>
              <span>Siargao</span> • <span>Boracay</span> • <span>El Nido</span> •{' '}
              <span>Coron</span> • <span>Cebu</span> • <span>Bohol</span> •{' '}
              <span>Puerto Princesa</span> • <span>Ilocos</span> • <span>Sagada</span> •{' '}
              <span>Baguio</span> • <span>Siquijor</span> • <span>Batanes</span>
            </div>
            <div className="transfers-divider-group" aria-hidden="true">
              <span className="transfers-divider-label">INTERNATIONAL TRANSFERS:</span>
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
function TransferPackages() {
  return (
    <ToastProvider>
      <TransferPackagesContent />
    </ToastProvider>
  );
}

export default TransferPackages;