import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, ShoppingBag, ChevronRight, Trash2, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './WishlistDropdown.css';

const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/400x300?text=No+Image';
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return `http://localhost:5000${image.startsWith('/') ? '' : '/'}${image}`;
};

function WishlistDropdown({ isOpen, onClose, currentUser, wishlistCount, onWishlistUpdate }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (!isOpen || !currentUser) return;

      setLoading(true);
      try {
        const userId = currentUser._id;
        console.log('📥 Fetching wishlist items for dropdown...');

        const response = await fetch(`http://localhost:5000/api/favorites/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch wishlist');
        }

        const result = await response.json();
        console.log('✅ Wishlist items:', result);

        if (result.status === 'ok' && result.data) {
          const itemsWithDetails = await Promise.all(
            result.data.map(async (item) => {
              try {
                const pkgResponse = await fetch(`http://localhost:5000/api/packages/${item.promo_id}`);
                if (pkgResponse.ok) {
                  const pkgResult = await pkgResponse.json();
                  if (pkgResult.status === 'ok') {
                    return {
                      ...item,
                      packageDetails: pkgResult.data
                    };
                  }
                }
                return item;
              } catch (err) {
                console.error('Error fetching package details:', err);
                return item;
              }
            })
          );
          
          setWishlistItems(itemsWithDetails);
        }
      } catch (err) {
        console.error('❌ Error fetching wishlist:', err);
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
  // ⭐ UPDATED: REMOVE WITH PROPER EVENTS
  // ============================================================
  const handleRemoveItem = async (packageId, packageName, packageLocation, e) => {
    e.stopPropagation();
    
    setRemovingId(packageId);

    try {
      const userId = currentUser._id;
      console.log('🗑️ Removing from wishlist:', packageId);

      const response = await fetch(`http://localhost:5000/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promo_id: packageId,
          user_id: userId,
          package_title: packageName,
          package_location: packageLocation
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      const result = await response.json();
      console.log('✅ Remove success:', result);

      // ⭐ Update local state immediately
      setWishlistItems(prev => prev.filter(item => item.promo_id !== packageId));
      
      // ⭐ Dispatch multiple events for different listeners
      console.log('📢 Dispatching wishlist update events...');
      
      // Event 1: Update navbar count
      window.dispatchEvent(new Event('wishlistUpdated'));
      
      // Event 2: Update AllPackages favorites list with package ID
      window.dispatchEvent(new CustomEvent('favoriteRemoved', { 
        detail: { packageId } 
      }));
      
      // Notify parent component
      if (onWishlistUpdate) {
        onWishlistUpdate();
      }

    } catch (err) {
      console.error('❌ Error removing from wishlist:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewPackage = (item) => {
    if (!item.packageDetails) return;
    
    const packageCode = item.packageDetails.package_code || item.promo_id;
    onClose();
    
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
  };

  // ============================================================
  // ⭐ UPDATED: VIEW ALL FAVORITES WITH PROPER NAVIGATION
  // ============================================================
  const handleViewAll = () => {
    console.log('🎯 Navigating to Favorites view...');
    onClose();
    
    // Navigate to packages with favorites parameter
    navigate('/packages?filter=favorites');
    
    // Dispatch event to trigger favorites view
    setTimeout(() => {
      console.log('📢 Dispatching showFavorites event...');
      window.dispatchEvent(new CustomEvent('showFavorites'));
    }, 100);
  };

  if (!isOpen) return null;

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
              {wishlistItems.map((item) => (
                <div 
                  key={item.promo_id} 
                  className={`wishlist-item ${removingId === item.promo_id ? 'removing' : ''}`}
                  onClick={() => handleViewPackage(item)}
                >
                  <div className="wishlist-item-image">
                    <img 
                      src={item.packageDetails?.image ? getImageUrl(item.packageDetails.image) : 'https://via.placeholder.com/150x100?text=No+Image'} 
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

                    {item.packageDetails?.price && (
                      <div className="wishlist-item-price">
                        <span className="price-label">From</span>
                        <span className="price-value">₱{item.packageDetails.price.toLocaleString()}</span>
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
              ))}
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