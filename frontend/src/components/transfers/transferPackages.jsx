// src/components/Transfers/transferPackages.jsx
import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AllTransfers from './allTransfers';
import TransferBooking from './TransferBooking';
import './transferPackages.css';
import { ToastProvider, useToast } from '../toast/ToastManager';
import MascotGif from '../MascotGif/MascotGif';
import { usePageTracker } from '../../hooks/usePageTracker';
import WanderLoader from '../loading/WanderLoader';

// ============================================================
// INNER COMPONENT — uses useToast hook (must be inside ToastProvider)
// ============================================================
function TransferPackagesContent({ currentUser: currentUserProp }) {
  const toast = useToast();
  const navigate = useNavigate();
  const transfersRef = useRef(null);

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [currency, setCurrency] = useState('PHP');
  const exchangeRate = 58;

  // ── Currently selected transfer for the booking view ────────────────────
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // ── Wishlist / Favorites state ───────────────────────────────────────────
  const [userFavorites, setUserFavorites] = useState([]);

  // ============================================================
  // READ currentUser FROM localStorage (same pattern as packageDeals.jsx)
  // Falls back to the passed prop if localStorage is empty.
  // ============================================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(currentUserProp || null);

  useEffect(() => {
    const checkLoginStatus = () => {
      const userJSON = localStorage.getItem('wanderwave_user');
      const isUserLoggedIn = !!userJSON;

      console.log('👤 [Transfers] Checking login status:', isUserLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN');

      if (userJSON) {
        try {
          const user = JSON.parse(userJSON);
          console.log('✅ [Transfers] User data:', { id: user._id, name: user.fullName, email: user.email });
          setCurrentUser(user);
          setIsLoggedIn(true);
        } catch (err) {
          console.error('❌ [Transfers] Error parsing user data:', err);
          localStorage.removeItem('wanderwave_user');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        // No localStorage entry — use the prop if provided, otherwise null
        if (currentUserProp) {
          setCurrentUser(currentUserProp);
          setIsLoggedIn(true);
        } else {
          console.log('❌ [Transfers] No user data in localStorage');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      }
    };

    checkLoginStatus();

    // Keep in sync if user logs in/out in another tab
    const handleStorageChange = () => {
      console.log('📦 [Transfers] Storage changed — rechecking login status');
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUserProp]);

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

  // ── Reveal content only after WanderLoader finishes fading out ──────────
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setContentVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // ============================================================
  // FETCH FAVORITES FOR CURRENT USER
  // ============================================================
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn || !currentUser) {
        setUserFavorites([]);
        return;
      }

      try {
        const token = localStorage.getItem('wanderwave_token');
        if (!token) { setUserFavorites([]); return; }

        const response = await fetch('https://wanderwaveph.onrender.com/api/favorites', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Failed to fetch favorites');

        const result = await response.json();
        if (result.status === 'ok' && result.data) {
          const favoriteIds = result.data.map(fav => fav.promo_id);
          console.log('❤️ Transfer favorite IDs:', favoriteIds);
          setUserFavorites(favoriteIds);
        }
      } catch (err) {
        console.error('❌ Error fetching transfer favorites:', err);
      }
    };

    fetchFavorites();
  }, [isLoggedIn, currentUser]);

  // ── Listen for wishlist changes (e.g. removed from WishlistDropdown) ────
  useEffect(() => {
    const handleFavoriteRemoved = (e) => {
      const { packageId } = e.detail || {};
      if (packageId) {
        setUserFavorites(prev => prev.filter(id => id !== packageId));
      }
    };

    const handleWishlistUpdated = () => {
      if (!currentUser) return;
      const token = localStorage.getItem('wanderwave_token');
      if (!token) return;
      fetch('https://wanderwaveph.onrender.com/api/favorites', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
        .then(r => r.json())
        .then(result => {
          if (result.status === 'ok' && result.data) {
            setUserFavorites(result.data.map(fav => fav.promo_id));
          }
        })
        .catch(() => {});
    };

    window.addEventListener('favoriteRemoved', handleFavoriteRemoved);
    window.addEventListener('wishlistUpdated', handleWishlistUpdated);

    return () => {
      window.removeEventListener('favoriteRemoved', handleFavoriteRemoved);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdated);
    };
  }, [currentUser]);

  // ── Page View Tracker ────────────────────────────────────────────
  usePageTracker({ page: 'transfers', path: '/transfers', label: 'Tourist Transfers Page' });

  // ============================================================
  // TOGGLE FAVORITE FOR A TRANSFER
  // ============================================================
  const handleFavoriteToggle = async (transfer) => {
    if (!isLoggedIn || !currentUser) {
      toast.warning('Please log in to save transfers to your wishlist.', 'Login Required', 3000);
      return;
    }

    const transferId = transfer._id;
    const isCurrentlyFavorite = userFavorites.includes(transferId);

    // Optimistic update
    const previousState = [...userFavorites];
    if (isCurrentlyFavorite) {
      setUserFavorites(prev => prev.filter(id => id !== transferId));
    } else {
      setUserFavorites(prev => [...prev, transferId]);
    }

    try {
      const token = localStorage.getItem('wanderwave_token');
      const response = await fetch('https://wanderwaveph.onrender.com/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          promo_id: transferId,
          package_name: transfer.title,
          package_location: transfer.packageDestination,
          itemType: 'transfer',
        }),
      });

      if (!response.ok) throw new Error('Failed to update wishlist');

      const result = await response.json();
      console.log('✅ Wishlist toggle result:', result);

      // Sync with server response if available
      if (result.data && result.data.favorites) {
        setUserFavorites(result.data.favorites);
      }

      const message = isCurrentlyFavorite
        ? 'Transfer removed from wishlist'
        : 'Transfer added to wishlist! ❤️';
      toast.success(message, '', 2500);

      // Dispatch events so navbar wishlist count updates
      window.dispatchEvent(new Event('wishlistUpdated'));

      if (isCurrentlyFavorite) {
        window.dispatchEvent(new CustomEvent('favoriteRemoved', {
          detail: { packageId: transferId }
        }));
      }
    } catch (err) {
      console.error('❌ Error toggling transfer favorite:', err);
      // Revert optimistic update on error
      setUserFavorites(previousState);
      toast.error('Failed to update wishlist. Please try again.', 'Error', 3000);
    }
  };

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
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="transfer-packages-page" style={!contentVisible ? { background: '#001b3e', minHeight: '100vh' } : {}}>

      {/* ── WanderLoader overlay — shown while fetching transfers ── */}
      <WanderLoader
        loading={loading}
        text="LOADING TRANSFER PACKAGES"
        subtitle="Finding the best transfers for you"
      />

      {/* ── Hero section (mirrors tours-top-section-bg) ── */}
      {contentVisible && (
        <section className="transfers-top-section-bg">
          <div className="transfers-content-container">
            {error ? (
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
                currentUser={currentUser}
                userFavorites={userFavorites}
                onFavoriteToggle={handleFavoriteToggle}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Scrolling location bar (mirrors tourPackages divider) ── */}
      {contentVisible && <div className="transfers-section-divider">
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
      </div>}

      {contentVisible && <MascotGif onClick={openGHLChat} />}
    </div>
  );
}

// ============================================================
// OUTER WRAPPER — provides Toast context
// ============================================================
function TransferPackages({ currentUser }) {
  return (
    <ToastProvider>
      <TransferPackagesContent currentUser={currentUser} />
    </ToastProvider>
  );
}

export default TransferPackages;