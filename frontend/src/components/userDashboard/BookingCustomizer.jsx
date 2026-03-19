import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, CheckCircle, XCircle, 
  Package, RotateCcw, AlertCircle, DollarSign
} from 'lucide-react';
import './BookingCustomizer.css';
import {
  destinationsMatch,
  matchInclusionsWithPrices,
} from './inclusionMatcher';

const BookingCustomizer = ({ 
  booking,      // ✅ booking object from parent
  onUpdate      // ✅ callback to update parent when changes saved
}) => {
  const [customizedInclusions, setCustomizedInclusions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableActivities, setAvailableActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState('');
  const [matchedInclusionCount, setMatchedInclusionCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchedPackageData, setFetchedPackageData] = useState(null); // ✅ Store fetched package

  const hasFetchedRef = useRef(false);
  const currentDestinationRef = useRef('');
  const currentPackageNameRef = useRef('');
  const hasFetchedPackageRef = useRef(false); // ✅ Track package fetch

  // ─────────────────────────────────────────────────────────────
  // RATE + ACTIVITY CACHES (per destination)
  //
  // Mirrors the same caching architecture as PackageCustomizer:
  //   sellerRatesCacheRef  — raw matching rates from the API, keyed by
  //                          destination token (e.g. "bohol").
  //                          Re-fetched only when the destination changes.
  //   availActCacheRef     — deduplicated activity list for the Add More
  //                          panel, also keyed by destination token.
  //
  // WHY a ref and not state:
  //   These values should NOT trigger re-renders on their own. They are
  //   written once per destination fetch and read in subsequent renders.
  // ─────────────────────────────────────────────────────────────
  const sellerRatesCacheRef = useRef({});   // destKey → matchingRates[]
  const availActCacheRef    = useRef({});   // destKey → deduplicatedRates[]

  // ✅ API Configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wanderwaveph.onrender.com';

  // ─────────────────────────────────────────────────────────────
  // DESTINATION → API SEARCH TERM NORMALIZER
  //
  // Strips suffixes like "Island", "Province" before sending to API:
  //   "Siargao Island"    → API must search "Siargao"
  //   "Bohol Island"      → API must search "Bohol"
  //   "El Nido, Palawan"  → API must search "El Nido"
  //
  // The server's word-boundary regex would NOT match seller rate
  // destinations like "Siargao 5D4N (Solo/Joiners)" — it only contains
  // "Siargao", not the full phrase "Siargao Island".
  //
  // Longest-key-first so "coron palawan" is checked before "coron".
  // If no known token is found, falls back to the original string.
  // ─────────────────────────────────────────────────────────────
  const DEST_API_TOKENS = [
    'puerto princesa', 'el nido', 'coron palawan',
    'siargao', 'siquijor', 'bohol', 'cebu', 'coron',
    'boracay', 'batanes',
  ].sort((a, b) => b.length - a.length); // longest first

  const extractApiSearchTerm = (destination) => {
    const lower = (destination || '').toLowerCase();
    const match = DEST_API_TOKENS.find(token => lower.includes(token));
    if (!match) return destination;
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

  // ✅ Extract main destination name for UI display only (not for API querying)
  const extractMainDestination = (destination) => {
    if (!destination) return '';
    let clean = destination.split('(')[0].trim();
    clean = clean
      .replace(/\d+D\d+N/gi, '')
      .replace(/\d+\s*(day|days|night|nights)/gi, '')
      .replace(/package/gi, '')
      .replace(/tour/gi, '')
      .trim();
    return clean;
  };

  // ─────────────────────────────────────────────────────────────
  // FETCH MATCHING RATES — shared internal helper
  //
  // Returns the raw matching seller rates for a destination, either
  // from cache (if a previous fetch already ran for this destination)
  // or from a fresh API call.
  //
  // Used by both:
  //   fetchSellerRates   — populates the "Add More" panel
  //   initializeInclusions — prices the current inclusions list
  //
  // WHY a separate helper:
  //   The two callers above need the same rate data but do different
  //   things with it. Centralising the fetch+cache logic here means
  //   we never make two API calls for the same destination within one
  //   booking session.
  // ─────────────────────────────────────────────────────────────
  const fetchMatchingRates = useCallback(async (destination) => {
    const apiDest = extractApiSearchTerm(destination);
    const destKey = (apiDest || '').toLowerCase().trim();

    // Return from cache if available and non-empty
    if (sellerRatesCacheRef.current[destKey]?.length > 0) {
      return sellerRatesCacheRef.current[destKey];
    }

    // Siargao stores rates under sub-location names (e.g. "General Luna")
    // that don't contain "Siargao" — broad fetch required to capture all of them.
    const BROAD_FETCH_DESTINATIONS = ['siargao'];
    const useBroadFetch = BROAD_FETCH_DESTINATIONS.some(d => destKey.includes(d));

    const encodedDest = encodeURIComponent(apiDest);
    const fetchUrl = useBroadFetch
      ? `${API_BASE_URL}/api/seller-rates?status=active`
      : `${API_BASE_URL}/api/seller-rates?destination=${encodedDest}&status=active`;

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch seller rates`);

    const allRates = await response.json();

    // Client-side filter: keep only active rates matching the destination.
    // The status === 'active' check is a defensive double-check alongside the
    // server-side ?status=active param — ensures inactive rates never reach the matcher.
    const matchingRates = (Array.isArray(allRates) ? allRates : []).filter(rate =>
      rate.status === 'active' &&
      destinationsMatch(rate.destination, destination)
    );

    // Store in cache so subsequent calls at the same destination skip the fetch
    sellerRatesCacheRef.current[destKey] = matchingRates;
    return matchingRates;
  }, []);


  // ─────────────────────────────────────────────────────────────
  // FETCH SELLER RATES — populates the "Add More" panel
  //
  // Uses the shared fetchMatchingRates helper (so the HTTP call is
  // only made once per destination, even if both the inclusion-init
  // effect and this function need rates for the same location).
  //
  // After getting raw rates, deduplicates them (activity + pax key)
  // for a cleaner "Add More" list and caches the result in
  // availActCacheRef so subsequent bookings at the same destination
  // instantly populate the panel without another fetch.
  // ─────────────────────────────────────────────────────────────
  const fetchSellerRates = useCallback(async (destination) => {
    if (!destination || destination === 'Unknown' || destination === 'Unknown Destination') {
      console.log('⚠️ Invalid destination, skipping fetch');
      return;
    }

    const apiDest = extractApiSearchTerm(destination);
    const destKey = (apiDest || '').toLowerCase().trim();

    // If "Add More" panel already has data for this destination, skip entirely
    if (availActCacheRef.current[destKey]?.length > 0) {
      setAvailableActivities(availActCacheRef.current[destKey]);
      setFilteredActivities(availActCacheRef.current[destKey]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const matchingRates = await fetchMatchingRates(destination);

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

      // Cache the deduplicated list so this destination's panel loads instantly next time
      availActCacheRef.current[destKey] = deduplicatedRates;

      setAvailableActivities(deduplicatedRates);
      setFilteredActivities(deduplicatedRates);

      // Keep legacy refs in sync for the destination-change guard
      hasFetchedRef.current         = true;
      currentDestinationRef.current = destKey;

    } catch (err) {
      console.error('❌ Error fetching seller rates:', err);
      setError(`Failed to load activities: ${err.message}`);
      setAvailableActivities([]);
      setFilteredActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMatchingRates]);


  // ─────────────────────────────────────────────────────────────
  // FETCH PACKAGE BY TITLE — PRIORITY 4 FALLBACK
  //
  // When booking.packageId is null and no inclusions are stored on the
  // booking itself, we attempt to find the package in the /api/packages/all
  // endpoint by matching the title. This lets us get inclusion strings
  // that can then be priced via the seller-rates matcher.
  // ─────────────────────────────────────────────────────────────
  const fetchPackageByTitle = async (packageTitle) => {
    if (!packageTitle || hasFetchedPackageRef.current) {
      return null;
    }

    try {
      console.log(`🔍 Fetching package by title: "${packageTitle}"`);
      
      const response = await fetch(`${API_BASE_URL}/api/packages/all`);
      const data = await response.json();

      if (data.status === 'ok' && data.data) {
        const matchedPackage = data.data.find(pkg => 
          pkg.title.toLowerCase() === packageTitle.toLowerCase()
        );

        if (matchedPackage) {
          console.log('✅ Found matching package:', matchedPackage.title);
          console.log('   - Inclusions:', matchedPackage.inclusions);
          hasFetchedPackageRef.current = true;
          setFetchedPackageData(matchedPackage);
          return matchedPackage;
        } else {
          console.log('⚠️ No matching package found for:', packageTitle);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching package:', error);
      return null;
    }
  };


  // ─────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────

  // ✅ CRITICAL FIX: Initialize inclusions with package fetch fallback
  //
  // Initialization priority order:
  //   1. booking.customizedInclusions  — already-saved user customizations
  //   2. booking.packageId.inclusions  — inclusions from populated package ref
  //   3. booking.originalInclusions    — snapshot inclusions stored on booking
  //   4. Fetch package by title        — last-resort API lookup
  //   5. Empty state                   — nothing found anywhere
  //
  // For priorities 2, 3, 4: we attempt to price the inclusions by fetching
  // seller rates (via the shared fetchMatchingRates helper) and running
  // matchInclusionsWithPrices from inclusionMatcher.js. If the fetch fails,
  // we fall back gracefully to un-priced (price = 0) inclusions.
  useEffect(() => {
    if (!booking) {
      console.log('⚠️ No booking provided to BookingCustomizer');
      return;
    }

    const initializeInclusions = async () => {
      console.log('📦 Initializing BookingCustomizer for booking:', booking._id);
      console.log('   - customizedInclusions:', booking.customizedInclusions?.length || 0);
      console.log('   - originalInclusions:', booking.originalInclusions?.length || 0);
      console.log('   - packageId:', booking.packageId || 'null');
      console.log('   - packageName:', booking.packageName || 'null');

      // ── Helper: extract matching params from the booking object ──────────
      const getMatchingParams = (pkg = null) => ({
        tourType:    booking.tourType     || booking.packageId?.tourType     || pkg?.tourType    || 'private',
        minPax:      booking.minPax       || booking.packageId?.minPax       || pkg?.minPax      || null,
        pkgDuration: booking.packageId?.duration || booking.duration         || pkg?.duration    || null,
        pkgTitle:    booking.packageName  || booking.packageId?.title        || pkg?.title       || '',
      });

      // ── Helper: resolve destination for rate matching ────────────────────
      const getMatchingDestination = (pkg = null) =>
        (pkg?.destination)            ||
        booking.packageId?.destination ||
        booking.destination            ||
        booking.packageName            ||
        'Unknown';

      // ── Helper: build skeleton inclusions (shown while prices load) ──────
      const buildSkeleton = (inclusions) =>
        inclusions.map((inc, idx) => ({
          id:                 `original-${idx}`,
          name:               inc,
          matchedActivity:    null,
          matchedDestination: null,
          price:              0,
          isOriginal:         true,
          isChecked:          true,
          source:             'package',
        }));

      // ── Helper: fetch rates + match inclusions with prices ───────────────
      const matchWithPrices = async (inclusionStrings, destination, pkg = null) => {
        const { tourType, minPax, pkgDuration, pkgTitle } = getMatchingParams(pkg);

        setIsPricingLoading(true);

        try {
          const rates = await fetchMatchingRates(destination);
          const activeRates = rates.filter(rate =>
            rate.status === 'active' && rate.isArchive === 'No'
          );

          const { matched, matchCount } = matchInclusionsWithPrices(
            inclusionStrings,
            activeRates.length > 0 ? activeRates : rates,
            destination,
            tourType,
            minPax,
            pkgDuration,
            pkgTitle,
          );

          setMatchedInclusionCount(matchCount);
          return matched;
        } catch (err) {
          console.error('⚠️ Error matching inclusions with prices:', err);
          return null; // signals caller to use skeleton fallback
        } finally {
          setIsPricingLoading(false);
        }
      };


      // ══════════════════════════════════════════════════════════
      // PRIORITY 1: Existing customized inclusions
      // ══════════════════════════════════════════════════════════
      if (booking.customizedInclusions && 
          Array.isArray(booking.customizedInclusions) && 
          booking.customizedInclusions.length > 0) {
        
        console.log('✅ Found customizedInclusions:', booking.customizedInclusions.length, 'items');
        
        const clonedInclusions = booking.customizedInclusions.map((inc, index) => ({
          id:                 inc.id || `inc-${index}-${Date.now()}`,
          name:               inc.name || '',
          price:              typeof inc.price === 'number' ? inc.price : (parseFloat(inc.price) || 0),
          supplierRate:       typeof inc.supplierRate === 'number' ? inc.supplierRate : (parseFloat(inc.supplierRate) || 0),
          markup:             typeof inc.markup === 'number' ? inc.markup : (parseFloat(inc.markup) || 0),
          markupType:         inc.markupType || 'fixed',
          supplier:           inc.supplier || 'N/A',
          destination:        inc.destination || '',
          pax:                inc.pax || '',
          notes:              inc.notes || '',
          isOriginal:         inc.isOriginal === true || inc.isOriginal === 'true',
          isChecked:          inc.isChecked === false || inc.isChecked === 'false' ? false : true,
          source:             inc.source || 'package',
          sellerRateId:       inc.sellerRateId || null,
          matchedActivity:    inc.matchedActivity || null,
          matchedDestination: inc.matchedDestination || null,
        }));
        
        setCustomizedInclusions(clonedInclusions);
        const originalCount = clonedInclusions.filter(inc => inc.isOriginal).length;
        setMatchedInclusionCount(originalCount);
        console.log(`✅ Loaded ${clonedInclusions.length} customized inclusions`);
        return;
      } 
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 2: booking.packageId.inclusions
      // ══════════════════════════════════════════════════════════
      if (booking.packageId && 
          booking.packageId.inclusions && 
          Array.isArray(booking.packageId.inclusions) && 
          booking.packageId.inclusions.length > 0) {
        
        console.log('📋 Found packageId.inclusions:', booking.packageId.inclusions.length, 'items');

        // Show skeleton immediately while prices load
        setCustomizedInclusions(buildSkeleton(booking.packageId.inclusions));

        const destination = getMatchingDestination();
        const matched = await matchWithPrices(booking.packageId.inclusions, destination);
        
        if (matched) {
          setCustomizedInclusions(matched);
          console.log(`✅ Initialized ${matched.length} inclusions from packageId with prices`);
        } else {
          // Keep skeleton (already set above)
          setMatchedInclusionCount(0);
          console.log(`✅ Initialized ${booking.packageId.inclusions.length} inclusions from packageId (no prices)`);
        }
        return;
      }
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 3: booking.originalInclusions
      // ══════════════════════════════════════════════════════════
      if (booking.originalInclusions && 
          Array.isArray(booking.originalInclusions) && 
          booking.originalInclusions.length > 0) {
        
        console.log('📋 Found originalInclusions:', booking.originalInclusions.length, 'items');

        // Show skeleton immediately while prices load
        setCustomizedInclusions(buildSkeleton(booking.originalInclusions));

        const destination = getMatchingDestination();
        const matched = await matchWithPrices(booking.originalInclusions, destination);

        if (matched) {
          setCustomizedInclusions(matched);
          console.log(`✅ Initialized ${matched.length} inclusions from originalInclusions with prices`);
        } else {
          setMatchedInclusionCount(0);
          console.log(`✅ Initialized ${booking.originalInclusions.length} inclusions from originalInclusions (no prices)`);
        }
        return;
      }
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 4: FETCH PACKAGE BY TITLE (last-resort fallback)
      // ══════════════════════════════════════════════════════════
      if (booking.packageName) {
        console.log('🔍 Attempting to fetch package by title:', booking.packageName);
        const fetchedPackage = await fetchPackageByTitle(booking.packageName);
        
        if (fetchedPackage && fetchedPackage.inclusions && fetchedPackage.inclusions.length > 0) {
          console.log('✅ Using inclusions from fetched package');

          // Show skeleton immediately while prices load
          setCustomizedInclusions(buildSkeleton(fetchedPackage.inclusions));

          const destination = getMatchingDestination(fetchedPackage);
          const matched = await matchWithPrices(fetchedPackage.inclusions, destination, fetchedPackage);

          if (matched) {
            setCustomizedInclusions(matched);
            console.log(`✅ Initialized ${matched.length} inclusions from fetched package with prices`);
          } else {
            setMatchedInclusionCount(0);
            console.log(`✅ Initialized ${fetchedPackage.inclusions.length} inclusions from fetched package (no prices)`);
          }
          return;
        }
      }
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 5: EMPTY STATE
      // ══════════════════════════════════════════════════════════
      console.error('❌ No inclusions found in any source!');
      setCustomizedInclusions([]);
      setMatchedInclusionCount(0);
    };

    initializeInclusions();
  }, [booking?._id, fetchMatchingRates]);

  // ✅ Fetch seller rates for "Add More" panel when booking changes
  useEffect(() => {
    if (!booking) return;
    
    const packageDestination =
      booking.packageId?.destination ||
      booking.destination            ||
      booking.packageName            ||
      'Unknown Destination';
    
    const packageName = booking.packageName || '';
                              
    console.log('🎯 Booking destination:', packageDestination);
    console.log('🎯 Package name:', packageName);
    
    // Skip if same destination + package (guard against spurious re-renders)
    if (currentDestinationRef.current === packageDestination && 
        currentPackageNameRef.current === packageName) {
      console.log('⏭️ Same destination and package, skipping fetch');
      return;
    }
    
    currentDestinationRef.current = packageDestination;
    currentPackageNameRef.current = packageName;
    
    fetchSellerRates(packageDestination);
  }, [booking, fetchSellerRates]);

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


  // ─────────────────────────────────────────────────────────────
  // SAVE CUSTOMIZATION TO BACKEND
  // ─────────────────────────────────────────────────────────────

  const handleSaveCustomization = async () => {
    if (!booking || !booking._id) {
      console.error('❌ No booking ID available');
      setError('Cannot save: No booking ID found');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      const checkedInclusions  = customizedInclusions.filter(inc => inc.isChecked);
      const addedInclusions    = checkedInclusions.filter(inc => !inc.isOriginal);
      const removedOriginal    = customizedInclusions.filter(inc => inc.isOriginal && !inc.isChecked);
      
      const additionalPrice    = addedInclusions.reduce((sum, inc) => sum + (inc.price || 0), 0);
      const deductions         = removedOriginal.reduce((sum, inc) => sum + (inc.price || 0), 0);
      const netAdditionalPrice = additionalPrice - deductions;
      
      console.log('💰 Customization pricing:', {
        additionalPrice,
        deductions,
        netAdditionalPrice,
        checkedCount: checkedInclusions.length,
      });
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/${booking._id}/customization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customizedInclusions:          customizedInclusions,
          customizationAdditionalPrice:  netAdditionalPrice,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save customization');
      
      const updatedBooking = await response.json();
      console.log('✅ Customization saved:', updatedBooking);
      
      if (onUpdate) {
        onUpdate(updatedBooking.booking);
      }
      
    } catch (error) {
      console.error('❌ Error saving customization:', error);
      setError(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };


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

  const resetCustomization = async () => {
    console.log('🔄 Resetting customization to original');
    
    if (!booking) return;

    // Clear rate cache for this destination so the next fetchSellerRates
    // call re-fetches from the API and re-runs matching with fresh data.
    const packageDestination =
      booking.packageId?.destination ||
      booking.destination            ||
      booking.packageName            ||
      'Unknown Destination';
    const apiDest = extractApiSearchTerm(packageDestination);
    const destKey = (apiDest || '').toLowerCase().trim();
    delete sellerRatesCacheRef.current[destKey];
    delete availActCacheRef.current[destKey];

    // Reset legacy refs so the useEffect guard re-triggers
    hasFetchedRef.current         = false;
    currentDestinationRef.current = '';
    currentPackageNameRef.current = '';
    
    const originalInclusions = 
      booking.originalInclusions || 
      booking.packageId?.inclusions ||
      fetchedPackageData?.inclusions ||
      [];
    
    if (originalInclusions.length === 0) {
      console.warn('⚠️ No original inclusions found');
      return;
    }
    
    const resetInclusions = originalInclusions.map((inc, idx) => ({
      id:        `original-${idx}`,
      name:      inc,
      price:     0,
      isOriginal: true,
      isChecked:  true,
      source:     'package',
    }));
    
    setCustomizedInclusions(resetInclusions);
    setMatchedInclusionCount(0);
    
    await handleSaveCustomization();
  };


  // ─────────────────────────────────────────────────────────────
  // FORMATTING
  // ─────────────────────────────────────────────────────────────

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₱0';
    return `₱${Number(price).toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };


  // ─────────────────────────────────────────────────────────────
  // DERIVED VALUES FOR RENDER
  // ─────────────────────────────────────────────────────────────

  const packageDestination =
    booking?.packageName              ||
    booking?.packageId?.destination   || 
    booking?.destination              ||
    'Unknown Destination';

  // ─────────────────────────────────────────────────────────────
  // SUPPORTED DESTINATIONS GUARD
  //
  // BookingCustomizer is only available for Philippine domestic
  // destinations that have seller rates in the system.
  // If the booking's destination does not match any of these,
  // the component renders nothing so the UI stays clean.
  // ─────────────────────────────────────────────────────────────
  const SUPPORTED_DESTINATIONS = [
    'siargao',
    'siquijor',
    'bohol',
    'cebu',
    'el nido',
    'coron',
    'puerto princesa',
  ];

  const isDestinationSupported = SUPPORTED_DESTINATIONS.some(dest =>
    packageDestination.toLowerCase().includes(dest)
  );

  if (!isDestinationSupported) return null;


  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="pc-container">
      {/* Header */}
      <div className="pc-header">
        <div className="pc-title-row">
          <Package size={24} color="#f97316" />
          <h2 className="pc-title">Customize Your Booking</h2>
        </div>
        <p className="pc-subtitle">
          Personalize your tour by selecting or deselecting inclusions
        </p>
        <div className="pc-destination-badge">
          📍 {booking?.packageName ? `${booking.packageName} in ${extractMainDestination(packageDestination)}` : extractMainDestination(packageDestination)}
        </div>
        
        {customizedInclusions.length > 0 && matchedInclusionCount > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1e40af',
          }}>
            ✅ {matchedInclusionCount} of {customizedInclusions.length} inclusions have pricing data
          </div>
        )}
      </div>

      {/* Error/Warning Alert */}
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
              {error.includes('⚠️') ? 'Validation Warning' : 'Error'}
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
          <h3 className="pc-section-title">
            Package Inclusions
            {isPricingLoading && (
              <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: '400', color: '#f97316' }}>
                <span style={{
                  display: 'inline-block', width: '8px', height: '8px',
                  borderRadius: '50%', background: '#f97316',
                  animation: 'pc-pulse 1.2s ease-in-out infinite', marginRight: '4px',
                }} />
                Fetching prices…
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="pc-save-btn" 
              onClick={handleSaveCustomization}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isSaving ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {isSaving ? (
                <>
                  <div style={{ 
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Save Changes
                </>
              )}
            </button>
            
            <button 
              className="pc-reset-btn" 
              onClick={resetCustomization}
              title="Reset to original package"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* INCLUSIONS LIST */}
        {customizedInclusions.length > 0 ? (
          <div className="pc-inclusions-list">
            {customizedInclusions.map((inclusion) => {
              const checkedCount    = customizedInclusions.filter(inc => inc.isChecked).length;
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
                      title={isLastRemaining ? "This is the last remaining inclusion and cannot be removed" : ""}
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
                        
                        {inclusion.isOriginal && !isLastRemaining && (
                          <span 
                            className="pc-badge" 
                            style={{ 
                              background: inclusion.price > 0 ? '#dcfce7' : '#fee2e2',
                              color:      inclusion.price > 0 ? '#166534' : '#991b1b',
                            }}
                          >
                            {inclusion.price > 0 ? 'Priced' : 'No Rate'}
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
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1',
          }}>
            <Package size={48} style={{ margin: '0 auto 16px', color: '#cbd5e1' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
              No inclusions found for this booking
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>
              Loading package details...
            </p>
          </div>
        )}
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
            <div className="pc-info-box">
              <p>
                Showing activities for <strong>{booking?.packageName || extractMainDestination(packageDestination)}</strong>
              </p>
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
                  <div key={rate._id} className="pc-activity-item-simple">
                    <div className="pc-activity-content">
                      <div className="pc-activity-title">
                        {rate.activity}
                      </div>
                      <div className="pc-activity-destination">
                        📍 {rate.destination}
                      </div>
                    </div>
                    
                    <div className="pc-activity-actions-simple">
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

            {!isLoading && availableActivities.length === 0 && !error && (
              <div className="pc-no-activities">
                <p>No activities available for {booking?.packageName || extractMainDestination(packageDestination)}.</p>
                <p className="pc-hint">
                  Contact admin to add activities for this destination.
                </p>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pc-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
      `}</style>
    </div>
  );
};

export default BookingCustomizer;