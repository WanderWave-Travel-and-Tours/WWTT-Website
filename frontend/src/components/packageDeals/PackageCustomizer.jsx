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
  // DESTINATION → API SEARCH TERM NORMALIZER
  // ─────────────────────────────────────────────────────────────
  //
  // pkg.destination can be stored with extra qualifiers:
  //   "Siargao Island"    → API must search "Siargao"
  //   "Bohol Island"      → API must search "Bohol"
  //   "El Nido, Palawan"  → API must search "El Nido"
  //
  // The server's word-boundary regex (\bSiargao Island\b) would NOT match
  // seller rate destinations like "Siargao 5D4N (Solo/Joiners)" — it only
  // contains "Siargao", not the full phrase "Siargao Island".
  //
  // Fix: extract the core KNOWN destination token from the package destination
  // before building the API query URL. Longest-key-first so "puerto princesa"
  // is checked before "princesa" never appears alone, and "coron palawan" before "coron".
  //
  // If no known token is found, fall back to the original destination string.
  // ─────────────────────────────────────────────────────────────
  const DEST_API_TOKENS = [
    'siargao', 'siquijor', 'bohol', 'cebu',
    'el nido', 'coron', 'puerto princesa',
  ].sort((a, b) => b.length - a.length); // longest first

  const extractApiSearchTerm = (destination) => {
    const lower = (destination || '').toLowerCase();
    const match = DEST_API_TOKENS.find(token => lower.includes(token));
    if (!match) return destination;
    // Preserve original casing from the matched token
    const DISPLAY = {
      'puerto princesa': 'Puerto Princesa',
      'el nido':         'El Nido',
      'coron palawan':   'Coron Palawan',
      'siargao':         'Siargao',
      'siquijor':        'Siquijor',
      'bohol':           'Bohol',
      'cebu':            'Cebu',
      'coron':           'Coron',
      'boracay':         'Boracay',
      'batanes':         'Batanes',
    };
    return DISPLAY[match] || destination;
  };

  // ─────────────────────────────────────────────────────────────
  // RATE + ACTIVITY CACHES (per destination)
  //
  // Separates the two concerns that were previously coupled:
  //   sellerRatesCacheRef    — raw matching rates from the API, keyed by
  //                            destination token (e.g. "bohol").
  //                            Re-fetched only when the destination changes.
  //   availActCacheRef       — deduplicated activity list for the Add More
  //                            panel, also keyed by destination token.
  //
  // WHY a ref and not state:
  //   These values should NOT trigger re-renders on their own. They are
  //   written once per destination fetch and read in subsequent renders.
  //   State updates for the visible UI (customizedInclusions, availableActivities)
  //   are still done with the existing useState calls.
  //
  // ROOT CAUSE THIS FIXES:
  //   The old code used hasFetchedRef + currentDestinationRef to gate the
  //   ENTIRE fetchSellerRates function (fetch + match) as one unit.
  //   When the user viewed a second package at the SAME destination
  //   (e.g. two different Bohol packages), hasFetchedRef was still true and
  //   the function returned early — leaving the second package's inclusions
  //   matched against the FIRST package's matching results.
  //   Symptom: "2 of 4 inclusions have pricing data" never changed between
  //   packages for the same destination.
  //
  // NEW ARCHITECTURE:
  //   Fetch  → guarded by cache (only when destination changes or cache is empty)
  //   Match  → ALWAYS runs when any pkg field changes (via useCallback deps)
  // ─────────────────────────────────────────────────────────────
  const sellerRatesCacheRef = useRef({});   // destKey → matchingRates[]
  const availActCacheRef    = useRef({});   // destKey → deduplicatedRates[]

  // ─────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────

  const fetchSellerRates = useCallback(async (destination) => {
    // ── Destination normalization ────────────────────────────────
    // Strip suffixes like "Island", "Province" before sending to API.
    // "Siargao Island" → "Siargao",  "Bohol Island" → "Bohol".
    const apiDest    = extractApiSearchTerm(destination);
    const destKey    = (apiDest || '').toLowerCase().trim();

    // ── Show skeleton inclusions immediately ─────────────────────
    // Inclusions display without prices so the screen isn't blank
    // while either the API call or the matching step runs.
    const skeletonInclusions = (pkg.inclusions || []).map((inc, idx) => ({
      id:                 `original-${idx}`,
      name:               inc,
      matchedActivity:    null,
      matchedDestination: null,
      price:              0,
      isOriginal:         true,
      isChecked:          true,
      source:             'package',
    }));
    setCustomizedInclusions(skeletonInclusions);
    setIsPricingLoading(true);
    setError('');

    try {
      let matchingRates;

      // ── Step 1: Fetch seller rates (cached per destination) ──────
      // API call is only made when rates for this destination aren't
      // already cached. When the same destination is viewed again
      // (different package, same location), we skip the HTTP request.
      if (sellerRatesCacheRef.current[destKey]) {
        // Rates already cached — but validate the cache is non-empty before reusing.
        // An empty cache entry means a previous fetch returned no active rates for this
        // destination (e.g. before the status=active fix was deployed). Bust it so we
        // re-fetch and populate correctly.
        const cachedRates = sellerRatesCacheRef.current[destKey];
        if (cachedRates.length > 0) {
          matchingRates = cachedRates;
          setAvailableActivities(availActCacheRef.current[destKey] || []);
          setFilteredActivities(availActCacheRef.current[destKey] || []);
          setIsLoading(false);
        } else {
          // Cache is empty — treat as a cache miss so we re-fetch below
          delete sellerRatesCacheRef.current[destKey];
          delete availActCacheRef.current[destKey];
        }
      }

      if (!matchingRates) {
        // Fresh fetch from API
        setIsLoading(true);

        // Siargao stores rates under sub-location names (e.g. "General Luna")
        // that don't contain "Siargao" — broad fetch required to capture all of them.
        // All other destinations store rates under their own name so a targeted
        // ?destination=X query is sufficient.
        const BROAD_FETCH_DESTINATIONS = ['siargao'];
        const useBroadFetch = BROAD_FETCH_DESTINATIONS.some(d => destKey.includes(d));

        const encodedDest = encodeURIComponent(apiDest);
        const fetchUrl = useBroadFetch
          ? `https://wanderwaveph.onrender.com/api/seller-rates?status=active`
          : `https://wanderwaveph.onrender.com/api/seller-rates?destination=${encodedDest}&status=active`;

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Failed to fetch seller rates');

        const allRates = await response.json();

        // Client-side filter: keep only active rates matching the package destination.
        // The status === 'active' check is a defensive double-check alongside the
        // server-side ?status=active param — ensures inactive rates never reach the matcher.
        matchingRates = (Array.isArray(allRates) ? allRates : []).filter(rate =>
          rate.status === 'active' &&
          destinationsMatch(rate.destination, destination)
        );

        // Deduplicate for the "Add More" panel.
        // Key = activity name + pax so different durations stay as separate options.
        const deduplicatedRates = Object.values(
          matchingRates.reduce((acc, rate) => {
            const paxKey       = (rate.pax || '').trim().toLowerCase().replace(/\s+/g, ' ');
            const compositeKey = `${rate.activity.trim().toLowerCase()}||${paxKey}`;
            if (!acc[compositeKey] || rate.sellingPrice < acc[compositeKey].sellingPrice) {
              acc[compositeKey] = rate;
            }
            return acc;
          }, {})
        );

        // Store in cache so subsequent packages at the same destination skip the fetch
        sellerRatesCacheRef.current[destKey] = matchingRates;
        availActCacheRef.current[destKey]    = deduplicatedRates;

        setAvailableActivities(deduplicatedRates);
        setFilteredActivities(deduplicatedRates);
        setIsLoading(false);
      }

      // ── Step 2: Match inclusions (ALWAYS runs for every pkg change) ──
      // This step is intentionally NOT cached. Every time the package
      // changes (even to another package at the same destination), the
      // matching reruns against the cached rates so the correct prices
      // are shown for THIS package's specific inclusions, duration, and
      // pax qualifier.
      const { matched, matchCount } = matchInclusionsWithPrices(
        pkg.inclusions || [],
        matchingRates,
        destination,
        pkg.tourType || 'private',
        pkg.minPax   || null,
        pkg.duration || null,
        pkg.title    || pkg.name || ''
      );

      setCustomizedInclusions(matched);
      setMatchedInclusionCount(matchCount);

      // Keep legacy refs in sync for resetCustomization
      hasFetchedRef.current         = true;
      currentDestinationRef.current = destKey;

    } catch (err) {
      setError(err.message);
      setAvailableActivities([]);
      setFilteredActivities([]);
      // Skeleton inclusions already shown; keep them with no prices
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
    const packageDestination = pkg.destination || pkg.location || '';
    const apiDest  = extractApiSearchTerm(packageDestination);
    const destKey  = (apiDest || '').toLowerCase().trim();

    // Clear cached rates for this destination so the next fetchSellerRates
    // call re-fetches from the API and re-runs matching with fresh data.
    delete sellerRatesCacheRef.current[destKey];
    delete availActCacheRef.current[destKey];

    // Reset legacy refs so any fallback guard also re-triggers
    hasFetchedRef.current         = false;
    currentDestinationRef.current = '';

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
          <div className="pkgcz-matched-badge">
            ✅ {matchedInclusionCount} of {pkg.inclusions?.length || 0} inclusions have pricing data
          </div>
        )}
      </div>

      {/* Error / Warning Alert */}
      {error && (
        <div className={`pc-error-alert pkgcz-alert ${error.includes('⚠️') ? 'pkgcz-alert-warning' : 'pkgcz-alert-error'}`}>
          <AlertCircle size={20} className={`pkgcz-alert-icon ${error.includes('⚠️') ? 'pkgcz-alert-icon-warning' : 'pkgcz-alert-icon-error'}`} />
          <div className="pkgcz-alert-body">
            <strong className="pkgcz-alert-title">
              {error.includes('⚠️') ? 'Validation Warning' : 'Error Loading Activities'}
            </strong>
            <p className="pkgcz-alert-message">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Current Inclusions */}
      <div className="pc-section">
        <div className="pc-section-header">
          <h3 className="pc-section-title">Package Inclusions{isPricingLoading && <span className="pkgcz-loading-text"><span className="pkgcz-loading-dot" />Fetching prices…</span>}</h3>
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
                          className="pc-badge pkgcz-badge-required"
                          title="At least one inclusion must remain in your package"
                        >
                          Required
                        </span>
                      )}
                      {!inclusion.isOriginal && (
                        <span className="pc-badge pkgcz-badge-added">
                          Added
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pc-inclusion-actions">
                  {inclusion.price > 0 && (
                    <span
                      className={`pc-inclusion-price ${
                        inclusion.isOriginal
                          ? (!inclusion.isChecked ? 'pkgcz-price-deducted' : 'pkgcz-price-included')
                          : 'pkgcz-price-added'
                      }`}
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