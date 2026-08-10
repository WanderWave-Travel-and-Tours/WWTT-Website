import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, CheckCircle, XCircle, 
  Package, RotateCcw, AlertCircle, DollarSign, Building2
} from 'lucide-react';
import './BookingCustomizer.css';
import { API_BASE_URL } from '../../config/apiBase';
import {
  destinationsMatch,
  matchInclusionsWithPrices,
} from './inclusionMatcher';
import HotelCustomizer from './HotelCustomizer';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

const BookingCustomizer = ({ 
  booking,             // ✅ booking object from parent
  onUpdate,            // ✅ callback to update parent when changes saved
  onLiveBalanceChange  // ✅ callback(balance|null) — pushes live remaining balance up to BookingDetails
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
  const [showAllInclusions, setShowAllInclusions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const INCLUSIONS_PREVIEW_COUNT = 5;

  // ── Hotel price info — lifted from HotelCustomizer so the price summary
  //    can reflect pending hotel tier changes before they are saved ──────
  const [hotelPriceInfo, setHotelPriceInfo] = useState(null);
  // hotelPriceInfo shape:
  //   { pricePerNight, numberOfRooms, durationNights,
  //     totalHotelCost, selectedRoomType, savedRoomType, isUnsaved }

  // ── Hotel unsaved state — lifted from HotelCustomizer ─────────
  // true when user picked a new hotel tier but hasn't saved yet
  const [hotelHasUnsaved, setHotelHasUnsaved] = useState(false);

  // ── Refs to call HotelCustomizer save/discard imperatively ────
  const hotelSaveRef    = useRef(null);
  const hotelDiscardRef = useRef(null);

  // ── Unified confirm modal ──────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState({
    isOpen:    false,
    title:     '',
    message:   '',
    type:      'primary',
    onConfirm: null,
  });

  const showConfirm = ({ title, message, type = 'primary', onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  // ─────────────────────────────────────────────────────────────
  // BOOKING DETAILS EDIT STATE
  // ─────────────────────────────────────────────────────────────
  const [isEditingBookingDetails, setIsEditingBookingDetails] = useState(false);
  const [isSavingBookingDetails, setIsSavingBookingDetails] = useState(false);
  const [bookingDetailsForm, setBookingDetailsForm] = useState({
    packageName: '',
    duration: '',
    startDate: '',
    endDate: '',
    paxAdult: 1,
    paxChildren: 0,
    paxInfants: 0,
  });
  const bookingDetailsSnapshotRef = useRef({});

  const hasFetchedRef = useRef(false);
  const currentDestinationRef = useRef('');
  const currentPackageNameRef = useRef('');
  // ✅ FIX: Use a Set keyed by bookingId instead of a flat boolean.
  //    A flat boolean (hasFetchedPackageRef = true) was permanently blocking
  //    re-fetches after onUpdate caused a re-render, leaving inclusions empty.
  const hasFetchedPackageRef = useRef(new Set());
  // ✅ Track which booking ID has already been initialized so that
  //    toggling a checkbox (which triggers a parent re-render and a new
  //    booking object reference) does NOT re-run the init effect and
  //    overwrite the user's in-progress changes.
  //    NOTE: This is intentionally cleared after a successful save so that
  //    the freshly-saved customizedInclusions from the API are loaded in.
  const initializedBookingIdRef = useRef(null);

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

  // ── Emit live remaining balance to BookingDetails ─────────────
  // Runs whenever inclusions or hotel price info changes so the
  // Remaining Balance card in BookingDetails shows a live preview.
  // Only active for PARTIAL_PAID bookings (onLiveBalanceChange is null otherwise).
  useEffect(() => {
    if (!onLiveBalanceChange) return;

    const isPartial = booking?.paymentType === 'partial';
    if (!isPartial) { onLiveBalanceChange(null); return; }

    // For PENDING: backend pre-writes remainingBalance before payment is confirmed,
    // so it is already halved. Use totalAmount for PENDING; trust remainingBalance only for PARTIAL_PAID.
    const _leStatus = (booking?.status || booking?.bookingStatus || '').toUpperCase();
    const _leIsPartialPaid = _leStatus === 'PARTIAL_PAID';
    const currentBalance = _leIsPartialPaid && booking?.remainingBalance > 0
      ? booking.remainingBalance
      : (booking?.totalAmount || booking?.finalPackageTotal || 0);

    // Net inclusion delta vs. what is saved in DB
    const savedInclusions   = booking?.customizedInclusions || [];
    const savedCheckedCost  = savedInclusions
      .filter(inc => inc.isChecked !== false)
      .reduce((sum, inc) => sum + (inc.price || 0), 0);
    const currentCheckedCost = customizedInclusions
      .filter(inc => inc.isChecked)
      .reduce((sum, inc) => sum + (inc.price || 0), 0);
    const netInclusionChange = customizedInclusions.length > 0
      ? currentCheckedCost - savedCheckedCost
      : 0;

    // Hotel delta — only when user picked a different unsaved tier
    const hotelDelta = (() => {
      if (!hotelPriceInfo?.isUnsaved) return 0;
      const getRate = (type) => {
        const t = (type || '').toUpperCase();
        if (t.includes('5')) return 2500;
        if (t.includes('4')) return 1660;
        return 0;
      };
      const norm = (type) =>
        type?.toLowerCase().includes('budget') ? 'Standard' : (type || '');
      const dNights = (() => {
        const m = (booking?.duration || '').match(/(\d+)N/i);
        return m ? parseInt(m[1]) : 1;
      })();
      const pendingCost = hotelPriceInfo.totalHotelCost || 0;
      const savedCost   = getRate(norm(booking?.selectedRoomType || '')) *
                          (booking?.numberOfRooms || hotelPriceInfo.numberOfRooms || 1) *
                          dNights;
      return pendingCost - savedCost;
    })();

    const netChange = netInclusionChange + hotelDelta;
    if (netChange !== 0) {
      onLiveBalanceChange(Math.max(0, currentBalance + netChange));
    } else {
      onLiveBalanceChange(null); // no changes → BookingDetails uses DB value
    }
  }, [
    customizedInclusions, hotelPriceInfo,
    booking?.remainingBalance, booking?.customizedInclusions,
    booking?.paymentType, booking?.selectedRoomType,
    booking?.numberOfRooms, booking?.duration,
    onLiveBalanceChange,
  ]);

  // ✅ API Configuration — see src/config/apiBase.js. Sanitised there so a
  // stale absolute URL in the hosting dashboard cannot produce a cross-origin
  // call that bypasses the Cloudflare Worker.

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
      setError(`Failed to load activities: ${err.message}`);
      setAvailableActivities([]);
      setFilteredActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMatchingRates]);


  // ─────────────────────────────────────────────────────────────
  // FETCH POPULATED BOOKING — PRIORITY 4 FALLBACK
  //
  // When booking.packageId is null (or a raw ObjectId without destination),
  // we fetch the booking by ID from the server which populates packageId.
  // This gives us the real destination even when the prop doesn't have it.
  //
  // After that, if packageId is still null, we fall back to matching all
  // packages by title (fuzzy match so "solo/ joiners" can still find a
  // package if one exists with that name or if the packageName is a qualifier
  // like "solo" and we need to use packageId from the populated booking).
  // ─────────────────────────────────────────────────────────────
  const fetchPackageByTitle = async (packageTitle) => {
    const bookingId = booking?._id || '';
    if (bookingId && hasFetchedPackageRef.current.has(bookingId)) {
      return null;
    }

    // ── STEP 1: Try fetching the booking itself with populate ────────────
    // The GET /api/bookings/:id endpoint populates packageId.
    // If packageId is stored in DB but wasn't populated when the booking
    // was fetched via /api/bookings/user/:email, this will give us the
    // real destination without needing a title match.
    if (bookingId) {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`);
        const data = await res.json();

        if (data?.packageId && typeof data.packageId === 'object' && data.packageId.destination) {
          // Build a synthetic package-like object from the populated data
          const syntheticPkg = {
            _id:         data.packageId._id,
            title:       data.packageId.title || packageTitle,
            destination: data.packageId.destination,
            inclusions:  data.packageId.inclusions || [],
            tourType:    data.packageId.tourType,
            minPax:      data.packageId.minPax,
            duration:    data.packageId.duration,
          };
          if (bookingId) hasFetchedPackageRef.current.add(bookingId);
          setFetchedPackageData(syntheticPkg);
          return syntheticPkg;
        }
      } catch (err) {
      }
    }

    // ── STEP 2: Fallback — search all packages by title (fuzzy match) ───
    // packageTitle might be a qualifier like "solo/ joiners" which won't
    // match exactly. We try exact match first, then partial match.
    if (!packageTitle) return null;

    try {
      
      const response = await fetch(`${API_BASE_URL}/api/packages/all`);
      const data = await response.json();

      if (data.status === 'ok' && data.data) {
        const titleLower = packageTitle.toLowerCase().trim();

        // Exact match first
        let matchedPackage = data.data.find(pkg => 
          pkg.title.toLowerCase().trim() === titleLower
        );

        // Fuzzy: title contains the search term or vice-versa
        if (!matchedPackage) {
          matchedPackage = data.data.find(pkg => {
            const pkgLower = pkg.title.toLowerCase();
            return pkgLower.includes(titleLower) || titleLower.includes(pkgLower);
          });
        }

        if (matchedPackage) {
          if (bookingId) hasFetchedPackageRef.current.add(bookingId);
          setFetchedPackageData(matchedPackage);
          return matchedPackage;
        } else {
          // Mark as attempted so we don't keep re-trying on every re-render
          if (bookingId) hasFetchedPackageRef.current.add(bookingId);
        }
      }

      return null;
    } catch (error) {
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
      return;
    }

    const initializeInclusions = async () => {
      // ── Guard: skip re-initialization if this booking was already loaded ──
      // Without this, every parent re-render (e.g. after toggling a checkbox
      // which calls onUpdate → parent setState) creates a new booking object
      // reference, fires this effect again, and resets the user's changes.
      if (initializedBookingIdRef.current === booking._id) {
        return;
      }
      initializedBookingIdRef.current = booking._id;


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
        return;
      } 
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 2: booking.packageId.inclusions
      // ══════════════════════════════════════════════════════════
      if (booking.packageId && 
          booking.packageId.inclusions && 
          Array.isArray(booking.packageId.inclusions) && 
          booking.packageId.inclusions.length > 0) {
        

        // Show skeleton immediately while prices load
        setCustomizedInclusions(buildSkeleton(booking.packageId.inclusions));

        const destination = getMatchingDestination();
        const matched = await matchWithPrices(booking.packageId.inclusions, destination);
        
        if (matched) {
          setCustomizedInclusions(matched);
        } else {
          // Keep skeleton (already set above)
          setMatchedInclusionCount(0);
        }
        return;
      }
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 3: booking.originalInclusions
      // ══════════════════════════════════════════════════════════
      if (booking.originalInclusions && 
          Array.isArray(booking.originalInclusions) && 
          booking.originalInclusions.length > 0) {
        

        // Show skeleton immediately while prices load
        setCustomizedInclusions(buildSkeleton(booking.originalInclusions));

        const destination = getMatchingDestination();
        const matched = await matchWithPrices(booking.originalInclusions, destination);

        if (matched) {
          setCustomizedInclusions(matched);
        } else {
          setMatchedInclusionCount(0);
        }
        return;
      }
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 4: FETCH PACKAGE BY TITLE (last-resort fallback)
      // ══════════════════════════════════════════════════════════
      if (booking.packageName) {
        const fetchedPackage = await fetchPackageByTitle(booking.packageName);
        
        if (fetchedPackage && fetchedPackage.inclusions && fetchedPackage.inclusions.length > 0) {

          // Show skeleton immediately while prices load
          setCustomizedInclusions(buildSkeleton(fetchedPackage.inclusions));

          const destination = getMatchingDestination(fetchedPackage);
          const matched = await matchWithPrices(fetchedPackage.inclusions, destination, fetchedPackage);

          if (matched) {
            setCustomizedInclusions(matched);
          } else {
            setMatchedInclusionCount(0);
          }
          return;
        }
      }
      
      // ══════════════════════════════════════════════════════════
      // PRIORITY 5: EMPTY STATE
      // ══════════════════════════════════════════════════════════
      setCustomizedInclusions([]);
      setMatchedInclusionCount(0);
    };

    initializeInclusions();
  }, [booking?._id, fetchMatchingRates]);

  // ─────────────────────────────────────────────────────────────
  // DESTINATION RESOLUTION EFFECT
  //
  // This runs INDEPENDENTLY of the inclusions-init effect above.
  // Problem: when a booking already has customizedInclusions (Priority 1),
  // initializeInclusions() returns early — fetchPackageByTitle is never
  // called — so fetchedPackageData stays null — so isDestinationSupported
  // stays false — so the entire component returns null even though the
  // booking has valid inclusions AND a valid destination on the server.
  //
  // Fix: always attempt to resolve destination via GET /api/bookings/:id
  // whenever packageId is null (or not an object with a destination).
  // This is a lightweight single fetch that only fires when needed, and is
  // completely separate from the inclusions logic.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!booking?._id) return;

    // If we already have a destination from any source, no need to fetch
    const alreadyHasDestination =
      (booking.packageId && typeof booking.packageId === 'object' && booking.packageId.destination) ||
      booking.destination ||
      fetchedPackageData?.destination;

    if (alreadyHasDestination) return;

    // Destination is unknown — fetch the populated booking to resolve it
    const resolveDestination = async () => {
      const bookingId = booking._id;

      // Guard: only fetch once per booking ID
      if (hasFetchedPackageRef.current.has(bookingId)) return;


      try {
        const res  = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`);
        const data = await res.json();

        if (data?.packageId && typeof data.packageId === 'object' && data.packageId.destination) {
          const syntheticPkg = {
            _id:         data.packageId._id,
            title:       data.packageId.title || booking.packageName,
            destination: data.packageId.destination,
            inclusions:  data.packageId.inclusions || [],
            tourType:    data.packageId.tourType,
            minPax:      data.packageId.minPax,
            duration:    data.packageId.duration,
          };
          hasFetchedPackageRef.current.add(bookingId);
          setFetchedPackageData(syntheticPkg);
          return;
        }

        // Server also returned no destination — try package title lookup
        if (booking.packageName) {
          const pkgRes  = await fetch(`${API_BASE_URL}/api/packages/all`);
          const pkgData = await pkgRes.json();

          if (pkgData.status === 'ok' && Array.isArray(pkgData.data)) {
            const titleLower = booking.packageName.toLowerCase().trim();
            let match = pkgData.data.find(p => p.title.toLowerCase().trim() === titleLower);
            if (!match) {
              match = pkgData.data.find(p => {
                const t = p.title.toLowerCase();
                return t.includes(titleLower) || titleLower.includes(t);
              });
            }
            if (match) {
              hasFetchedPackageRef.current.add(bookingId);
              setFetchedPackageData(match);
              return;
            }
          }
        }

        // Nothing found — mark as attempted so we do not retry endlessly
        hasFetchedPackageRef.current.add(bookingId);

      } catch (err) {
        hasFetchedPackageRef.current.add(bookingId);
      }
    };

    resolveDestination();
  // Re-run only when booking ID changes or if fetchedPackageData becomes available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?._id, fetchedPackageData?.destination]);

  // ✅ FIX: Derive stable primitive dep values so this effect does NOT fire on every
  //    parent re-render. Previously [booking, fetchSellerRates] was used — booking is
  //    a new object reference each time the parent calls setSelectedInquiry (e.g. after
  //    onUpdate), which caused the effect to fire endlessly and created an infinite loop.
  //    Now we only re-run when the actual destination / packageName strings change.
  //    fetchedPackageData?.destination is included so that when packageId is null and
  //    the package title lookup resolves, the "Add More" panel also loads correctly.
  const _effectDestination =
    booking?.packageId?.destination ||
    fetchedPackageData?.destination  ||
    booking?.destination            ||
    booking?.packageName            ||
    '';
  const _effectPackageName = booking?.packageName || '';

  // Fetch seller rates for "Add More" panel when booking destination changes
  useEffect(() => {
    if (!booking) return;

    const packageDestination = _effectDestination || 'Unknown Destination';
    const packageName        = _effectPackageName;


    // Skip if same destination + package (guard against spurious re-renders)
    if (currentDestinationRef.current === packageDestination &&
        currentPackageNameRef.current === packageName) {
      return;
    }

    currentDestinationRef.current = packageDestination;
    currentPackageNameRef.current = packageName;

    fetchSellerRates(packageDestination);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_effectDestination, _effectPackageName, fetchSellerRates]);

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
      
      if (onUpdate) {
        // ✅ Preserve the original populated packageId so the destination check
        // (isDestinationSupported) continues to work. The /customization endpoint
        // now populates packageId, but we merge anyway as a safety net.
        const bookingData = updatedBooking.booking;
        const isPopulated = bookingData?.packageId && typeof bookingData.packageId === 'object' && bookingData.packageId.destination;
        const merged = isPopulated ? bookingData : { ...bookingData, packageId: booking.packageId };

        // ✅ FIX: Allow the init effect to re-run ONCE after save so the newly-saved
        //    customizedInclusions from the API response are loaded into local state.
        //    Without this, initializedBookingIdRef still matches the booking _id and
        //    the init effect skips — leaving the component showing stale/empty inclusions.
        //    We only clear the flag AFTER we have a valid saved payload to prevent
        //    the infinite-loop scenario where clearing it on every onUpdate call causes
        //    an endless re-init cycle.
        initializedBookingIdRef.current = null;

        onUpdate(merged);
      }
      setHasUnsavedChanges(false);
      
    } catch (error) {
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
      setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const removeInclusion = (id) => {
    setCustomizedInclusions(prev => prev.filter(inc => inc.id !== id));
    setHasUnsavedChanges(true);
  };

  const resetCustomization = async () => {
    
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
    setHasUnsavedChanges(false);
    // ✅ FIX: Do NOT clear initializedBookingIdRef here before saving.
    //    handleSaveCustomization already clears it after a successful save,
    //    which is the correct moment to allow a single re-init with the
    //    fresh API response. Clearing it here (before save) caused an
    //    extra unwanted re-init cycle triggered by the setCustomizedInclusions
    //    call above re-rendering the component.
    
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPaxLabel = () => {
    if (!booking?.pax) return 'N/A';
    const parts = [];
    if (booking.pax.adult > 0) parts.push(`${booking.pax.adult} Adult${booking.pax.adult > 1 ? 's' : ''}`);
    if (booking.pax.children > 0) parts.push(`${booking.pax.children} Child${booking.pax.children > 1 ? 'ren' : ''}`);
    if (booking.pax.infants > 0) parts.push(`${booking.pax.infants} Infant${booking.pax.infants > 1 ? 's' : ''}`);
    return parts.join(', ') || 'N/A';
  };


  // ─────────────────────────────────────────────────────────────
  // BOOKING DETAILS EDIT HELPERS
  // ─────────────────────────────────────────────────────────────

  const handleStartEditingBookingDetails = () => {
    const snap = {
      packageName: booking?.packageName || '',
      duration: booking?.duration || '',
      startDate: booking?.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : '',
      endDate: booking?.endDate ? new Date(booking.endDate).toISOString().split('T')[0] : '',
      paxAdult: booking?.pax?.adult ?? 1,
      paxChildren: booking?.pax?.children ?? 0,
      paxInfants: booking?.pax?.infants ?? 0,
    };
    bookingDetailsSnapshotRef.current = snap;
    setBookingDetailsForm(snap);
    setIsEditingBookingDetails(true);
  };

  const handleCancelEditingBookingDetails = () => {
    setBookingDetailsForm(bookingDetailsSnapshotRef.current);
    setIsEditingBookingDetails(false);
  };

  const handleSaveBookingDetails = async () => {
    if (!booking?._id) return;
    setIsSavingBookingDetails(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${booking._id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: bookingDetailsForm.packageName,
          duration: bookingDetailsForm.duration,
          startDate: bookingDetailsForm.startDate,
          endDate: bookingDetailsForm.endDate,
          pax: {
            adult: Number(bookingDetailsForm.paxAdult) || 0,
            children: Number(bookingDetailsForm.paxChildren) || 0,
            infants: Number(bookingDetailsForm.paxInfants) || 0,
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to save booking details');
      const data = await response.json();
      if (onUpdate) {
        // ✅ Preserve the original populated packageId as a safety net
        const bookingData = data.booking || data;
        const isPopulated = bookingData?.packageId && typeof bookingData.packageId === 'object' && bookingData.packageId.destination;
        onUpdate(isPopulated ? bookingData : { ...bookingData, packageId: booking.packageId });
      }
      setIsEditingBookingDetails(false);
    } catch (err) {
      setError(`Failed to save booking details: ${err.message}`);
    } finally {
      setIsSavingBookingDetails(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DERIVED VALUES FOR RENDER
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // SUPPORTED DESTINATIONS GUARD
  //
  // BookingCustomizer always renders — HotelCustomizer is visible for ALL
  // destinations. The "Customize Your Package" left panel (inclusions editor)
  // is only shown for Philippine domestic destinations that have seller rates.
  //
  // IMPORTANT: When booking.packageId is null (no populate), the destination
  // is not known until fetchPackageByTitle resolves and sets fetchedPackageData.
  // So we MUST include fetchedPackageData?.destination in both the search string
  // AND the packageDestination display value — otherwise the guard returns null
  // before the async fetch completes, and the component never renders.
  //
  // Because fetchedPackageData is React state, once it's set the component
  // re-renders and the guard re-evaluates with the correct destination. ✅
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

  // Use packageId.destination first (most reliable), then fetched package
  // destination (async — only available after title lookup resolves),
  // then booking.destination, then packageName as last resort.
  const packageDestination =
    booking?.packageId?.destination   ||
    fetchedPackageData?.destination   ||
    booking?.destination              ||
    booking?.packageName              ||
    'Unknown Destination';

  // Build a single lowercase string from ALL possible destination sources.
  // fetchedPackageData?.destination is included so bookings where packageId
  // is null (e.g. packageName = "Solo") still pass the guard once the
  // async package title fetch resolves and sets fetchedPackageData.
  const destinationSearchString = [
    booking?.packageId?.destination,
    fetchedPackageData?.destination,
    booking?.destination,
    booking?.packageName,
  ].filter(Boolean).join(' ').toLowerCase();

  // isDestinationSupported controls ONLY the left panel (inclusions editor).
  // The right panel (HotelCustomizer) is always shown regardless of destination.
  const isDestinationSupported = destinationSearchString.length > 0 &&
    SUPPORTED_DESTINATIONS.some(dest => destinationSearchString.includes(dest));

  // Always render — do NOT return null here.
  // HotelCustomizer must be visible for all bookings/destinations.

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="pc-container">
      {/* ── Unified Confirm Modal ── */}
      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      <div className={`bc-two-col-layout${isDestinationSupported ? '' : ' bc-hotel-only'}`}>
        {/* LEFT — Package Inclusions (only for supported destinations) */}
        {isDestinationSupported && (
          <div className="bc-left-panel">
            <div className="bc-left-content">

      {/* Header */}
      <div className="pc-header">
        <div className="pc-title-row">
          <span className="pc-title-accent" />
          <Package size={22} color="#f97316" className="pc-title-icon" />
          <h2 className="pc-title">Customize Your Package</h2>
        </div>
        <p className="pc-subtitle">
          Personalize your tour by selecting or deselecting inclusions
        </p>
        <div className="pc-destination-badge">
          📍 {extractMainDestination(packageDestination)}
        </div>
        
        {customizedInclusions.length > 0 && matchedInclusionCount > 0 && (
          <div className="pc-pricing-match-banner">
            ✅ {matchedInclusionCount} of {customizedInclusions.length} inclusions have pricing data
          </div>
        )}
      </div>

      {/* Error/Warning Alert */}
      {error && (
        <div className={`pc-error-alert pc-alert-base ${error.includes('⚠️') ? 'pc-alert-warning' : 'pc-alert-error'}`}>
          <AlertCircle
            size={20}
            className={`pc-alert-icon ${error.includes('⚠️') ? 'pc-alert-icon-warning' : 'pc-alert-icon-error'}`}
          />
          <div className="pc-alert-body">
            <strong className="pc-alert-title">
              {error.includes('⚠️') ? 'Validation Warning' : 'Error'}
            </strong>
            <p className="pc-alert-message">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Current Inclusions */}
      <div className="pc-section">
        <div className="pc-section-header">
          <h3 className="pc-section-title">
            <span className="pc-section-accent" />
            Package Inclusions
            {isPricingLoading && (
              <span className="pc-fetching-prices">
                <span className="pc-fetching-dot" />
                Fetching prices…
              </span>
            )}
          </h3>

          <button
            className="pc-reset-btn"
            onClick={resetCustomization}
            title="Reset to original package inclusions"
            disabled={isSaving}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* INCLUSIONS LIST */}
        {customizedInclusions.length > 0 ? (
          <>
            <div className="pc-inclusions-list">
              {(showAllInclusions
                ? customizedInclusions
                : customizedInclusions.slice(0, INCLUSIONS_PREVIEW_COUNT)
              ).map((inclusion) => {
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
                        className={`pc-checkbox ${isLastRemaining ? 'pc-checkbox-not-allowed' : 'pc-checkbox-pointer'}`}
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
                              className="pc-badge pc-badge-required"
                              title="At least one inclusion must remain in your package"
                            >
                              Required
                            </span>
                          )}

                          {!inclusion.isOriginal && (
                            <span className="pc-badge pc-badge-added">
                              Added
                            </span>
                          )}

                          {!inclusion.isChecked && (
                            <span className="pc-badge pc-badge-deselected">
                              Deselected
                            </span>
                          )}
                        </div>


                      </div>
                    </div>

                    <div className="pc-inclusion-actions">
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

            {/* See All / Show Less */}
            {customizedInclusions.length > INCLUSIONS_PREVIEW_COUNT && (
              <button
                onClick={() => setShowAllInclusions(prev => !prev)}
                className="pc-see-all-btn"
              >
                {showAllInclusions ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                    Show Less
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    See All {customizedInclusions.length} Inclusions
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="pc-empty-state">
            <Package size={48} className="pc-empty-state-icon" />
            <p className="pc-empty-state-title">
              No inclusions found for this booking
            </p>
            <p className="pc-empty-state-subtitle">
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

            </div>{/* end bc-left-content */}
          </div>
        )}{/* end isDestinationSupported */}

        {/* RIGHT — Hotel Selection + Price Summary */}
        <div className="bc-right-panel">

          {/* ── Hotel-only mode: split hotel cards (left) + overview/summary (right) ── */}
          {!isDestinationSupported ? (
            <div className="bc-hotel-only-inner">
              {/* Left: Hotel cards */}
              <div className="bc-hotel-only-cards">
                <HotelCustomizer
                  booking={booking}
                  onUpdate={onUpdate}
                  packageDestination={packageDestination}
                  onHotelPriceChange={setHotelPriceInfo}
                  onHasUnsavedChanges={setHotelHasUnsaved}
                  saveRef={hotelSaveRef}
                  discardRef={hotelDiscardRef}
                />
              </div>

              {/* Right: Hotel overview + Price summary + Save bar */}
              <div className="bc-hotel-only-sidebar">
                {/* Merged Hotel Overview + Price Summary card */}
                {(() => {
                  const basePrice    = booking?.totalAmount || 0; // alias so JSX rows below can use basePrice
                  const currentTotal = basePrice;
                  const hotelDelta = (() => {
                    if (!hotelPriceInfo?.isUnsaved) return 0;
                    const getRate = (type) => {
                      const t = (type || '').toUpperCase();
                      if (t.includes('5')) return 2500;
                      if (t.includes('4')) return 1660;
                      return 0;
                    };
                    const norm = (type) =>
                      type?.toLowerCase().includes('budget') ? 'Standard' : (type || '');
                    const dNights = (() => {
                      const m = (booking?.duration || '').match(/(\d+)N/i);
                      return m ? parseInt(m[1]) : 1;
                    })();
                    const pendingCost = hotelPriceInfo.totalHotelCost || 0;
                    const savedCost   = getRate(norm(booking?.selectedRoomType || '')) *
                                        (booking?.numberOfRooms || hotelPriceInfo.numberOfRooms || 1) *
                                        dNights;
                    return pendingCost - savedCost;
                  })();
                  const netChange      = hotelDelta;
                  const newTotal       = Math.max(0, currentTotal + netChange);
                  const hasChanges     = hotelPriceInfo?.isUnsaved && hotelDelta !== 0;
                  const isPartial      = booking?.paymentType === 'partial';
                  // Use totalAmount for PENDING; only trust remainingBalance once PARTIAL_PAID
                  const _hoStatus = (booking?.status || booking?.bookingStatus || '').toUpperCase();
                  const _hoIsPartialPaid = _hoStatus === 'PARTIAL_PAID';
                  const currentBalance = isPartial
                    ? (_hoIsPartialPaid && booking?.remainingBalance > 0
                        ? booking.remainingBalance
                        : (booking?.totalAmount || booking?.finalPackageTotal || 0))
                    : 0;
                  const newBalance     = isPartial
                    ? Math.max(0, currentBalance + netChange)
                    : null;

                  return (
                    <div className="bc-merged-summary">
                      {/* ── Hotel Overview section ── */}
                      {hotelPriceInfo?.selectedRoomType && (
                        <div className="bc-merged-hotel-section">
                          <div className="bc-merged-section-label">
                            <Building2 size={12} /> Hotel Selection
                            {hasChanges && <span className="bc-unsaved-pill bc-unsaved-pill-right">UNSAVED</span>}
                          </div>
                          <div className="bc-hotel-overview-row">
                            <span className="bc-hotel-overview-label">Selected Tier</span>
                            <span className="bc-hotel-overview-value">
                              {hotelPriceInfo.selectedRoomType.type
                                ? (hotelPriceInfo.selectedRoomType.type.toLowerCase().includes('budget')
                                    ? 'Standard'
                                    : hotelPriceInfo.selectedRoomType.type)
                                : '—'}
                              {hotelPriceInfo.isUnsaved && (
                                <span className="bc-hotel-overview-unsaved">unsaved</span>
                              )}
                            </span>
                          </div>
                          {hotelPriceInfo.selectedRoomType.hotelName && (
                            <div className="bc-hotel-overview-row">
                              <span className="bc-hotel-overview-label">Hotel</span>
                              <span className="bc-hotel-overview-value">
                                {hotelPriceInfo.selectedRoomType.hotelName}
                              </span>
                            </div>
                          )}
                          <div className="bc-hotel-overview-row bc-hotel-overview-row-noborder">
                            <span className="bc-hotel-overview-label">Rooms Needed</span>
                            <span className="bc-hotel-overview-value">
                              {hotelPriceInfo.numberOfRooms} room{hotelPriceInfo.numberOfRooms > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ── Divider ── */}
                      <div className="bc-merged-divider" />

                      {/* ── Price Summary section ── */}
                      <div className="bc-merged-price-section">
                        <div className="bc-merged-section-label bc-merged-section-label-hidden">
                          <DollarSign size={12} /> Price Summary
                          {hasChanges && <span className="bc-unsaved-pill bc-unsaved-pill-right">UNSAVED</span>}
                        </div>
                        <div className="bc-price-row">
                          <span>Base Package Price</span>
                          <span className="bc-price-value-bold">₱{basePrice.toLocaleString()}</span>
                        </div>
                        {hasChanges && hotelPriceInfo && (
                          <div className="bc-price-row highlight">
                            <span>
                              Hotel upgrade
                              <span className="bc-price-count bc-price-count-inset">
                                ({hotelPriceInfo.selectedRoomType?.type} · {hotelPriceInfo.numberOfRooms} rm × {hotelPriceInfo.durationNights} nights)
                              </span>
                            </span>
                            <span className="bc-price-added">+₱{(hotelPriceInfo.totalHotelCost || 0).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="bc-price-row total">
                          <span>Updated Total</span>
                          <span className={`bc-price-total ${netChange > 0 ? 'bc-price-total-up' : 'bc-price-total-down'}`}>
                            ₱{newTotal.toLocaleString()}
                            {netChange !== 0 && (
                              <span className={`bc-price-delta ${netChange > 0 ? 'bc-price-delta-up' : 'bc-price-delta-down'}`}>
                                {netChange > 0 ? '+' : ''}₱{netChange.toLocaleString()}
                              </span>
                            )}
                          </span>
                        </div>
                        {isPartial && (
                          <div className="bc-price-row bc-balance-row">
                            <span className="bc-balance-label">Remaining Balance</span>
                            <span className={`bc-balance-value ${
                              hasChanges
                                ? (newBalance < currentBalance ? 'bc-balance-value-down' : newBalance > currentBalance ? 'bc-balance-value-up' : 'bc-balance-value-flat')
                                : 'bc-balance-value-flat'
                            }`}>
                              ₱{(hasChanges ? newBalance : currentBalance).toLocaleString()}
                              {hasChanges && newBalance !== currentBalance && (
                                <span className={`bc-price-delta bc-balance-delta ${newBalance < currentBalance ? 'bc-balance-delta-down' : 'bc-balance-delta-up'}`}>
                                  (was ₱{currentBalance.toLocaleString()})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {!hasChanges && (
                          <p className="bc-price-hint">
                            Change hotel tier on the left to preview price changes.
                          </p>
                        )}
                      </div>

                      {/* ── Save / Discard bar (inside merged card) ── */}
                      {hotelHasUnsaved && (
                        <div className="bc-merged-save-bar">
                          <p className="bc-merged-save-note">Unsaved hotel tier selection</p>
                          <div className="bc-merged-save-btns">
                            <button
                              className="bc-cancel-btn"
                              onClick={() => {
                                showConfirm({
                                  title: 'Discard Changes',
                                  message: 'Are you sure you want to discard your hotel selection change?',
                                  type: 'danger',
                                  onConfirm: () => {
                                    closeConfirm();
                                    if (hotelDiscardRef.current) hotelDiscardRef.current();
                                  },
                                });
                              }}
                              disabled={isSaving}
                            >
                              <XCircle size={13} /> Discard
                            </button>
                            <button
                              className="pc-save-btn"
                              onClick={() => {
                                showConfirm({
                                  title: 'Save Hotel Selection',
                                  message: 'Are you sure you want to save your hotel tier selection?',
                                  type: 'primary',
                                  onConfirm: async () => {
                                    closeConfirm();
                                    if (hotelSaveRef.current) await hotelSaveRef.current();
                                  },
                                });
                              }}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <><div className="pc-spinner" /> Saving...</>
                              ) : (
                                <><CheckCircle size={13} /> Save Changes</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* ── Normal two-col mode: hotel stacked above summary ── */
            <>
          <HotelCustomizer
            booking={booking}
            onUpdate={onUpdate}
            packageDestination={packageDestination}
            onHotelPriceChange={setHotelPriceInfo}
            onHasUnsavedChanges={setHotelHasUnsaved}
            saveRef={hotelSaveRef}
            discardRef={hotelDiscardRef}
          />

          {/* ── LIVE PRICE SUMMARY ── below hotel selector ── */}
          {customizedInclusions.length > 0 && (() => {
            const basePrice = booking?.totalAmount || 0;

            // ── Inclusion changes vs. what's saved in DB ─────────────
            const savedInclusions    = booking?.customizedInclusions || [];
            const savedCheckedCost   = savedInclusions
              .filter(inc => inc.isChecked !== false)
              .reduce((sum, inc) => sum + (inc.price || 0), 0);
            const currentCheckedCost = customizedInclusions
              .filter(inc => inc.isChecked)
              .reduce((sum, inc) => sum + (inc.price || 0), 0);
            const netInclusionChange = customizedInclusions.length > 0
              ? currentCheckedCost - savedCheckedCost
              : 0;

            // For display rows only (deductions / additions badges)
            const deductions = customizedInclusions
              .filter(inc => inc.isOriginal && !inc.isChecked && inc.price > 0)
              .reduce((sum, inc) => sum + inc.price, 0);
            const additions = customizedInclusions
              .filter(inc => !inc.isOriginal && inc.isChecked && inc.price > 0)
              .reduce((sum, inc) => sum + inc.price, 0);

            // ── Hotel delta: pending minus already-saved hotel cost ───
            const hotelDelta = (() => {
              if (!hotelPriceInfo?.isUnsaved) return 0;
              const getRate = (type) => {
                const t = (type || '').toUpperCase();
                if (t.includes('5')) return 2500;
                if (t.includes('4')) return 1660;
                return 0;
              };
              const norm = (type) =>
                type?.toLowerCase().includes('budget') ? 'Standard' : (type || '');
              const dNights = (() => {
                const m = (booking?.duration || '').match(/(\d+)N/i);
                return m ? parseInt(m[1]) : 1;
              })();
              const pendingCost = hotelPriceInfo.totalHotelCost || 0;
              const savedCost   = getRate(norm(booking?.selectedRoomType || '')) *
                                  (booking?.numberOfRooms || hotelPriceInfo.numberOfRooms || 1) *
                                  dNights;
              return pendingCost - savedCost;
            })();

            const netChange           = netInclusionChange + hotelDelta;
            const newTotal            = Math.max(0, basePrice + netChange);
            const hasInclusionChanges = netInclusionChange !== 0;
            const hasHotelChange      = hotelPriceInfo?.isUnsaved && hotelDelta !== 0;
            const hasChanges          = hasInclusionChanges || hasHotelChange;

            const isPartial      = booking?.paymentType === 'partial';
            // For PENDING: backend pre-writes remainingBalance before payment is confirmed,
            // so it is already halved. Use totalAmount for PENDING; trust remainingBalance only for PARTIAL_PAID.
            const _bcBookingStatus = (booking?.status || booking?.bookingStatus || '').toUpperCase();
            const _bcIsPartialPaid = _bcBookingStatus === 'PARTIAL_PAID';
            const currentBalance = isPartial
              ? (_bcIsPartialPaid && booking?.remainingBalance > 0
                  ? booking.remainingBalance
                  : (booking?.totalAmount || booking?.finalPackageTotal || 0))
              : 0;
            // Remaining balance delta mirrors the net price change exactly
            const newBalance     = isPartial
              ? Math.max(0, currentBalance + netChange)
              : null;

            return (
              <div className="bc-price-summary bc-price-summary-right">
                <div className="bc-price-summary-header">
                  <DollarSign size={15} />
                  <span>Price Summary</span>
                  {hasChanges && <span className="bc-unsaved-pill">UNSAVED</span>}
                </div>

                {/* ── Hotel info rows (seamlessly inside price summary) ── */}
                {hotelPriceInfo?.selectedRoomType && (
                  <>
                    <div className="bc-price-row bc-hotel-info-row">
                      <span>Selected Tier</span>
                      <span className="bc-price-value-bold">
                        {hotelPriceInfo.selectedRoomType.type
                          ? (hotelPriceInfo.selectedRoomType.type.toLowerCase().includes('budget')
                              ? 'Standard'
                              : hotelPriceInfo.selectedRoomType.type)
                          : '—'}
                        {hotelPriceInfo.isUnsaved && (
                          <span className="bc-hotel-overview-unsaved bc-hotel-overview-unsaved-inset">unsaved</span>
                        )}
                      </span>
                    </div>
                    {hotelPriceInfo.selectedRoomType.hotelName && (
                      <div className="bc-price-row bc-hotel-info-row">
                        <span>Hotel</span>
                        <span className="bc-price-value-bold">{hotelPriceInfo.selectedRoomType.hotelName}</span>
                      </div>
                    )}
                    <div className="bc-price-row bc-hotel-info-row bc-hotel-info-row-spaced">
                      <span>Rooms Needed</span>
                      <span className="bc-price-value-bold">
                        {hotelPriceInfo.numberOfRooms} room{hotelPriceInfo.numberOfRooms > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="bc-hotel-info-divider" />
                  </>
                )}

                <div className="bc-price-row">
                  <span>Base Package Price</span>
                  <span className="bc-price-value-bold">₱{basePrice.toLocaleString()}</span>
                </div>

                {deductions > 0 && (
                  <div className="bc-price-row bc-discount">
                    <span>
                      Removed inclusions
                      <span className="bc-price-count">
                        ({customizedInclusions.filter(i => i.isOriginal && !i.isChecked && i.price > 0).length})
                      </span>
                    </span>
                    <span className="bc-price-discount">−₱{deductions.toLocaleString()}</span>
                  </div>
                )}

                {additions > 0 && (
                  <div className="bc-price-row highlight">
                    <span>
                      Added inclusions
                      <span className="bc-price-count">
                        ({customizedInclusions.filter(i => !i.isOriginal && i.isChecked && i.price > 0).length})
                      </span>
                    </span>
                    <span className="bc-price-added">+₱{additions.toLocaleString()}</span>
                  </div>
                )}

                {/* ── Hotel tier change row ── */}
                {hasHotelChange && hotelPriceInfo && (
                  <div className="bc-price-row highlight">
                    <span>
                      Hotel upgrade
                      <span className="bc-price-count bc-price-count-inset">
                        ({hotelPriceInfo.selectedRoomType?.type} · {hotelPriceInfo.numberOfRooms} rm × {hotelPriceInfo.durationNights} nights)
                      </span>
                    </span>
                    <span className={hotelDelta >= 0 ? 'bc-price-added' : 'bc-price-discount'}>
                      {hotelDelta >= 0 ? '+' : '−'}₱{Math.abs(hotelDelta).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="bc-price-row total">
                  <span>{hasChanges ? 'Updated Total' : 'Total'}</span>
                  <span className={`bc-price-total ${netChange > 0 ? 'bc-price-total-up' : netChange < 0 ? 'bc-price-total-down' : 'bc-price-total-flat'}`}>
                    ₱{newTotal.toLocaleString()}
                    {netChange !== 0 && (
                      <span className={`bc-price-delta ${netChange > 0 ? 'bc-price-delta-up' : 'bc-price-delta-down'}`}>
                        {netChange > 0 ? '+' : ''}₱{netChange.toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>

                {isPartial && (
                  <div className="bc-price-row bc-balance-row">
                    <span className="bc-balance-label">Remaining Balance</span>
                    <span className={`bc-balance-value ${
                      hasChanges
                        ? (newBalance < currentBalance ? 'bc-balance-value-down' : newBalance > currentBalance ? 'bc-balance-value-up' : 'bc-balance-value-flat')
                        : 'bc-balance-value-flat'
                    }`}>
                      ₱{(hasChanges ? newBalance : currentBalance).toLocaleString()}
                      {hasChanges && newBalance !== currentBalance && (
                        <span className={`bc-price-delta bc-balance-delta ${newBalance < currentBalance ? 'bc-balance-delta-down' : 'bc-balance-delta-up'}`}>
                          (was ₱{currentBalance.toLocaleString()})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {!hasChanges && (
                  <p className="bc-price-hint">
                    Select or deselect inclusions on the left, or change hotel tier above, to preview price changes.
                  </p>
                )}
              </div>
            );
          })()}

          {/* ── UNIFIED SAVE ALL CHANGES BAR ── */}
          {(hasUnsavedChanges || hotelHasUnsaved) && (
            <div className="bc-save-bar bc-save-bar-bottom">
              <p className="bc-save-bar-note">
                {hasUnsavedChanges && hotelHasUnsaved
                  ? 'You have unsaved changes to inclusions and hotel selection.'
                  : hasUnsavedChanges
                  ? 'You have unsaved changes to the inclusions.'
                  : 'You have an unsaved hotel tier selection.'}
              </p>
              <div className="bc-save-bar-btns">
                <button
                  className="bc-cancel-btn"
                  onClick={() => {
                    showConfirm({
                      title:   'Discard Changes',
                      message: 'Are you sure you want to discard all unsaved changes?',
                      type:    'danger',
                      onConfirm: () => {
                        closeConfirm();
                        if (hasUnsavedChanges) {
                          const original = booking?.customizedInclusions;
                          if (original && original.length > 0) {
                            setCustomizedInclusions(original.map((inc, i) => ({
                              id: inc.id || `inc-${i}`,
                              name: inc.name || '',
                              price: typeof inc.price === 'number' ? inc.price : (parseFloat(inc.price) || 0),
                              supplierRate: inc.supplierRate || 0,
                              markup: inc.markup || 0,
                              markupType: inc.markupType || 'fixed',
                              supplier: inc.supplier || 'N/A',
                              destination: inc.destination || '',
                              pax: inc.pax || '',
                              notes: inc.notes || '',
                              isOriginal: inc.isOriginal === true || inc.isOriginal === 'true',
                              isChecked: inc.isChecked === false || inc.isChecked === 'false' ? false : true,
                              source: inc.source || 'package',
                              sellerRateId: inc.sellerRateId || null,
                              matchedActivity: inc.matchedActivity || null,
                              matchedDestination: inc.matchedDestination || null,
                            })));
                          }
                          setHasUnsavedChanges(false);
                          setError('');
                        }
                        if (hotelHasUnsaved && hotelDiscardRef.current) {
                          hotelDiscardRef.current();
                        }
                      },
                    });
                  }}
                  disabled={isSaving}
                >
                  <XCircle size={14} /> Discard All
                </button>

                <button
                  className="pc-save-btn"
                  onClick={() => {
                    const parts = [];
                    if (hasUnsavedChanges) parts.push('package inclusions');
                    if (hotelHasUnsaved)   parts.push('hotel tier selection');
                    const what = parts.join(' and ');
                    showConfirm({
                      title:   'Save All Changes',
                      message: `Are you sure you want to save changes to your ${what}? This will update your booking.`,
                      type:    'primary',
                      onConfirm: async () => {
                        closeConfirm();
                        if (hasUnsavedChanges) await handleSaveCustomization();
                        if (hotelHasUnsaved && hotelSaveRef.current) await hotelSaveRef.current();
                      },
                    });
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><div className="pc-spinner" /> Saving...</>
                  ) : (
                    <><CheckCircle size={14} /> Save All Changes</>
                  )}
                </button>
              </div>
            </div>
          )}
            </>
          )}{/* end normal mode */}

        </div>{/* end bc-right-panel */}

      </div>{/* end bc-two-col-layout */}
    </div>
  );
};

export default BookingCustomizer;