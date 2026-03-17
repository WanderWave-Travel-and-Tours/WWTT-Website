import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, CheckCircle, XCircle, 
  Package, RotateCcw, AlertCircle, DollarSign
} from 'lucide-react';
import './PackageCustomizer.css';
import {
  destinationsMatch,
  matchInclusionsWithPrices,
} from './inclusionMatcher';

const PackageCustomizer = ({ 
  pkg, 
  currency = 'PHP', 
  exchangeRate = 58,
  onCustomizationChange,
  timerExpired = false,
  activeBasePrice = null
}) => {
  const [customizedInclusions, setCustomizedInclusions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableActivities, setAvailableActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [totalCustomPrice, setTotalCustomPrice] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState('');
  const [matchedInclusionCount, setMatchedInclusionCount] = useState(0);
  const hasFetchedRef = useRef(false);
  const currentDestinationRef = useRef('');

  // ─────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────

  const fetchSellerRates = useCallback(async (destination) => {
    const destinationKey = (destination || '').toLowerCase().trim();

    if (hasFetchedRef.current && currentDestinationRef.current === destinationKey) {
      return;
    }

    // Show inclusions immediately (no prices yet) so screen is not blank during cold start
    const skeletonInclusions = (pkg.inclusions || []).map((inc, idx) => ({
      id: `original-${idx}`,
      name: inc,
      matchedActivity: null,
      matchedDestination: null,
      price: 0,
      isOriginal: true,
      isChecked: true,
      source: 'package',
    }));
    setCustomizedInclusions(skeletonInclusions);
      setIsPricingLoading(true);
      setIsLoading(true);
      setError('');

    try {
           // Bohol data is now properly stored in the DB with the keyword "Bohol"
      // (just like every other destination). We no longer need the broad-fetch hack.
      const BROAD_FETCH_DESTINATIONS = ['siargao'];   // only Siargao still needs it (if any)
      const destLower = (destination || '').toLowerCase();
      const useBroadFetch = BROAD_FETCH_DESTINATIONS.some(d => destLower.includes(d));

      const encodedDest = encodeURIComponent(destination);
      const fetchUrl = useBroadFetch
        ? `https://wanderwaveph.onrender.com/api/seller-rates`
        : `https://wanderwaveph.onrender.com/api/seller-rates?destination=${encodedDest}`;

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Failed to fetch seller rates');

      const allRates = await response.json();

      // Client-side filter: keep only rates matching the package destination.
      // Note: rate.destination may look like "Puerto Princesa 4D3N (Solo)" —
      // destinationsMatch handles the keyword extraction internally.
      const matchingRates = allRates.filter(rate =>
        destinationsMatch(rate.destination, destination)
      );

      // Deduplication for the "Add More" panel.
      // Key = activity name + pax field so that the same activity at different
      // durations/pax levels stays as separate selectable options.
      const deduplicatedRates = Object.values(
        matchingRates.reduce((acc, rate) => {
          const paxKey      = (rate.pax || '').trim().toLowerCase().replace(/\s+/g, ' ');
          const compositeKey = `${rate.activity.trim().toLowerCase()}||${paxKey}`;
          if (!acc[compositeKey] || rate.sellingPrice < acc[compositeKey].sellingPrice) {
            acc[compositeKey] = rate;
          }
          return acc;
        }, {})
      );

      setAvailableActivities(deduplicatedRates);
      setFilteredActivities(deduplicatedRates);

            // Match each package inclusion to its best seller rate.
      // Pass ONLY the pre-filtered matchingRates (already passed destinationsMatch).
      // This completely eliminates any possibility of foreign-destination prices.
      // (We no longer need the full allRates because Bohol DB is normalized.)
            // Match each package inclusion to its best seller rate.
      // Pass ONLY the filtered Bohol rates (no more foreign prices possible).
      const { matched, matchCount } = matchInclusionsWithPrices(
        pkg.inclusions || [],
        matchingRates,          // ← THIS IS THE FIX
        destination,
        pkg.tourType    || 'private',
        pkg.minPax      || null,
        pkg.duration    || null,
        pkg.title       || pkg.name || ''
      );

      setCustomizedInclusions(matched);
      setMatchedInclusionCount(matchCount);

      hasFetchedRef.current        = true;
      currentDestinationRef.current = destinationKey;

    } catch (err) {
      console.error('❌ Error fetching seller rates:', err);
      setError(err.message);
      setAvailableActivities([]);
      setFilteredActivities([]);

      // Skeleton inclusions already shown above; just keep them with no prices
    } finally {
      setIsLoading(false);
      setIsPricingLoading(false);
    }
  }, [pkg.inclusions, pkg.tourType, pkg.minPax, pkg.duration, pkg.title, pkg.name]);


  // ─────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const packageDestination = pkg.destination || pkg.location || '';
    if (packageDestination) {
      fetchSellerRates(packageDestination);
    }
  }, [pkg.destination, pkg.location, fetchSellerRates]);

  // Filter "Add More" list whenever the search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredActivities(availableActivities);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredActivities(
      availableActivities.filter(activity =>
        activity.activity.toLowerCase().includes(query) ||
        activity.supplierName?.toLowerCase().includes(query) ||
        activity.destination?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, availableActivities]);

  // Recalculate price summary whenever inclusions change
  useEffect(() => {
    let totalDeductions = 0;
    let totalAdditions  = 0;

    customizedInclusions.forEach(inc => {
      if (inc.price > 0) {
        if (inc.isOriginal && !inc.isChecked) totalDeductions += inc.price;
        else if (!inc.isOriginal && inc.isChecked) totalAdditions += inc.price;
      }
    });

    const originalPkgPrice = activeBasePrice !== null ? activeBasePrice : (pkg.price || 0);
    const pricedOriginals   = customizedInclusions.filter(inc => inc.isOriginal && inc.price > 0);
    const allPricedUnchecked = pricedOriginals.length > 0 && pricedOriginals.every(inc => !inc.isChecked);

    const adjustedDeductions = allPricedUnchecked ? originalPkgPrice : totalDeductions;
    const totalChange        = totalAdditions - adjustedDeductions;
    setTotalCustomPrice(totalChange);

    if (onCustomizationChange) {
      onCustomizationChange({
        inclusions:      customizedInclusions,
        additionalPrice: totalChange,
        deductions:      adjustedDeductions,
        additions:       totalAdditions,
        totalPrice:      Math.max(0, originalPkgPrice + totalChange),
      });
    }
  }, [customizedInclusions, onCustomizationChange, activeBasePrice, pkg.price]);


  // ─────────────────────────────────────────────────────────────
  // INCLUSION ACTIONS
  // ─────────────────────────────────────────────────────────────

  const toggleInclusion = (id) => {
    setCustomizedInclusions(prev => {
      const inclusionToToggle = prev.find(inc => inc.id === id);

      if (inclusionToToggle?.isChecked) {
        const checkedCount = prev.filter(inc => inc.isChecked).length;
        if (checkedCount === 1) {
          setError('⚠️ At least one inclusion must remain selected. You cannot remove all inclusions from your package.');
          setTimeout(() => setError(''), 4000);
          return prev;
        }
      }

      setError('');
      return prev.map(inc => inc.id === id ? { ...inc, isChecked: !inc.isChecked } : inc);
    });
  };

  const addInclusion = (rate) => {
    setCustomizedInclusions(prev => [
      ...prev,
      {
        id:                 `added-${Date.now()}`,
        name:               rate.activity,
        matchedActivity:    rate.activity,
        matchedDestination: rate.destination,
        price:              rate.sellingPrice,
        supplierRate:       rate.supplierRate,
        markup:             rate.markup,
        markupType:         rate.markupType,
        supplier:           rate.supplierName,
        destination:        rate.destination,
        pax:                rate.pax,
        inclusions:         rate.inclusions,
        notes:              rate.notes,
        isOriginal:         false,
        isChecked:          true,
        source:             'seller-rate',
        sellerRateId:       rate._id,
      },
    ]);
  };

  const removeInclusion = (id) => {
    setCustomizedInclusions(prev => prev.filter(inc => inc.id !== id));
  };

  const resetCustomization = () => {
    hasFetchedRef.current         = false;
    currentDestinationRef.current = '';
    const packageDestination = pkg.destination || pkg.location || '';
    fetchSellerRates(packageDestination);
    setSearchQuery('');
    setShowSearch(false);
  };


  // ─────────────────────────────────────────────────────────────
  // FORMATTING
  // ─────────────────────────────────────────────────────────────

  const formatPrice = (phpPrice) => {
    const price  = currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;
    const symbol = currency === 'PHP' ? '₱' : '$';
    return `${symbol}${price.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    })}`;
  };


  // ─────────────────────────────────────────────────────────────
  // DERIVED VALUES FOR RENDER
  // ─────────────────────────────────────────────────────────────

  const packageDestination = pkg.destination || pkg.location || 'Unknown';
  const originalPackagePrice = activeBasePrice !== null ? activeBasePrice : (pkg.price || 0);

  const deductionsTotal = customizedInclusions
    .filter(inc => !inc.isChecked && inc.isOriginal && inc.price > 0)
    .reduce((sum, inc) => sum + inc.price, 0);

  const additionsTotal = customizedInclusions
    .filter(inc => inc.isChecked && !inc.isOriginal)
    .reduce((sum, inc) => sum + inc.price, 0);

  const pricedOriginalInclusions = customizedInclusions.filter(inc => inc.isOriginal && inc.price > 0);
  const allPricedOriginalUnchecked = pricedOriginalInclusions.length > 0 &&
    pricedOriginalInclusions.every(inc => !inc.isChecked);

  const newTotalPrice = allPricedOriginalUnchecked && additionsTotal === 0
    ? 0
    : Math.max(
        0,
        originalPackagePrice
          - (allPricedOriginalUnchecked ? originalPackagePrice : deductionsTotal)
          + additionsTotal
      );


  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="pc-container">
      <style>{`
        @keyframes pc-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
        @keyframes pc-shimmer { 0%{background-position:-200px 0} 100%{background-position:200px 0} }
      `}</style>
      <div className="pc-header">
        <div className="pc-title-row">
          <Package size={24} color="#f97316" />
          <h2 className="pc-title">Customize Your Package</h2>
        </div>
        <p className="pc-subtitle">
          Personalize your tour by selecting or deselecting inclusions
        </p>
        <div className="pc-destination-badge">
          📍 {packageDestination}
        </div>

        {matchedInclusionCount > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1e40af',
          }}>
            ✅ {matchedInclusionCount} of {pkg.inclusions?.length || 0} inclusions have pricing data
          </div>
        )}
      </div>

      {/* Error / Warning Alert */}
      {error && (
        <div className="pc-error-alert" style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px',
          marginBottom: '20px',
          background: error.includes('⚠️') ? '#fef3c7' : '#fee2e2',
          border: `2px solid ${error.includes('⚠️') ? '#f59e0b' : '#ef4444'}`,
          borderRadius: '12px',
          color: error.includes('⚠️') ? '#92400e' : '#991b1b',
        }}>
          <AlertCircle size={20} style={{
            marginTop: '2px',
            flexShrink: 0,
            color: error.includes('⚠️') ? '#f59e0b' : '#ef4444',
          }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>
              {error.includes('⚠️') ? 'Validation Warning' : 'Error Loading Activities'}
            </strong>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Current Inclusions */}
      <div className="pc-section">
        <div className="pc-section-header">
          <h3 className="pc-section-title">Package Inclusions{isPricingLoading && <span style={{marginLeft:'8px',fontSize:'0.75rem',fontWeight:'400',color:'#f97316'}}><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'#f97316',animation:'pc-pulse 1.2s ease-in-out infinite',marginRight:'4px'}}/>Fetching prices…</span>}</h3>
          <button
            className="pc-reset-btn"
            onClick={resetCustomization}
            title="Reset to original package"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="pc-inclusions-list">
          {customizedInclusions.map((inclusion) => {
            const checkedCount   = customizedInclusions.filter(inc => inc.isChecked).length;
            const isLastRemaining = inclusion.isChecked && checkedCount === 1;

            return (
              <div
                key={inclusion.id}
                className={`pc-inclusion-item ${inclusion.isChecked ? 'checked' : 'unchecked'} ${isLastRemaining ? 'last-remaining' : ''}`}
              >
                <div className="pc-inclusion-main">
                  <input
                    type="checkbox"
                    className="pc-checkbox"
                    checked={inclusion.isChecked}
                    onChange={() => toggleInclusion(inclusion.id)}
                    disabled={isLastRemaining}
                    title={isLastRemaining ? 'This is the last remaining inclusion and cannot be removed' : ''}
                  />

                  <div className="pc-inclusion-info">
                    <div className="pc-inclusion-name">
                      {inclusion.name}

                      {isLastRemaining && (
                        <span
                          className="pc-badge"
                          style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '2px 6px' }}
                          title="At least one inclusion must remain in your package"
                        >
                          Required
                        </span>
                      )}
                      {!inclusion.isOriginal && (
                        <span className="pc-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                          Added
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pc-inclusion-actions">
                  {inclusion.price > 0 && (
                    <span
                      className="pc-inclusion-price"
                      style={{
                        color: inclusion.isOriginal
                          ? (!inclusion.isChecked ? '#dc2626' : '#64748b')
                          : '#059669',
                      }}
                      title={
                        inclusion.isOriginal
                          ? (!inclusion.isChecked ? 'Will be deducted from package price' : 'Included in package')
                          : 'Will be added to package price'
                      }
                    >
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
            );
          })}
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
          {isLoading ? 'Fetching Activities...' : 'Add More Inclusions'}
        </button>

        {showSearch && (
          <div className="pc-search-panel">
            <div className="pc-info-box">
              <p>Showing activities available for <strong>{packageDestination}</strong></p>
              {availableActivities.length > 0 && (
                <p className="pc-count">
                  {filteredActivities.length} of {availableActivities.length} activities
                </p>
              )}
            </div>

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

            {filteredActivities.length > 0 && (
              <div className="pc-activities-list">
                {filteredActivities.map((rate) => (
                  <div key={rate._id} className="pc-activity-item">
                    <div className="pc-activity-info">
                      <div className="pc-activity-name">{rate.activity}</div>
                    </div>

                    <div className="pc-activity-actions">
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

            {!isLoading && filteredActivities.length === 0 && availableActivities.length > 0 && (
              <div className="pc-no-results">
                <p>No activities match your search.</p>
                <button onClick={() => setSearchQuery('')} className="pc-clear-btn">
                  Clear Search
                </button>
              </div>
            )}

            {!isLoading && availableActivities.length === 0 && !error && (
              <div className="pc-no-activities">
                <p>No activities available for {packageDestination}.</p>
                <p className="pc-hint">Contact admin to add activities for this destination.</p>
              </div>
            )}

            {isLoading && (
              <div className="pc-loading">
                <div className="pc-spinner"></div>
                <p>Loading activities...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCustomizer;