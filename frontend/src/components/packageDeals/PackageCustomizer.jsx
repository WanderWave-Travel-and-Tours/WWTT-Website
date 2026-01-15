import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, CheckCircle, XCircle, 
  Package, RotateCcw, AlertCircle
} from 'lucide-react';
import './PackageCustomizer.css';

const PackageCustomizer = ({ 
  pkg, 
  currency = 'PHP', 
  exchangeRate = 58,
  onCustomizationChange 
}) => {
  const [customizedInclusions, setCustomizedInclusions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableActivities, setAvailableActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCustomPrice, setTotalCustomPrice] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState('');
  
  // Use ref to track if we've already fetched for this destination
  const hasFetchedRef = useRef(false);
  const currentDestinationRef = useRef('');

  // Initialize with package inclusions - ONLY on pkg._id change
  useEffect(() => {
    console.log('🎯 Package loaded:', pkg?.title || pkg?.name);
    console.log('📍 Destination:', pkg?.destination || pkg?.location);
    
    if (pkg && pkg.inclusions) {
      const initialInclusions = pkg.inclusions.map((item, idx) => ({
        id: `original-${idx}`,
        name: item,
        price: 0,
        isOriginal: true,
        isChecked: true,
        source: 'package'
      }));
      setCustomizedInclusions(initialInclusions);
      
      // Reset fetch flag when package changes
      hasFetchedRef.current = false;
      currentDestinationRef.current = '';
    }
  }, [pkg?._id]); // ✅ FIXED: Only depend on package ID

  // Fetch activities - useCallback to prevent re-creation
  const fetchActivitiesForDestination = useCallback(async (destination) => {
    // Prevent duplicate fetches
    if (hasFetchedRef.current && currentDestinationRef.current === destination) {
      console.log('⏭️ SKIP: Already fetched for', destination);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🌐 API Call: Fetching activities for', destination);
      
      const response = await fetch(
        `http://localhost:5000/api/seller-rates?destination=${encodeURIComponent(destination)}&status=active`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Received:', data.length, 'activities');

      if (data.length === 0) {
        setError(`No activities available for ${destination}. Please add seller rates for this destination.`);
        setAvailableActivities([]);
        setFilteredActivities([]);
        hasFetchedRef.current = true;
        currentDestinationRef.current = destination;
        return;
      }

      // Filter out already added inclusions
      const existingNames = customizedInclusions.map(inc => inc.name.toLowerCase());
      const newActivities = data.filter(rate => 
        !existingNames.includes(rate.activity.toLowerCase())
      );

      console.log('✅ New activities available:', newActivities.length);
      
      setAvailableActivities(newActivities);
      setFilteredActivities(newActivities);
      setError('');
      
      // Mark as fetched
      hasFetchedRef.current = true;
      currentDestinationRef.current = destination;

    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(`Failed to load activities: ${err.message}`);
      setAvailableActivities([]);
      setFilteredActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ FIXED: No dependencies to prevent re-creation

  // AUTO-FETCH when destination is available
  useEffect(() => {
    const dest = pkg?.destination || pkg?.location;
    if (dest && !hasFetchedRef.current) {
      console.log('🔍 Auto-fetching activities for:', dest);
      fetchActivitiesForDestination(dest);
    }
  }, [pkg?.destination, pkg?.location, fetchActivitiesForDestination]); // ✅ FIXED: Watch both fields

  // Calculate total price - useCallback for onCustomizationChange
  useEffect(() => {
    const checkedInclusions = customizedInclusions.filter(inc => inc.isChecked);
    const additionalPrice = checkedInclusions
      .filter(inc => !inc.isOriginal)
      .reduce((sum, inc) => sum + (inc.price || 0), 0);
    
    setTotalCustomPrice(additionalPrice);
    
    // Only call if function exists
    if (onCustomizationChange) {
      onCustomizationChange({
        inclusions: checkedInclusions,
        additionalPrice: additionalPrice,
        totalPrice: (pkg?.price || 0) + additionalPrice
      });
    }
  }, [customizedInclusions, pkg?.price]); // ✅ FIXED: Removed onCustomizationChange from deps

  // Filter activities based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = availableActivities.filter(activity =>
        activity.activity.toLowerCase().includes(query) ||
        activity.supplierName?.toLowerCase().includes(query) ||
        activity.inclusions?.toLowerCase().includes(query)
      );
      setFilteredActivities(filtered);
    } else {
      setFilteredActivities(availableActivities);
    }
  }, [searchQuery, availableActivities]);

  const toggleInclusion = (id) => {
    setCustomizedInclusions(prev => 
      prev.map(inc => inc.id === id ? { ...inc, isChecked: !inc.isChecked } : inc)
    );
  };

  const addInclusion = (sellerRate) => {
    console.log('➕ Adding:', sellerRate.activity);
    
    const newInclusion = {
      id: `seller-${sellerRate._id}`,
      name: sellerRate.activity,
      price: sellerRate.sellingPrice,
      supplierRate: sellerRate.supplierRate,
      markup: sellerRate.markup,
      markupType: sellerRate.markupType,
      supplier: sellerRate.supplierName,
      destination: sellerRate.destination,
      pax: sellerRate.pax,
      notes: sellerRate.notes,
      isOriginal: false,
      isChecked: true,
      source: 'seller-rate',
      sellerRateId: sellerRate._id
    };

    setCustomizedInclusions(prev => [...prev, newInclusion]);
    
    // Remove from available activities
    setAvailableActivities(prev => prev.filter(rate => rate._id !== sellerRate._id));
    setFilteredActivities(prev => prev.filter(rate => rate._id !== sellerRate._id));
  };

  const removeInclusion = (id) => {
    const inclusion = customizedInclusions.find(inc => inc.id === id);
    
    if (inclusion.isOriginal) {
      toggleInclusion(id);
    } else {
      setCustomizedInclusions(prev => prev.filter(inc => inc.id !== id));
      
      // Re-fetch to restore removed activity
      const dest = pkg?.destination || pkg?.location;
      if (dest) {
        hasFetchedRef.current = false;
        fetchActivitiesForDestination(dest);
      }
    }
  };

  const resetToOriginal = () => {
    if (pkg && pkg.inclusions) {
      const originalInclusions = pkg.inclusions.map((item, idx) => ({
        id: `original-${idx}`,
        name: item,
        price: 0,
        isOriginal: true,
        isChecked: true,
        source: 'package'
      }));
      setCustomizedInclusions(originalInclusions);
      setSearchQuery('');
      
      // Re-fetch activities
      const dest = pkg?.destination || pkg?.location;
      if (dest) {
        hasFetchedRef.current = false;
        fetchActivitiesForDestination(dest);
      }
    }
  };

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  
  const convertPrice = (phpPrice) => {
    if (currency === 'PHP') return phpPrice;
    return (phpPrice / exchangeRate) * 1.30;
  };

  const formatPrice = (price) => {
    const displayPrice = convertPrice(price);
    return `${currencySymbol}${displayPrice.toLocaleString(undefined, { 
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0 
    })}`;
  };

  return (
    <div className="pc-container">
      <div className="pc-header">
        <div className="pc-title-row">
          <Package size={24} color="#f97316" />
          <h3 className="pc-title">Customize Your Package</h3>
        </div>
        <p className="pc-subtitle">
          Tailor your experience by adding or removing inclusions
        </p>
        {(pkg?.destination || pkg?.location) && (
          <div className="pc-destination-badge">
            📍 {pkg.destination || pkg.location}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="pc-error-alert">
          <AlertCircle size={20} />
          <div>
            <strong>Notice:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Current Inclusions */}
      <div className="pc-section">
        <div className="pc-section-header">
          <h4 className="pc-section-title">Current Inclusions</h4>
          <button 
            className="pc-reset-btn"
            onClick={resetToOriginal}
            title="Reset to original package"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        <div className="pc-inclusions-list">
          {customizedInclusions.map((inclusion) => (
            <div 
              key={inclusion.id} 
              className={`pc-inclusion-item ${inclusion.isChecked ? 'checked' : 'unchecked'}`}
            >
              <div className="pc-inclusion-main">
                <input
                  type="checkbox"
                  checked={inclusion.isChecked}
                  onChange={() => toggleInclusion(inclusion.id)}
                  className="pc-checkbox"
                />
                
                <div className="pc-inclusion-info">
                  <div className="pc-inclusion-name">
                    {inclusion.name}
                    {!inclusion.isOriginal && (
                      <span className="pc-badge">Added</span>
                    )}
                  </div>
                  
                  {!inclusion.isOriginal && (
                    <div className="pc-inclusion-meta">
                      {inclusion.supplier && (
                        <span className="pc-meta-item">
                          Supplier: {inclusion.supplier}
                        </span>
                      )}
                      {inclusion.pax && (
                        <span className="pc-meta-item">
                          PAX: {inclusion.pax}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pc-inclusion-actions">
                {!inclusion.isOriginal && inclusion.price > 0 && (
                  <span className="pc-inclusion-price">
                    {formatPrice(inclusion.price)}
                  </span>
                )}
                
                {!inclusion.isOriginal && (
                  <button
                    className="pc-remove-btn"
                    onClick={() => removeInclusion(inclusion.id)}
                    title="Remove inclusion"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add More Section */}
      <div className="pc-section">
        <button 
          className="pc-search-toggle"
          onClick={() => setShowSearch(!showSearch)}
          disabled={isLoading}
        >
          <Plus size={18} />
          {isLoading ? 'Loading Activities...' : 'Add More Inclusions'}
        </button>

        {showSearch && (
          <div className="pc-search-panel">
            {/* Info Box */}
            <div className="pc-info-box">
              <p>
                Showing activities available for <strong>{pkg?.destination || pkg?.location || 'unknown'}</strong>
              </p>
              {availableActivities.length > 0 && (
                <p className="pc-count">
                  {filteredActivities.length} of {availableActivities.length} activities
                </p>
              )}
            </div>

            {/* Search Box */}
            {availableActivities.length > 0 && (
              <div className="pc-search-box">
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pc-search-input"
                />
              </div>
            )}

            {/* Activities List */}
            {filteredActivities.length > 0 && (
              <div className="pc-activities-list">
                {filteredActivities.map((rate) => (
                  <div key={rate._id} className="pc-activity-item">
                    <div className="pc-activity-info">
                      <div className="pc-activity-name">{rate.activity}</div>
                      <div className="pc-activity-meta">
                        {rate.supplierName && (
                          <span className="pc-meta-tag">
                            🏢 {rate.supplierName}
                          </span>
                        )}
                        {rate.pax && (
                          <span className="pc-meta-tag">
                            👥 {rate.pax}
                          </span>
                        )}
                      </div>
                      {rate.inclusions && (
                        <div className="pc-activity-inclusions">
                          <small>Includes: {rate.inclusions}</small>
                        </div>
                      )}
                    </div>

                    <div className="pc-activity-actions">
                      <div className="pc-activity-price">
                        {formatPrice(rate.sellingPrice)}
                      </div>
                      <button
                        className="pc-add-btn"
                        onClick={() => addInclusion(rate)}
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && filteredActivities.length === 0 && availableActivities.length > 0 && (
              <div className="pc-no-results">
                <p>No activities match your search.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="pc-clear-btn"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* No Activities */}
            {!isLoading && availableActivities.length === 0 && !error && (
              <div className="pc-no-activities">
                <p>No activities available for {pkg?.destination || pkg?.location}.</p>
                <p className="pc-hint">
                  Contact admin to add activities for this destination.
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="pc-loading">
                <div className="pc-spinner"></div>
                <p>Loading activities...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Summary */}
      {totalCustomPrice > 0 && (
        <div className="pc-price-summary">
          <div className="pc-price-row">
            <span>Original Package Price:</span>
            <span>{formatPrice(pkg?.price || 0)}</span>
          </div>
          <div className="pc-price-row highlight">
            <span>Additional Inclusions:</span>
            <span className="pc-price-added">+ {formatPrice(totalCustomPrice)}</span>
          </div>
          <div className="pc-price-row total">
            <span>New Total Price:</span>
            <span className="pc-price-total">
              {formatPrice((pkg?.price || 0) + totalCustomPrice)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageCustomizer;