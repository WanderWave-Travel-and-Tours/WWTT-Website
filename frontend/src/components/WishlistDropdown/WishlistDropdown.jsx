import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, ShoppingBag, ChevronRight, Trash2, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './WishlistDropdown.css';

const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/400x300?text=No+Image';
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return `https://wanderwaveph.onrender.com${image.startsWith('/') ? '' : '/'}${image}`;
};

function WishlistDropdown({ isOpen, onClose, currentUser, wishlistCount, onWishlistUpdate }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (!isOpen || !currentUser) return;

      setActiveFilter('all');
      setLoading(true);
      try {
        const token = localStorage.getItem('wanderwave_token');
        if (!token) { setLoading(false); return; }

        // cache: 'no-store' prevents 304 stale responses
        const response = await fetch(`https://wanderwaveph.onrender.com/api/favorites`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Failed to fetch wishlist');

        const result = await response.json();

        if (result.status === 'ok' && result.data) {
          // Server now returns packageDetails + itemType directly — no extra fetching needed
          setWishlistItems(result.data);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistItems();
  }, [isOpen, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ============================================================
  // REMOVE WITH PROPER EVENTS
  // ============================================================
  const handleRemoveItem = async (packageId, packageName, packageLocation, e) => {
    e.stopPropagation();
    setRemovingId(packageId);

    try {
      const token = localStorage.getItem('wanderwave_token');

      const response = await fetch(`https://wanderwaveph.onrender.com/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          promo_id: packageId,
          package_title: packageName,
          package_location: packageLocation
        }),
      });

      if (!response.ok) throw new Error('Failed to remove from wishlist');

      const result = await response.json();

      setWishlistItems(prev => prev.filter(item => item.promo_id !== packageId));

      window.dispatchEvent(new Event('wishlistUpdated'));
      window.dispatchEvent(new CustomEvent('favoriteRemoved', {
        detail: { packageId }
      }));

      if (onWishlistUpdate) onWishlistUpdate();

    } catch (err) {
    } finally {
      setRemovingId(null);
    }
  };

  // ============================================================
  // VIEW PACKAGE / TOUR / TRANSFER
  // ============================================================
  const handleViewPackage = (item) => {
    onClose();

    if (item.itemType === 'tour') {
      sessionStorage.setItem('pendingTourBookingId', item.promo_id);
      navigate('/tours');
      return;
    }

    if (item.itemType === 'transfer') {
      navigate('/transfers');
      return;
    }

    if (item.packageDetails) {
      const packageCode = item.packageDetails.package_code || item.promo_id;
      navigate(`/packages/${packageCode}`, {
        state: {
          packageData: {
            _id: item.promo_id,
            id: item.promo_id,
            title: item.package_title,
            name: item.package_title,
            destination: item.package_location,
            location: item.package_location,
            ...item.packageDetails
          }
        }
      });
      return;
    }

    navigate('/packages');
  };

  // ============================================================
  // VIEW ALL FAVORITES
  // ============================================================
  const handleViewAll = () => {
    onClose();
    navigate('/packages?filter=favorites');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('showFavorites'));
    }, 100);
  };

  if (!isOpen) return null;

  // ── Filter counts ────────────────────────────────────────────────────────
  const counts = {
    all:      wishlistItems.length,
    package:  wishlistItems.filter(i => i.itemType === 'package').length,
    tour:     wishlistItems.filter(i => i.itemType === 'tour').length,
    transfer: wishlistItems.filter(i => i.itemType === 'transfer').length,
  };

  const filteredItems = activeFilter === 'all'
    ? wishlistItems
    : wishlistItems.filter(i => i.itemType === activeFilter);

  const FILTER_TABS = [
    { key: 'all',      label: 'All' },
    { key: 'package',  label: 'Packages' },
    { key: 'tour',     label: 'Tours' },
    { key: 'transfer', label: 'Transfers' },
  ];

  return (
    <>
      <div className="wishlist-dropdown-backdrop" onClick={onClose} />

      <div className="wishlist-dropdown-container" ref={dropdownRef}>
        <div className="wishlist-dropdown-header">
          <div className="wishlist-header-left">
            <Heart size={20} strokeWidth={2.5} fill="#FF8C00" color="#FF8C00" />
            <h3>My Wishlist</h3>
            <span className="wishlist-header-count">({wishlistCount})</span>
          </div>
          <button className="wishlist-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ── Filter Tabs ── */}
        {!loading && wishlistItems.length > 0 && (
          <div className="wishlist-filter-tabs">
            {FILTER_TABS.map(tab => (
              counts[tab.key] > 0 || tab.key === 'all' ? (
                <button
                  key={tab.key}
                  className={`wishlist-filter-tab ${activeFilter === tab.key ? 'active' : ''} ${counts[tab.key] === 0 ? 'empty' : ''}`}
                  onClick={() => setActiveFilter(tab.key)}
                >
                  {tab.label}
                  <span className="wishlist-tab-count">{counts[tab.key]}</span>
                </button>
              ) : null
            ))}
          </div>
        )}

        <div className="wishlist-dropdown-body">
          {loading ? (
            <div className="wishlist-loading">
              <div className="spinner"></div>
              <p>Loading your wishlist...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="wishlist-empty">
              <div className="wishlist-empty-icon">
                <Heart size={48} strokeWidth={1.5} color="#cbd5e1" />
              </div>
              <h4>Your wishlist is empty</h4>
              <p>Start adding packages to your wishlist to keep track of your favorite destinations!</p>
              <button className="wishlist-browse-btn" onClick={onClose}>
                <ShoppingBag size={18} />
                <span>Browse Packages</span>
              </button>
            </div>
          ) : (
            <div className="wishlist-items-list">
              {filteredItems.length === 0 ? (
                <div className="wishlist-filter-empty">
                  <Heart size={36} strokeWidth={1.5} color="#cbd5e1" />
                  <p>No {activeFilter}s in your wishlist yet.</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                <div
                  key={item.promo_id}
                  className={`wishlist-item ${removingId === item.promo_id ? 'removing' : ''}`}
                  onClick={() => handleViewPackage(item)}
                >
                  <div className="wishlist-item-image">
                    <img
                      src={
                        item.packageDetails?.imageUrl
                          ? item.packageDetails.imageUrl
                          : item.packageDetails?.image
                          ? getImageUrl(item.packageDetails.image)
                          : 'https://via.placeholder.com/150x100?text=No+Image'
                      }
                      alt={item.package_title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x100?text=Image+Not+Available';
                      }}
                    />
                  </div>

                  <div className="wishlist-item-content">
                    <h4 className="wishlist-item-title">{item.package_title}</h4>

                    <div className="wishlist-item-details">
                      <div className="wishlist-item-detail">
                        <MapPin size={14} />
                        <span>{item.package_location}</span>
                      </div>
                      {item.packageDetails?.duration && (
                        <div className="wishlist-item-detail">
                          <Calendar size={14} />
                          <span>{item.packageDetails.duration}</span>
                        </div>
                      )}
                    </div>

                    {(item.packageDetails?.price || item.packageDetails?.oneWayPrice) && (
                      <div className="wishlist-item-price">
                        <span className="price-label">From</span>
                        <span className="price-value">
                          ₱{(item.packageDetails.price || item.packageDetails.oneWayPrice).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    className="wishlist-item-remove"
                    onClick={(e) => handleRemoveItem(item.promo_id, item.package_title, item.package_location, e)}
                    disabled={removingId === item.promo_id}
                    title="Remove from wishlist"
                  >
                    {removingId === item.promo_id ? (
                      <div className="mini-spinner"></div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
                ))
              )}
            </div>
          )}
        </div>

        {wishlistItems.length > 0 && (
          <div className="wishlist-dropdown-footer">
            <button className="wishlist-view-all-btn" onClick={handleViewAll}>
              <span>View All Favorites</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default WishlistDropdown;