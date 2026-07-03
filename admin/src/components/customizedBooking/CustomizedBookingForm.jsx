// customized/CustomizedBookingForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 4-step booking wizard for fully customized bookings.
//
// Step 1 → Basic Info (destination, contact details, travel dates, pax)
// Step 2 → Select Services (tours and/or transfers filtered by destination)
//           - Asks if they want to also add the other service type
//           - Multiple tours can now be selected
// Step 3 → Service Details
//           - Phase A: scheduled date per selected tour (new)
//           - Phase B: transfer scheduling details per selected transfer
// Step 4 → Summary → submit
//
// Props:
//   isOpen    – boolean
//   onClose   – () => void
//   onSuccess – (booking) => void  (called after successful submit)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, MapPin, User, Phone, Mail, Calendar, Users, ChevronRight, ChevronLeft,
         Car, Compass, Check, Clock, ArrowRight, FileText, CheckCircle, Plus, Trash2,
         CreditCard, Wallet, Mountain, Bus } from 'lucide-react';
import './Customizedbookingform.css';
import CustomTimePicker from '../timePicker/Clock';
import LocationSelect   from '../location/LocationSelect';

const API_BASE = 'https://wanderwaveph.onrender.com';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
};

// ── Transfer pax-based price helper ──────────────────────────────────────────
// Transfers can have a paxPricing array with tiers: [{ minPax, maxPax, oneWayPrice, roundtripPrice }]
// This picks the right tier for the user's pax count, falling back to flat prices.
const getTransferPrice = (transfer, paxCount, type) => {
  const pax = parseInt(paxCount) || 1;
  if (Array.isArray(transfer.paxPricing) && transfer.paxPricing.length > 0) {
    const sorted = [...transfer.paxPricing].sort((a, b) => (a.minPax || 0) - (b.minPax || 0));
    const tier   = sorted.find(p => pax >= (p.minPax || 1) && pax <= (p.maxPax ?? Infinity));
    const used   = tier || sorted[sorted.length - 1]; // if pax exceeds all tiers, use highest
    return type === 'roundtrip'
      ? (used.roundtripPrice || used.oneWayPrice || 0)
      : (used.oneWayPrice || 0);
  }
  return type === 'roundtrip' ? (transfer.roundtripPrice || 0) : (transfer.oneWayPrice || 0);
};

// ── Night-hour surcharge helper ───────────────────────────────────────────────
// Returns true if timeStr (HH:MM) falls between 12:00 AM (00:00) and 5:00 AM (05:00) inclusive.
const isNightHour = (timeStr) => {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const totalMin = h * 60 + (m || 0);
  return totalMin <= 300; // 0:00–5:00 AM → 0–300 minutes
};

const NIGHT_SURCHARGE_AMOUNT = 500;

// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Basic Info',   icon: User },
  { id: 2, label: 'Services',     icon: Compass },
  { id: 3, label: 'Details',      icon: FileText },
  { id: 4, label: 'Summary',      icon: CheckCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function CustomizedBookingForm({ isOpen, onClose, onSuccess, bookingMode = 'assist' }) {
  const isWalkinBooking = bookingMode === 'walkin';
  // ── Step ───────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const formRef = useRef(null);

  // ── Step 1 – Basic Info ────────────────────────────────────────────────────
  const [info, setInfo] = useState({
    destination: '',
    fullName:    '',
    email:       '',
    phone:       '',
    birthDate:   '',
    travelDate:  '',
    returnDate:  '',
    paxCount:    '',
    message:     '',
  });
  const [infoErrors, setInfoErrors] = useState({});

  // ── Destination autocomplete ───────────────────────────────────────────────
  const [allDestinations,   setAllDestinations]   = useState([]);
  const [showDestDropdown,  setShowDestDropdown]  = useState(false);

  // ── Step 2 – Service Lists ─────────────────────────────────────────────────
  const [availableTours,     setAvailableTours]     = useState([]);
  const [availableTransfers, setAvailableTransfers] = useState([]);
  const [fetchingServices,   setFetchingServices]   = useState(false);
  const [activeTab,          setActiveTab]          = useState('tours');

  const [selectedTours,     setSelectedTours]     = useState([]);
  const [selectedTransfers, setSelectedTransfers] = useState([]);
  // { [transferId]: 'oneway' | 'roundtrip' }
  const [transferTypes,     setTransferTypes]     = useState({});

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'partial'

  // Reset to full payment if travel date is today or tomorrow and partial was selected
  useEffect(() => {
    if (!isPartialPaymentAllowed && paymentType === 'partial') {
      setPaymentType('full');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.travelDate]);

  // ── Night charge confirmation modal ───────────────────────────────────────
  // null | { field: 'arrivalTime' | 'departureTime', pendingValue: string }
  const [nightChargeModal, setNightChargeModal] = useState(null);

  // ── Step 3 – Tour Scheduled Dates (NEW) ───────────────────────────────────
  // { [tourId]: 'YYYY-MM-DD' } — one scheduled date per selected tour
  const [tourDates,       setTourDates]       = useState({});
  // Index into selectedTours of which tour we're currently collecting a date for
  const [tourDateIdx,     setTourDateIdx]     = useState(0);
  // The date picker value for the current tour in step 3
  const [currentTourDate, setCurrentTourDate] = useState('');
  // Which phase of step 3 we're in: 'tours' (collect dates) | 'transfers' (collect details)
  const [step3Phase,      setStep3Phase]      = useState('tours');

  // ── Step 3 – Transfer Details ──────────────────────────────────────────────
  // Index into selectedTransfers of which one we're currently filling
  const [detailsIdx, setDetailsIdx] = useState(0);
  // { [transferId]: { arrivalTime, departureTime, pickupLocation, dropoffLocation, message } }
  const [detailsMap, setDetailsMap] = useState({});
  const [detailForm, setDetailForm] = useState({
    arrivalTime: '', departureTime: '',
    pickupLocation: '', dropoffLocation: '', message: '',
  });

  // ─── Reset when modal closes ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setInfo({ destination:'', fullName:'', email:'', phone:'', birthDate:'', travelDate:'', returnDate:'', paxCount:'', message:'' });
      setInfoErrors({});
      setShowDestDropdown(false);
      setActiveTab('tours');
      setSelectedTours([]); setSelectedTransfers([]); setTransferTypes({});
      setTourDates({}); setTourDateIdx(0); setCurrentTourDate(''); setStep3Phase('tours');
      setDetailsIdx(0); setDetailsMap({}); setDetailForm({ arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
      setSubmitError('');
      setPaymentType('full');
      setNightChargeModal(null);
      lastFetchedPax.current  = null;
      lastFetchedDest.current = null;
    }
  }, [isOpen]);

  // ─── Scroll to top on step change ─────────────────────────────────────────
  useEffect(() => {
    if (formRef.current) formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // ── Fetch all destinations for autocomplete ───────────────────────────────
  useEffect(() => {
    const fetchAllDestinations = async () => {
      try {
        const [toursRes, transfersRes] = await Promise.all([
          fetch(`${API_BASE}/api/tours/all`),
          fetch(`${API_BASE}/api/transfers?all=true`),
        ]);
        const toursData     = await toursRes.json();
        const transfersData = await transfersRes.json();
        const allTours     = toursData.data || toursData.tours || (Array.isArray(toursData) ? toursData : []);
        const allTransfers = transfersData.data || [];

        // Case-insensitive dedup: Map<lowercase, TitleCase>
        const toTitleCase = (s) => s.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const seen = new Map();
        const add = (raw) => {
          const key = raw.trim().toLowerCase();
          if (key && !seen.has(key)) seen.set(key, toTitleCase(raw.trim()));
        };
        allTours.filter(t => t.isArchive !== 'Yes').forEach(t => {
          if (t.destination) add(t.destination.split(',')[0]);
        });
        allTransfers.filter(t => t.isActive).forEach(t => {
          if (t.packageDestination) add(t.packageDestination.split(',')[0]);
        });
        setAllDestinations([...seen.values()].sort());
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    };
    if (isOpen) fetchAllDestinations();
  }, [isOpen]);
  // Track what was used for the last fetch so we re-fetch on back-navigation changes
  const lastFetchedPax  = useRef(null);
  const lastFetchedDest = useRef(null);

  useEffect(() => {
    if (step !== 2) return;
    // Re-fetch if: first time on step 2, OR paxCount/destination changed since last fetch
    if (
      lastFetchedPax.current  !== info.paxCount ||
      lastFetchedDest.current !== info.destination
    ) {
      fetchServices();
    }
  }, [step, info.paxCount, info.destination]);

  const fetchServices = async () => {
    setFetchingServices(true);
    try {
      const normalise = (s) => (s||'').toLowerCase().replace(/[^a-z0-9]/g,' ').trim().replace(/\s+/g,' ');
      const normDest = normalise((info.destination||'').split(',')[0]);
      const kw       = (info.destination||'').split(',')[0].trim().toLowerCase();

      const [toursRes, transfersRes] = await Promise.all([
        fetch(`${API_BASE}/api/tours/all`),
        fetch(`${API_BASE}/api/transfers?all=true`),
      ]);

      const toursData     = await toursRes.json();
      const transfersData = await transfersRes.json();

      const allTours = toursData.data || toursData.tours || (Array.isArray(toursData) ? toursData : []);
      const allTransfers = transfersData.data || [];

      const filteredTours = info.destination
        ? allTours.filter(t => {
            if (t.isArchive === 'Yes') return false;
            const nd = normalise((t.destination||'').split(',')[0]);
            return nd.includes(normDest) || normDest.includes(nd);
          })
        : allTours.filter(t => t.isArchive !== 'Yes');

      const userPax = parseInt(info.paxCount) || 0;
      const paxFits = (t) => !t.pax || !userPax || t.pax >= userPax;

      const filteredTransfers = info.destination
        ? allTransfers.filter(t => {
            if (!t.isActive) return false;
            if (!paxFits(t)) return false;
            if (!t.packageDestination) return true;
            const td = (t.packageDestination||'').toLowerCase().split(',')[0].trim();
            return td.includes(kw) || kw.includes(td);
          })
        : allTransfers.filter(t => t.isActive && paxFits(t));

      setAvailableTours(filteredTours);
      setAvailableTransfers(filteredTransfers);

      // Record what was used for this fetch
      lastFetchedPax.current  = info.paxCount;
      lastFetchedDest.current = info.destination;

      // Drop selected tours that no longer belong to the new destination
      const filteredTourIds = new Set(filteredTours.map(t => t._id));
      setSelectedTours(prev => {
        const stillValid = prev.filter(t => filteredTourIds.has(t._id));
        const removedIds = prev.filter(t => !filteredTourIds.has(t._id)).map(t => t._id);
        if (removedIds.length > 0) {
          setTourDates(ptd => { const n = {...ptd}; removedIds.forEach(id => delete n[id]); return n; });
        }
        return stillValid;
      });

      // Drop selected transfers that no longer fit destination OR pax
      const filteredTransferIds = new Set(filteredTransfers.map(t => t._id));
      setSelectedTransfers(prev => {
        const stillValid = prev.filter(t => filteredTransferIds.has(t._id));
        const removedIds = prev.filter(t => !filteredTransferIds.has(t._id)).map(t => t._id);
        if (removedIds.length > 0) {
          setTransferTypes(pt => { const n = {...pt}; removedIds.forEach(id => delete n[id]); return n; });
          setDetailsMap(pd => { const n = {...pd}; removedIds.forEach(id => delete n[id]); return n; });
        }
        return stillValid;
      });
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setFetchingServices(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Computed values
  // ─────────────────────────────────────────────────────────────────────────
  const pax = parseInt(info.paxCount) || 0;
  const toursTotal = selectedTours.reduce((s, t) => s + (t.price || 0) * pax, 0);
  const transfersTotal = selectedTransfers.reduce((s, t) => {
    const type  = transferTypes[t._id] || 'oneway';
    return s + (type === 'roundtrip' ? (t.roundtripPrice||0) : (t.oneWayPrice||0));
  }, 0);

  // Night surcharge: ₱500 per time field (arrivalTime / departureTime) that falls within 12AM–5AM
  const nightSurcharge = Object.entries(detailsMap).reduce((total, [transferId, details]) => {
    let charge = 0;
    if (isNightHour(details.arrivalTime)) charge += NIGHT_SURCHARGE_AMOUNT;
    const type = transferTypes[transferId] || 'oneway';
    if (type === 'roundtrip' && isNightHour(details.departureTime)) charge += NIGHT_SURCHARGE_AMOUNT;
    return total + charge;
  }, 0);

  const grandTotal = toursTotal + transfersTotal + nightSurcharge;
  const partialAmount = Math.ceil(grandTotal * 0.5);

  // Partial payment is NOT allowed if travel date is today or tomorrow
  const isPartialPaymentAllowed = (() => {
    if (!info.travelDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const travel = new Date(info.travelDate + 'T00:00:00');
    return travel > tomorrow;
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 validation
  // ─────────────────────────────────────────────────────────────────────────
  const validateInfo = () => {
    const errs = {};
    if (!info.destination.trim()) errs.destination = 'Destination is required.';
    if (!info.fullName.trim())    errs.fullName    = 'Full name is required.';
    if (!info.email.trim())       errs.email       = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errs.email = 'Enter a valid email.';
    if (!info.birthDate) {
      errs.birthDate = 'Date of birth is required.';
    } else {
      const birth = new Date(info.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const md = today.getMonth() - birth.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 18) errs.birthDate = 'Primary booker must be at least 18 years old.';
      else if (age > 100) errs.birthDate = 'Age cannot exceed 100 years.';
    }
    if (!info.travelDate)         errs.travelDate  = 'Travel date is required.';
    if (info.returnDate && info.travelDate && info.returnDate <= info.travelDate)
      errs.returnDate = 'Return date must be after the travel date.';
    if (!info.paxCount || parseInt(info.paxCount) < 1) errs.paxCount = 'At least 1 passenger required.';
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 1) {
      if (!validateInfo()) return;
      setStep(2);
    } else if (step === 2) {
      if (selectedTours.length > 0) {
        setStep3Phase('tours');
        setTourDateIdx(0);
        setCurrentTourDate(tourDates[selectedTours[0]._id] || '');
      } else {
        setStep3Phase('transfers');
        setDetailsIdx(0);
        const first = selectedTransfers[0];
        setDetailForm(detailsMap[first._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
      }
      setStep(3);
    } else if (step === 3) {
      if (step3Phase === 'tours') {
        // Save current tour's date
        const currentTour = selectedTours[tourDateIdx];
        if (currentTour) {
          setTourDates(prev => ({ ...prev, [currentTour._id]: currentTourDate }));
        }
        if (tourDateIdx < selectedTours.length - 1) {
          // Move to next tour
          const nextTour = selectedTours[tourDateIdx + 1];
          setTourDateIdx(tourDateIdx + 1);
          setCurrentTourDate(tourDates[nextTour._id] || '');
        } else if (selectedTransfers.length > 0) {
          // Done with tours — move to transfer details phase
          setStep3Phase('transfers');
          setDetailsIdx(0);
          const first = selectedTransfers[0];
          setDetailForm(detailsMap[first._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
        } else {
          // No transfers — go straight to summary
          setStep(4);
        }
      } else {
        // transfers phase (existing logic)
        saveCurrentDetail();
        if (detailsIdx < selectedTransfers.length - 1) {
          const next = selectedTransfers[detailsIdx + 1];
          setDetailsIdx(detailsIdx + 1);
          setDetailForm(detailsMap[next._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
        } else {
          setStep(4);
        }
      }
    }
  };

  const returnToStep2 = () => setStep(2);

  const goBack = () => {
    if (step === 2) {
      setStep(1);
    }
    else if (step === 3) {
      if (step3Phase === 'tours') {
        if (tourDateIdx > 0) {
          // Save current tour date before going back
          const currentTour = selectedTours[tourDateIdx];
          if (currentTour) setTourDates(prev => ({ ...prev, [currentTour._id]: currentTourDate }));
          const prevTour = selectedTours[tourDateIdx - 1];
          setTourDateIdx(tourDateIdx - 1);
          setCurrentTourDate(tourDates[prevTour._id] || '');
        } else {
          returnToStep2();
        }
      } else {
        // transfers phase
        if (detailsIdx > 0) {
          saveCurrentDetail();
          const prev = selectedTransfers[detailsIdx - 1];
          setDetailsIdx(detailsIdx - 1);
          setDetailForm(detailsMap[prev._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
        } else if (selectedTours.length > 0) {
          // Go back to last tour date
          saveCurrentDetail();
          setStep3Phase('tours');
          const lastTour = selectedTours[selectedTours.length - 1];
          setTourDateIdx(selectedTours.length - 1);
          setCurrentTourDate(tourDates[lastTour._id] || '');
        } else {
          returnToStep2();
        }
      }
    }
    else if (step === 4) {
      if (selectedTransfers.length > 0) {
        setStep(3);
        setStep3Phase('transfers');
        const last = selectedTransfers[selectedTransfers.length - 1];
        setDetailsIdx(selectedTransfers.length - 1);
        setDetailForm(detailsMap[last._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
      } else if (selectedTours.length > 0) {
        setStep(3);
        setStep3Phase('tours');
        const lastTour = selectedTours[selectedTours.length - 1];
        setTourDateIdx(selectedTours.length - 1);
        setCurrentTourDate(tourDates[lastTour._id] || '');
      } else {
        returnToStep2();
      }
    }
  };

  const saveCurrentDetail = () => {
    const t = selectedTransfers[detailsIdx];
    if (t) {
      setDetailsMap(prev => ({ ...prev, [t._id]: { ...detailForm } }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Service toggles
  // ─────────────────────────────────────────────────────────────────────────
  // Multiple tours allowed — clicking a selected tour deselects it;
  // clicking an unselected tour adds it to the selection.
  const toggleTour = (tour) => {
    const isCurrentlySelected = selectedTours.some(t => t._id === tour._id);
    if (isCurrentlySelected) {
      const remaining = selectedTours.filter(t => t._id !== tour._id);
      setSelectedTours(remaining);
      setTourDates(prev => { const n = {...prev}; delete n[tour._id]; return n; });
    } else {
      setSelectedTours(prev => [...prev, tour]);
    }
  };

  const toggleTransfer = (transfer) => {
    const isSelected = selectedTransfers.some(t => t._id === transfer._id);
    if (isSelected) {
      const remaining = selectedTransfers.filter(t => t._id !== transfer._id);
      setSelectedTransfers(remaining);
      setTransferTypes(prev => { const n = {...prev}; delete n[transfer._id]; return n; });
      setDetailsMap(prev => { const n = {...prev}; delete n[transfer._id]; return n; });
    } else {
      setSelectedTransfers(prev => [...prev, transfer]);
      if (!transferTypes[transfer._id]) {
        setTransferTypes(prev => ({ ...prev, [transfer._id]: 'oneway' }));
      }
    }
  };

  const setTransferType = (transferId, type) => {
    setTransferTypes(prev => ({ ...prev, [transferId]: type }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3 validation
  // ─────────────────────────────────────────────────────────────────────────
  const currentTransfer  = selectedTransfers[detailsIdx];
  const isRoundtrip      = currentTransfer && transferTypes[currentTransfer._id] === 'roundtrip';
  const detailValid =
    detailForm.arrivalTime &&
    detailForm.pickupLocation &&
    (!isRoundtrip || (detailForm.departureTime && detailForm.dropoffLocation));

  const tourDateValid = !!currentTourDate;

  // Next button label for step 3
  const step3NextLabel = () => {
    if (step3Phase === 'tours') {
      if (tourDateIdx < selectedTours.length - 1)
        return `Next Tour (${tourDateIdx + 2}/${selectedTours.length})`;
      if (selectedTransfers.length > 0)
        return 'Next: Transfer Details';
      return 'Review Summary';
    } else {
      if (detailsIdx < selectedTransfers.length - 1)
        return `Next Transfer (${detailsIdx + 2}/${selectedTransfers.length})`;
      return 'Review Summary';
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');

    // Build transfer snapshots with detail maps
    const transferSnapshots = selectedTransfers.map(t => {
      const type     = transferTypes[t._id] || 'oneway';
      const details  = detailsMap[t._id] || {};
      const price    = type === 'roundtrip' ? (t.roundtripPrice||0) : (t.oneWayPrice||0);
      return {
        transferId:      t._id,
        title:           t.title,
        category:        t.category || '',
        imageUrl:        t.imageUrl || null,
        transferType:    type,
        oneWayPrice:     t.oneWayPrice    || 0,
        roundtripPrice:  t.roundtripPrice || 0,
        selectedPrice:   price,
        subtotal:        price,
        travelDate:      info.travelDate,
        returnDate:      type === 'roundtrip' ? info.returnDate : '',
        arrivalTime:     details.arrivalTime     || '',
        departureTime:   type === 'roundtrip' ? (details.departureTime || '') : '',
        pickupLocation:  details.pickupLocation  || '',
        dropoffLocation: type === 'roundtrip' ? (details.dropoffLocation || '') : '',
        message:         details.message         || '',
        passengerCount:  info.paxCount,
      };
    });

    const tourSnapshots = selectedTours.map(t => ({
      tourId:        t._id,
      title:         t.title || t.name,
      destination:   t.destination || '',
      duration:      t.duration    || '',
      category:      t.category    || '',
      imageUrl:      t.imageUrl    || t.image || null,
      price:         t.price       || 0,
      sellerPrice:   t.sellerPrice || 0,
      paxCount:      info.paxCount,
      subtotal:      (t.price||0) * info.paxCount,
      scheduledDate: tourDates[t._id] || '',   // ← per-tour scheduled date
    }));

    const amountToPay = paymentType === 'partial' ? partialAmount : grandTotal;

    const payload = {
      ...info,
      createdByType: 'sales',
      isWalkin: isWalkinBooking,
      tours:        tourSnapshots,
      transfers:    transferSnapshots,
      toursTotal,
      transfersTotal,
      totalAmount:  grandTotal,   // already includes nightSurcharge
      nightSurcharge,
      paymentType,
      initialPaymentAmount: amountToPay,
      remainingBalance: paymentType === 'partial' ? grandTotal - partialAmount : 0,
    };

    try {
      // ── Step 1: Save the customized booking ──────────────────────────────
      const res  = await fetch(`${API_BASE}/api/customized-bookings`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Booking failed.');

      const bookingId = data.bookingId || data.data?._id;
      if (!bookingId) throw new Error('Booking created but no ID returned. Please contact support.');

      // ── Step 2: Create PayMongo checkout session ─────────────────────────
      const paymentRes = await fetch(`${API_BASE}/api/payment/create-intent`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentType,
          paymentAmount: amountToPay,
          bookingSource: 'customized',
        }),
      });
      const paymentData = await paymentRes.json();

      if (paymentData.success && paymentData.checkoutUrl) {
        if (paymentData.checkoutSessionId) {
          sessionStorage.setItem('pendingCheckoutSessionId', paymentData.checkoutSessionId);
        }
        onSuccess?.(data);
        window.location.href = paymentData.checkoutUrl;
      } else {
        throw new Error(paymentData.message || 'No checkout URL returned.');
      }

    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // Step label helpers
  // ─────────────────────────────────────────────────────────────────────────
  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="cbf-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="cbf-modal">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="cbf-header">
          <button className="cbf-close-btn" onClick={onClose} type="button"><X size={16}/></button>
          <div className="cbf-header-content">
            <div className="cbf-header-icon">✈️</div>
            <h2 className="cbf-header-title">Build Your Custom Trip</h2>
            <p className="cbf-header-sub">Mix tours &amp; transfers to craft your perfect itinerary</p>
          </div>

          {/* Step indicators */}
          <div className="cbf-steps">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`cbf-step ${step >= s.id ? 'active' : ''} ${step === s.id ? 'current' : ''}`}>
                  <div className="cbf-step-dot">
                    {step > s.id ? <Check size={10}/> : <s.icon size={10}/>}
                  </div>
                  <span className="cbf-step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`cbf-step-line ${step > s.id ? 'active' : ''}`}/>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Progress bar */}
          <div className="cbf-progress-bar-wrap">
            <div className="cbf-progress-bar-fill" style={{ width: `${progressPct}%` }}/>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="cbf-body" ref={formRef}>

          {/* ════════════════════════════════════════════════════════════════
              STEP 1 — BASIC INFO
              ════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="cbf-section">
              <div className="cbf-section-title">
                <MapPin size={16}/> Where do you want to go?
              </div>

              <div className="cbf-form-grid">
                {/* Destination */}
                <div className="cbf-field cbf-full" style={{ position: 'relative' }}>
                  <label>Destination <span className="cbf-req">*</span></label>
                  <div className="cbf-input-wrap">
                    <MapPin size={14} className="cbf-input-icon"/>
                    <input
                      className={infoErrors.destination ? 'cbf-error' : ''}
                      placeholder="e.g. Palawan, Cebu, Boracay"
                      value={info.destination}
                      autoComplete="off"
                      onChange={e => {
                        setInfo(p => ({...p, destination: e.target.value}));
                        setShowDestDropdown(true);
                      }}
                      onFocus={() => setShowDestDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDestDropdown(false), 150)}
                    />
                  </div>
                  {/* Autocomplete dropdown */}
                  {showDestDropdown && info.destination.trim() && (() => {
                    const q = info.destination.toLowerCase();
                    const matches = allDestinations.filter(d => d.toLowerCase().includes(q));
                    return matches.length > 0 ? (
                      <div className="cbf-dest-dropdown">
                        {matches.map(d => (
                          <button
                            key={d}
                            type="button"
                            className="cbf-dest-option"
                            onMouseDown={() => {
                              setInfo(p => ({...p, destination: d}));
                              setShowDestDropdown(false);
                            }}
                          >
                            <MapPin size={12}/> {d}
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  {infoErrors.destination && <span className="cbf-err-msg">{infoErrors.destination}</span>}
                </div>

                {/* Full Name */}
                <div className="cbf-field">
                  <label>Full Name <span className="cbf-req">*</span></label>
                  <div className="cbf-input-wrap">
                    <User size={14} className="cbf-input-icon"/>
                    <input
                      className={infoErrors.fullName ? 'cbf-error' : ''}
                      placeholder="Juan dela Cruz"
                      value={info.fullName}
                      onChange={e => setInfo(p => ({...p, fullName: e.target.value}))}
                    />
                  </div>
                  {infoErrors.fullName && <span className="cbf-err-msg">{infoErrors.fullName}</span>}
                </div>

                {/* Email */}
                <div className="cbf-field">
                  <label>Email Address <span className="cbf-req">*</span></label>
                  <div className="cbf-input-wrap">
                    <Mail size={14} className="cbf-input-icon"/>
                    <input
                      type="email"
                      className={infoErrors.email ? 'cbf-error' : ''}
                      placeholder="juan@email.com"
                      value={info.email}
                      onChange={e => setInfo(p => ({...p, email: e.target.value}))}
                    />
                  </div>
                  {infoErrors.email && <span className="cbf-err-msg">{infoErrors.email}</span>}
                </div>

                {/* Phone */}
                <div className="cbf-field">
                  <label>Phone Number</label>
                  <div className="cbf-input-wrap">
                    <Phone size={14} className="cbf-input-icon"/>
                    <input
                      placeholder="+63 9XX XXX XXXX"
                      value={info.phone}
                      onChange={e => setInfo(p => ({...p, phone: e.target.value}))}
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="cbf-field">
                  <label>Date of Birth <span className="cbf-req">*</span></label>
                  <div className="cbf-input-wrap">
                    <input
                      type="date"
                      className={infoErrors.birthDate ? 'cbf-error' : ''}
                      value={info.birthDate || ''}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setInfo(p => ({...p, birthDate: e.target.value}))}
                    />
                  </div>
                  {infoErrors.birthDate && <span className="cbf-err-msg">{infoErrors.birthDate}</span>}
                </div>

                {/* Travel Date */}
                <div className="cbf-field">
                  <label>Travel Date <span className="cbf-req">*</span></label>
                  <DatePicker
                    value={info.travelDate}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={val => setInfo(p => ({...p, travelDate: val, returnDate: p.returnDate && p.returnDate < val ? '' : p.returnDate}))}
                    hasError={!!infoErrors.travelDate}
                    placeholder="Select travel date"
                  />
                  {infoErrors.travelDate && <span className="cbf-err-msg">{infoErrors.travelDate}</span>}
                </div>

                {/* Return Date */}
                <div className="cbf-field">
                  <label>Return Date <span className="cbf-optional">(optional)</span></label>
                  <DatePicker
                    value={info.returnDate}
                    minDate={info.travelDate || new Date().toISOString().split('T')[0]}
                    onChange={val => setInfo(p => ({...p, returnDate: val}))}
                    placeholder="Select return date"
                  />
                </div>

                {/* Pax */}
                <div className="cbf-field">
                  <label>Number of Passengers <span className="cbf-req">*</span></label>
                  <div className="cbf-input-wrap">
                    <Users size={14} className="cbf-input-icon"/>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className={infoErrors.paxCount ? 'cbf-error' : ''}
                      placeholder="e.g. 2"
                      value={info.paxCount}
                      onChange={e => {
                        const v = e.target.value;
                        setInfo(p => ({...p, paxCount: v === '' ? '' : Math.min(20, parseInt(v)||1)}));
                      }}
                    />
                  </div>
                  {infoErrors.paxCount && <span className="cbf-err-msg">{infoErrors.paxCount}</span>}
                </div>

                {/* Message */}
                <div className="cbf-field cbf-full">
                  <label>Message / Notes <span className="cbf-optional">(optional)</span></label>
                  <textarea
                    className="cbf-textarea"
                    placeholder="Any special requests or information we should know..."
                    value={info.message}
                    rows={3}
                    onChange={e => setInfo(p => ({...p, message: e.target.value}))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 2 — SELECT SERVICES
              ════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="cbf-section">
              {fetchingServices ? (
                <div className="cbf-loading">
                  <div className="cbf-spinner"/>
                  <p>Loading available services for <strong>{info.destination}</strong>...</p>
                </div>
              ) : (
                <>
                  {/* Destination context */}
                  <div className="cbf-s2-context">
                    <MapPin size={14} style={{ color: '#fc9c1b', flexShrink: 0, marginTop: 1 }}/>
                    <span>
                      Select services for <strong>{info.destination}</strong>. You can add both tours and transfers.
                    </span>
                  </div>

                  {/* Tab switcher */}
                  <div className="cbf-tab-switcher">
                    <button
                      type="button"
                      className={`cbf-tab-btn ${activeTab === 'tours' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tours')}
                    >
                      {selectedTours.length > 0 && (
                        <span className="cbf-tab-sel-badge">{selectedTours.length}</span>
                      )}
                      <Mountain size={22} strokeWidth={2}/>
                      <span className="cbf-tab-label">Tours</span>
                      <span className="cbf-tab-count">{availableTours.length} available</span>
                    </button>

                    <button
                      type="button"
                      className={`cbf-tab-btn ${activeTab === 'transfers' ? 'active' : ''}`}
                      onClick={() => setActiveTab('transfers')}
                    >
                      {selectedTransfers.length > 0 && (
                        <span className="cbf-tab-sel-badge">{selectedTransfers.length}</span>
                      )}
                      <Bus size={22} strokeWidth={2}/>
                      <span className="cbf-tab-label">Transfers</span>
                      <span className="cbf-tab-count">{availableTransfers.length} available</span>
                    </button>
                  </div>

                  {/* Selected items compact bar */}
                  {(selectedTours.length > 0 || selectedTransfers.length > 0) && (
                    <div className="cbf-selbar">
                      <div className="cbf-selbar-inner">
                        {selectedTours.map(t => (
                          <div key={t._id} className="cbf-selbar-chip cbf-chip-tour">
                            {(t.imageUrl || t.image)
                              ? <img src={t.imageUrl || t.image} alt={t.title || t.name} className="cbf-chip-thumb"/>
                              : <span className="cbf-chip-icon-wrap"><Mountain size={13}/></span>
                            }
                            <div className="cbf-chip-info">
                              <span className="cbf-chip-name">{t.title || t.name}</span>
                              <span className="cbf-chip-price">₱{fmt((t.price || 0) * pax)}</span>
                            </div>
                            <button
                              type="button"
                              className="cbf-chip-remove"
                              onClick={() => toggleTour(t)}
                              aria-label={`Remove ${t.title || t.name}`}
                            >
                              <X size={11}/>
                            </button>
                          </div>
                        ))}
                        {selectedTransfers.map(t => {
                          const ttype  = transferTypes[t._id] || 'oneway';
                          const tprice = ttype === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
                          return (
                            <div key={t._id} className="cbf-selbar-chip cbf-chip-transfer">
                              {t.imageUrl
                                ? <img src={t.imageUrl} alt={t.title} className="cbf-chip-thumb"/>
                                : <span className="cbf-chip-icon-wrap"><Bus size={13}/></span>
                              }
                              <div className="cbf-chip-info">
                                <span className="cbf-chip-name">{t.title}</span>
                                <span className="cbf-chip-price">₱{fmt(tprice)}</span>
                              </div>
                              <button
                                type="button"
                                className="cbf-chip-remove"
                                onClick={() => toggleTransfer(t)}
                                aria-label={`Remove ${t.title}`}
                              >
                                <X size={11}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="cbf-selbar-total">
                        <span className="cbf-selbar-total-label">Total</span>
                        <strong className="cbf-selbar-total-val">₱{fmt(grandTotal)}</strong>
                      </div>
                    </div>
                  )}

                  {/* Tour list */}
                  {activeTab === 'tours' && (
                    availableTours.length === 0
                      ? <p className="cbf-empty-tab">No tours available for this destination.</p>
                      : <TourList
                          tours={availableTours}
                          selected={selectedTours}
                          onToggle={toggleTour}
                          paxCount={info.paxCount}
                        />
                  )}

                  {/* Transfer list */}
                  {activeTab === 'transfers' && (
                    availableTransfers.length === 0
                      ? <p className="cbf-empty-tab">No transfers available for this destination.</p>
                      : <TransferList
                          transfers={availableTransfers}
                          selected={selectedTransfers}
                          transferTypes={transferTypes}
                          onToggle={toggleTransfer}
                          onTypeChange={setTransferType}
                          paxCount={info.paxCount}
                        />
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 3 — PHASE A: TOUR SCHEDULED DATES (NEW)
              Collect a scheduled date for each selected tour.
              ════════════════════════════════════════════════════════════════ */}
          {step === 3 && step3Phase === 'tours' && selectedTours[tourDateIdx] && (() => {
            const currentTour = selectedTours[tourDateIdx];

            // Compute days between travel and return
            const tripDays = (() => {
              if (!info.travelDate || !info.returnDate) return null;
              const a = new Date(info.travelDate + 'T00:00:00');
              const b = new Date(info.returnDate + 'T00:00:00');
              const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
              return diff > 0 ? diff : null;
            })();
            const tripNights = tripDays;

            // Day-of-week helper
            const getDayName = (dateStr) => {
              if (!dateStr) return '';
              const d = new Date(dateStr + 'T00:00:00');
              return d.toLocaleDateString('en-US', { weekday: 'long' });
            };

            // Split fmtDate into parts for the card
            const splitDate = (dateStr) => {
              if (!dateStr) return { month: '', day: '', year: '' };
              const [y, m, day] = dateStr.split('-');
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              return { month: months[parseInt(m)-1], day: parseInt(day), year: y };
            };

            const startParts = splitDate(info.travelDate);
            const endParts   = splitDate(info.returnDate);
            const selParts   = splitDate(currentTourDate);

            return (
              <div className="cbf-section">

                {/* ── Tour hero card ── */}
                <div className="cbf-tour-hero-card">
                  {(currentTour.imageUrl || currentTour.image) ? (
                    <img
                      src={currentTour.imageUrl || currentTour.image}
                      alt={currentTour.title || currentTour.name}
                      className="cbf-thc-img"
                    />
                  ) : (
                    <div className="cbf-thc-img cbf-thc-img-placeholder">🏝️</div>
                  )}
                  <div className="cbf-thc-overlay">
                    {currentTour.category && (
                      <span className="cbf-thc-badge">{currentTour.category}</span>
                    )}
                    <div className="cbf-thc-title">{currentTour.title || currentTour.name}</div>
                    <div className="cbf-thc-meta-row">
                      <span className="cbf-thc-meta-item">
                        <MapPin size={11}/> {currentTour.destination || info.destination}
                      </span>
                      <span className="cbf-thc-price-right">
                        Total <strong>₱{fmt((currentTour.price || 0) * (parseInt(info.paxCount) || 1))}</strong>
                      </span>
                    </div>
                    <div className="cbf-thc-sub-row">
                      <span>₱{fmt(currentTour.price || 0)} × {info.paxCount} pax</span>
                      {currentTour.rating && (
                        <span className="cbf-thc-rating">★ {currentTour.rating}</span>
                      )}
                    </div>
                  </div>
                  {selectedTours.length > 1 && (
                    <div className="cbf-thc-counter">
                      {tourDateIdx + 1} / {selectedTours.length}
                    </div>
                  )}
                </div>

                {/* ── BOOKING CONTEXT ── */}
                <div className="cbf-bctx-section-label">BOOKING CONTEXT</div>
                <div className="cbf-bctx-card">
                  {/* Trip Start */}
                  <div className="cbf-bctx-side">
                    <div className="cbf-bctx-side-label">TRIP START</div>
                    <div className="cbf-bctx-date-big">
                      {info.travelDate ? fmtDate(info.travelDate) : '—'}
                    </div>
                    <div className="cbf-bctx-day-name">{getDayName(info.travelDate)}</div>
                    <div className="cbf-bctx-detail">
                      <MapPin size={11}/> {info.destination}
                    </div>
                    <div className="cbf-bctx-detail">
                      <Users size={11}/> {info.paxCount} Passengers
                    </div>
                  </div>

                  {/* Center — days badge */}
                  <div className="cbf-bctx-center">
                    {tripDays && (
                      <>
                        <div className="cbf-bctx-days-num">{tripDays}</div>
                        <div className="cbf-bctx-days-lbl">Days</div>
                      </>
                    )}
                    <div className="cbf-bctx-arrow">→</div>
                  </div>

                  {/* Trip End */}
                  {info.returnDate ? (
                    <div className="cbf-bctx-side cbf-bctx-side-right">
                      <div className="cbf-bctx-side-label">TRIP END</div>
                      <div className="cbf-bctx-date-big">{fmtDate(info.returnDate)}</div>
                      <div className="cbf-bctx-day-name">{getDayName(info.returnDate)}</div>
                      <div className="cbf-bctx-detail">
                        <MapPin size={11}/> {info.destination}
                      </div>
                      {tripNights && (
                        <div className="cbf-bctx-detail">
                          <Clock size={11}/> {tripNights} Night{tripNights !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="cbf-bctx-side cbf-bctx-side-right">
                      <div className="cbf-bctx-side-label">TRIP END</div>
                      <div className="cbf-bctx-date-big" style={{ opacity: 0.4 }}>—</div>
                      <div className="cbf-bctx-day-name" style={{ opacity: 0.4 }}>Not set</div>
                    </div>
                  )}
                </div>

                <div className="cbf-bctx-info-note">
                  <Clock size={12}/> Your tour will be scheduled within this trip window.
                </div>

                {/* ── SCHEDULED TOUR DATE ── */}
                <div className="cbf-sched-section-label">
                  SCHEDULED TOUR DATE
                  
                </div>

                {currentTourDate ? (
                  /* Selected date card — orange style like screenshot */
                  <div className="cbf-sched-date-card">
                    <div className="cbf-sdc-date-box">
                      <div className="cbf-sdc-month">{selParts.month.toUpperCase()}</div>
                      <div className="cbf-sdc-day">{selParts.day}</div>
                      <div className="cbf-sdc-year">{selParts.year}</div>
                    </div>
                    <div className="cbf-sdc-body">
                      <div className="cbf-sdc-weekday">{getDayName(currentTourDate)}</div>
                      <div className="cbf-sdc-tour-name">{currentTour.title || currentTour.name}</div>
                      <div className="cbf-sdc-meta">
                        <span><MapPin size={11}/> {currentTour.destination || info.destination}</span>
                        <span><Users size={11}/> {info.paxCount} pax</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cbf-sdc-change-btn"
                      onClick={() => setCurrentTourDate('')}
                      title="Change date"
                    >
                      <Calendar size={16}/>
                    </button>
                  </div>
                ) : (
                  /* Date picker trigger */
                  <div className="cbf-sched-picker-wrap">
                    <div className="cbf-sched-picker-label">
                      When would you like to take this tour?
                    </div>
                    <DatePicker
                      value={currentTourDate}
                      minDate={info.travelDate || new Date().toISOString().split('T')[0]}
                      maxDate={info.returnDate || info.travelDate || undefined}
                      disabledDates={Object.entries(tourDates)
                        .filter(([id, d]) => d && id !== selectedTours[tourDateIdx]?._id)
                        .map(([, d]) => d)}
                      onChange={val => setCurrentTourDate(val)}
                      hasError={false}
                      placeholder="Select tour date"
                    />
                    <span className="cbf-sched-hint">
                      Each tour must be scheduled on a separate day.
                    </span>
                  </div>
                )}

                {currentTourDate && info.travelDate && (
                  <p className="cbf-sched-window-note">
                    Tour date is within your trip window{' '}
                    <strong>{fmtDate(info.travelDate)}{info.returnDate ? ` – ${fmtDate(info.returnDate)}` : ''}</strong>.{' '}
                    Each tour must be scheduled on a separate day.
                  </p>
                )}

              </div>
            );
          })()}

          {/* ════════════════════════════════════════════════════════════════
              STEP 3 — PHASE B: TRANSFER DETAILS
              ════════════════════════════════════════════════════════════════ */}
          {step === 3 && step3Phase === 'transfers' && currentTransfer && (
            <div className="cbf-section">

              {/* ── Transfer Hero Card ── */}
              <div className="cbf-t-hero-card">
                {/* Background image or placeholder */}
                {currentTransfer.imageUrl ? (
                  <img src={currentTransfer.imageUrl} alt={currentTransfer.title} className="cbf-t-hero-bg"/>
                ) : (
                  <div className="cbf-t-hero-bg cbf-t-hero-bg-placeholder">🚐</div>
                )}
                {/* Dark gradient scrim */}
                <div className="cbf-t-hero-scrim"/>
                {/* Content overlay */}
                <div className="cbf-t-hero-content">
                  {/* Top row: badges left, price right */}
                  <div className="cbf-t-hero-top">
                    <div className="cbf-t-badges-row">
                      {currentTransfer.category && (
                        <span className="cbf-t-badge-cat">{currentTransfer.category}</span>
                      )}
                      <span className={`cbf-t-badge-type ${transferTypes[currentTransfer._id] === 'roundtrip' ? 'rt' : 'ow'}`}>
                        {transferTypes[currentTransfer._id] === 'roundtrip' ? '🔄 Round Trip' : '➡️ One Way'}
                      </span>
                    </div>
                    <span className="cbf-t-price-badge">
                      ₱{Number(transferTypes[currentTransfer._id] === 'roundtrip'
                        ? currentTransfer.roundtripPrice
                        : currentTransfer.oneWayPrice).toLocaleString()}
                    </span>
                  </div>
                  {/* Bottom row: route from → to */}
                  <div className="cbf-t-route-row">
                    <div className="cbf-t-route-point">
                      <div className="cbf-t-route-city">
                        {currentTransfer.fromCity || currentTransfer.origin || 'Manila'}
                      </div>
                      {(currentTransfer.fromTerminal || currentTransfer.fromArea) && (
                        <div className="cbf-t-route-sub">
                          {currentTransfer.fromTerminal || currentTransfer.fromArea}
                        </div>
                      )}
                    </div>
                    <div className="cbf-t-route-mid">
                      <Car size={12}/>
                      {currentTransfer.duration && (
                        <span className="cbf-t-route-dur">~{currentTransfer.duration}</span>
                      )}
                    </div>
                    <div className="cbf-t-route-point cbf-t-route-point-right">
                      <div className="cbf-t-route-city">
                        {currentTransfer.toCity || currentTransfer.packageDestination || info.destination}
                      </div>
                      {(currentTransfer.toArea || currentTransfer.toTerminal) && (
                        <div className="cbf-t-route-sub">
                          {currentTransfer.toArea || currentTransfer.toTerminal}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {selectedTransfers.length > 1 && (
                  <div className="cbf-t-hero-counter">{detailsIdx + 1} / {selectedTransfers.length}</div>
                )}
              </div>

              {/* ── Booking Context ── */}
              <div className="cbf-bctx-section-label" style={{ marginBottom: '6px' }}>BOOKING CONTEXT</div>
              <div className="cbf-info-card-grid" style={{ marginBottom: '10px' }}>
                {info.travelDate && (
                  <div className="cbf-info-card">
                    <div className="cbf-ic-icon-wrap date"><Calendar size={13}/></div>
                    <div className="cbf-ic-body">
                      <span className="cbf-ic-label">Travel Date</span>
                      <strong className="cbf-ic-value">{fmtDate(info.travelDate)}</strong>
                    </div>
                  </div>
                )}
                {isRoundtrip && info.returnDate && (
                  <div className="cbf-info-card">
                    <div className="cbf-ic-icon-wrap date"><Calendar size={13}/></div>
                    <div className="cbf-ic-body">
                      <span className="cbf-ic-label">Return Date</span>
                      <strong className="cbf-ic-value">{fmtDate(info.returnDate)}</strong>
                    </div>
                  </div>
                )}
                <div className="cbf-info-card">
                  <div className="cbf-ic-icon-wrap destination"><MapPin size={13}/></div>
                  <div className="cbf-ic-body">
                    <span className="cbf-ic-label">Destination</span>
                    <strong className="cbf-ic-value">{info.destination}</strong>
                  </div>
                </div>
                <div className="cbf-info-card">
                  <div className="cbf-ic-icon-wrap pax"><Users size={13}/></div>
                  <div className="cbf-ic-body">
                    <span className="cbf-ic-label">Passengers</span>
                    <strong className="cbf-ic-value">{info.paxCount} pax</strong>
                  </div>
                </div>
                <div className="cbf-info-card">
                  <div className="cbf-ic-icon-wrap name"><User size={13}/></div>
                  <div className="cbf-ic-body">
                    <span className="cbf-ic-label">Name</span>
                    <strong className="cbf-ic-value">{info.fullName}</strong>
                  </div>
                </div>
                <div className="cbf-info-card cbf-info-card-full">
                  <div className="cbf-ic-icon-wrap email"><Mail size={13}/></div>
                  <div className="cbf-ic-body">
                    <span className="cbf-ic-label">Email</span>
                    <strong className="cbf-ic-value">{info.email}</strong>
                  </div>
                </div>
              </div>

              {/* ── Transfer Info section ── */}
              <div className="cbf-transfer-info-label">TRANSFER INFO</div>
              <div className="cbf-form-grid">
                <div className="cbf-field">
                  <label>Arrival Time <span className="cbf-req">*</span>
                    <span className="cbf-field-hint"> — when you arrive</span>
                  </label>
                  <CustomTimePicker
                    value={detailForm.arrivalTime}
                    onChange={e => {
                      const val = e.target.value;
                      if (val && isNightHour(val)) {
                        setNightChargeModal({ field: 'arrivalTime', pendingValue: val });
                      } else {
                        setDetailForm(p => ({...p, arrivalTime: val}));
                      }
                    }}
                    placeholder="Select arrival time"
                  />
                </div>

                {isRoundtrip && (
                  <div className="cbf-field">
                    <label>Departure Time <span className="cbf-req">*</span>
                      {info.returnDate && <span className="cbf-field-hint"> Return on {fmtDate(info.returnDate)}</span>}
                    </label>
                    <CustomTimePicker
                      value={detailForm.departureTime}
                      onChange={e => {
                        const val = e.target.value;
                        if (val && isNightHour(val)) {
                          setNightChargeModal({ field: 'departureTime', pendingValue: val });
                        } else {
                          setDetailForm(p => ({...p, departureTime: val}));
                        }
                      }}
                      placeholder="Select departure time"
                    />
                  </div>
                )}

                <div className="cbf-field cbf-full">
                  <label>Pickup Location <span className="cbf-req">*</span></label>
                  <LocationSelect
                    value={detailForm.pickupLocation}
                    onChange={val => setDetailForm(p => ({...p, pickupLocation: val}))}
                    placeholder="e.g. NAIA Terminal 3, Pasay City"
                    source="transfer"
                  />
                </div>

                {isRoundtrip && (
                  <div className="cbf-field cbf-full">
                    <label>Drop-off Location <span className="cbf-req">*</span>
                      <span className="cbf-field-hint"> Where you return to</span>
                    </label>
                    <LocationSelect
                      value={detailForm.dropoffLocation}
                      onChange={val => setDetailForm(p => ({...p, dropoffLocation: val}))}
                      placeholder="e.g. NAIA Terminal 3, Pasay City"
                      source="transfer"
                    />
                  </div>
                )}

                <div className="cbf-field cbf-full">
                  <label>Special Requests <span className="cbf-optional">(optional)</span></label>
                  <textarea
                    className="cbf-textarea"
                    placeholder="e.g. Need child seat, extra luggage, late night pick-up..."
                    rows={3}
                    value={detailForm.message}
                    onChange={e => setDetailForm(p => ({...p, message: e.target.value}))}
                  />
                </div>
              </div>

              {/* ── Luggage notice ── */}
              <div className="cbf-luggage-notice">
                <span className="cbf-luggage-icon">🧳</span>
                <span>
                  <strong>Luggage included:</strong> Up to 2 check-in bags and 1 carry-on per passenger at no extra charge.
                </span>
              </div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              STEP 4 — SUMMARY
              ════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="cbf-section">
              <div className="cbf-section-title"><FileText size={16}/> Booking Summary</div>

              {/* Basic info summary */}
              <div className="cbf-summary-block cbf-summary-block-info">
                <div className="cbf-summary-block-title">👤 Your Information</div>
                <div className="cbf-info-card-grid">
                  <div className="cbf-info-card">
                    <div className="cbf-ic-icon-wrap destination"><MapPin size={13}/></div>
                    <div className="cbf-ic-body">
                      <span className="cbf-ic-label">Destination</span>
                      <strong className="cbf-ic-value">{info.destination}</strong>
                    </div>
                  </div>
                  <div className="cbf-info-card">
                    <div className="cbf-ic-icon-wrap name"><User size={13}/></div>
                    <div className="cbf-ic-body">
                      <span className="cbf-ic-label">Full Name</span>
                      <strong className="cbf-ic-value">{info.fullName}</strong>
                    </div>
                  </div>
                  <div className="cbf-info-card">
                    <div className="cbf-ic-icon-wrap email"><Mail size={13}/></div>
                    <div className="cbf-ic-body">
                      <span className="cbf-ic-label">Email</span>
                      <strong className="cbf-ic-value">{info.email}</strong>
                    </div>
                  </div>
                  {info.phone && (
                    <div className="cbf-info-card">
                      <div className="cbf-ic-icon-wrap phone"><Phone size={13}/></div>
                      <div className="cbf-ic-body">
                        <span className="cbf-ic-label">Phone</span>
                        <strong className="cbf-ic-value">{info.phone}</strong>
                      </div>
                    </div>
                  )}
                  <div className="cbf-info-card">
                    <div className="cbf-ic-icon-wrap date"><Calendar size={13}/></div>
                    <div className="cbf-ic-body">
                      <span className="cbf-ic-label">Travel Date</span>
                      <strong className="cbf-ic-value">{fmtDate(info.travelDate)}</strong>
                    </div>
                  </div>
                  {info.returnDate ? (
                    <div className="cbf-info-card">
                      <div className="cbf-ic-icon-wrap date"><Calendar size={13}/></div>
                      <div className="cbf-ic-body">
                        <span className="cbf-ic-label">Return Date</span>
                        <strong className="cbf-ic-value">{fmtDate(info.returnDate)}</strong>
                      </div>
                    </div>
                  ) : null}
                  <div className="cbf-info-card">
                    <div className="cbf-ic-icon-wrap pax"><Users size={13}/></div>
                    <div className="cbf-ic-body">
                      <span className="cbf-ic-label">Passengers</span>
                      <strong className="cbf-ic-value">{info.paxCount} pax</strong>
                    </div>
                  </div>
                  {info.message && (
                    <div className="cbf-info-card cbf-info-card-full">
                      <div className="cbf-ic-icon-wrap note"><FileText size={13}/></div>
                      <div className="cbf-ic-body">
                        <span className="cbf-ic-label">Notes</span>
                        <strong className="cbf-ic-value">{info.message}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tours summary */}
              {selectedTours.length > 0 && (
                <div className="cbf-summary-block">
                  <div className="cbf-summary-block-title">
                    🏔️ Selected Tours
                    <button
                      type="button"
                      className="cbf-change-type-btn"
                      onClick={() => { setActiveTab('tours'); setStep(2); }}
                    >
                      Change
                    </button>
                  </div>
                  {selectedTours.map(t => (
                    <div key={t._id} className="cbf-service-summary-row">
                      {(t.imageUrl||t.image) && (
                        <img src={t.imageUrl||t.image} alt={t.title||t.name} className="cbf-ssr-img"/>
                      )}
                      <div className="cbf-ssr-info">
                        <div className="cbf-ssr-title">{t.title||t.name}</div>
                        <div className="cbf-ssr-badges">
                          {t.destination && <span className="cbf-ssr-badge location">📍 {t.destination}</span>}
                          {t.duration    && <span className="cbf-ssr-badge duration">⏱ {t.duration}</span>}
                          {t.category    && <span className="cbf-ssr-badge category">{t.category}</span>}
                          {tourDates[t._id] && (
                            <span className="cbf-ssr-badge duration">📅 {fmtDate(tourDates[t._id])}</span>
                          )}
                        </div>
                        <div className="cbf-ssr-pax-line">
                          <span className="cbf-ssr-unit">₱{fmt(t.price)} × {info.paxCount} pax</span>
                        </div>
                      </div>
                      <div className="cbf-ssr-price">
                        <div className="cbf-ssr-total">₱{fmt((t.price||0)*info.paxCount)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="cbf-subtotal-row">
                    <span>Tours subtotal</span><strong>₱{fmt(toursTotal)}</strong>
                  </div>
                </div>
              )}

              {/* Transfers summary */}
              {selectedTransfers.length > 0 && (
                <div className="cbf-summary-block">
                  <div className="cbf-summary-block-title">
                    🚐 Selected Transfers
                    <button
                      type="button"
                      className="cbf-change-type-btn"
                      onClick={() => { setActiveTab('transfers'); setStep(2); }}
                    >
                      Change
                    </button>
                  </div>
                  {selectedTransfers.map(t => {
                    const type    = transferTypes[t._id] || 'oneway';
                    const details = detailsMap[t._id] || {};
                    const price   = type === 'roundtrip' ? (t.roundtripPrice||0) : (t.oneWayPrice||0);
                    const hasDetails = details.arrivalTime || details.pickupLocation || details.departureTime || details.dropoffLocation || details.message;
                    return (
                      <div key={t._id} className="cbf-transfer-summary-card">
                        {/* Header row: image + title + price */}
                        <div className="cbf-tsc-header">
                          {t.imageUrl && <img src={t.imageUrl} alt={t.title} className="cbf-tsc-img"/>}
                          <div className="cbf-tsc-title-wrap">
                            <div className="cbf-ssr-title">{t.title}</div>
                            <div className="cbf-ssr-badges">
                              <span className={`cbf-ssr-badge ${type === 'roundtrip' ? 'roundtrip' : 'oneway'}`}>
                                {type === 'roundtrip' ? '🔄 Roundtrip' : '➡️ One Way'}
                              </span>
                              {t.category && <span className="cbf-ssr-badge category">{t.category}</span>}
                            </div>
                          </div>
                          <div className="cbf-ssr-total">₱{fmt(price)}</div>
                        </div>
                        {/* Detail grid */}
                        {hasDetails && (
                          <div className="cbf-tsc-detail-box">
                            <div className="cbf-tsc-detail-grid">
                              {details.arrivalTime && (
                                <div className="cbf-tsc-dg-item">
                                  <div className="cbf-tsc-dg-label"><Clock size={10}/> Arrival Time</div>
                                  <div className="cbf-tsc-dg-value">{details.arrivalTime}</div>
                                </div>
                              )}
                              {details.pickupLocation && (
                                <div className="cbf-tsc-dg-item">
                                  <div className="cbf-tsc-dg-label"><MapPin size={10}/> Pickup Location</div>
                                  <div className="cbf-tsc-dg-value">{details.pickupLocation}</div>
                                </div>
                              )}
                              {type === 'roundtrip' && details.departureTime && (
                                <div className="cbf-tsc-dg-item">
                                  <div className="cbf-tsc-dg-label"><Clock size={10}/> Departure Time</div>
                                  <div className="cbf-tsc-dg-value">{details.departureTime}</div>
                                </div>
                              )}
                              {type === 'roundtrip' && details.dropoffLocation && (
                                <div className="cbf-tsc-dg-item">
                                  <div className="cbf-tsc-dg-label"><MapPin size={10}/> Drop-off Location</div>
                                  <div className="cbf-tsc-dg-value">{details.dropoffLocation}</div>
                                </div>
                              )}
                              {details.message && (
                                <div className="cbf-tsc-dg-item cbf-tsc-dg-full">
                                  <div className="cbf-tsc-dg-label"><FileText size={10}/> Notes</div>
                                  <div className="cbf-tsc-dg-value">{details.message}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="cbf-subtotal-row">
                    <span>Transfers subtotal</span><strong>₱{fmt(transfersTotal)}</strong>
                  </div>
                  {nightSurcharge > 0 && (
                    <div className="cbf-subtotal-row cbf-night-surcharge-row">
                      <span>🌙 Late Night Surcharge</span>
                      <strong>+₱{fmt(nightSurcharge)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Grand total */}
              <div className="cbf-grand-total-box">
                <span>Grand Total</span>
                <strong className="cbf-grand-total-amount">₱{fmt(grandTotal)}</strong>
              </div>

              {/* Payment Options */}
              <div className="bfm-payment-section">
                <div className="bfm-payment-header">
                  <Wallet size={18} />
                  <h3>Select Payment Option</h3>
                </div>

                {/* ── Full-payment-only banner — sits at the TOP ── */}
                {!isPartialPaymentAllowed && (
                  <div className="bfm-full-payment-banner">
                    <span className="bfm-fpb-icon">⚡</span>
                    <div>
                      <strong>Full Payment Required</strong>
                      <span>
                        Partial payment is unavailable for travel dates of{' '}
                        <strong>today</strong> or <strong>tomorrow</strong>.
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className="bfm-payment-options"
                  style={!isPartialPaymentAllowed ? { gridTemplateColumns: '1fr' } : {}}
                >
                  {/* Pay in Full */}
                  <div
                    className={`bfm-payment-card ${paymentType === 'full' ? 'active' : ''}`}
                    onClick={() => setPaymentType('full')}
                  >
                    {/* Header row: radio+icon+label+badge on left, price on right */}
                    <div
                      className="bfm-payment-card-header"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', flexWrap: 'nowrap' }}
                    >
                      <div
                        className="bfm-pch-left"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                      >
                        <div className="bfm-payment-radio">
                          <div className={`bfm-radio-dot ${paymentType === 'full' ? 'active' : ''}`} />
                        </div>
                        <CreditCard size={16} className="bfm-pif-icon" />
                        <span className="bfm-pif-label">Pay in Full</span>
                        <span className="bfm-recommended-badge">Most Popular</span>
                      </div>
                      {/* Price shown on right for both modes when partial is not allowed */}
                      {!isPartialPaymentAllowed && (
                        <div
                          className="bfm-card-header-price"
                          style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                        >
                          <span className="bfm-chp-amount">₱{fmt(grandTotal)}</span>
                          <span className="bfm-chp-label">TOTAL AMOUNT</span>
                        </div>
                      )}
                    </div>
                    {/* Body: description + benefits stacked vertically */}
                    <div className="bfm-payment-card-body" style={{ paddingLeft: 0, paddingTop: 0 }}>
                      {/* Big amount only shown when partial IS allowed */}
                      {isPartialPaymentAllowed && (
                        <div className="bfm-payment-amount">₱{fmt(grandTotal)}</div>
                      )}
                      <div className="bfm-payment-description">
                        Complete payment now and secure your booking instantly.
                      </div>
                      <ul className="bfm-payment-benefits">
                        <li>✓ Instant confirmation</li>
                        <li>✓ No further payments needed</li>
                        <li>✓ Priority processing</li>
                      </ul>
                    </div>
                  </div>

                  {/* Partial Payment — hidden if travel date is today or tomorrow */}
                  {isPartialPaymentAllowed && (
                    <div
                      className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                      onClick={() => setPaymentType('partial')}
                    >
                      <div className="bfm-payment-card-header">
                        <div className="bfm-payment-radio">
                          <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                        </div>
                        <Wallet size={16} className="bfm-pif-icon" />
                        <span className="bfm-pif-label">Partial Payment</span>
                        <span className="bfm-flexible-badge">Flexible</span>
                      </div>
                      <div className="bfm-payment-card-body">
                        <div className="bfm-payment-amount">
                          ₱{fmt(partialAmount)}
                          <span className="bfm-payment-percentage">50% Down Payment</span>
                        </div>
                        <div className="bfm-payment-description">
                          Pay 50% now, remaining balance before departure
                        </div>
                        <div className="bfm-payment-breakdown">
                          <div className="bfm-breakdown-row">
                            <span>Now (50%):</span>
                            <strong>₱{fmt(partialAmount)}</strong>
                          </div>
                          <div className="bfm-breakdown-row">
                            <span>Later (50%):</span>
                            <strong>₱{fmt(grandTotal - partialAmount)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="bfm-payment-summary">
                  <div className="bfm-summary-row">
                    <span>Amount to pay now:</span>
                    <strong className="bfm-amount-highlight">
                      ₱{fmt(paymentType === 'full' ? grandTotal : partialAmount)}
                    </strong>
                  </div>
                  {paymentType === 'partial' && (
                    <div className="bfm-summary-row bfm-remaining">
                      <span>Remaining balance:</span>
                      <span>₱{fmt(grandTotal - partialAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="cbf-error-banner">{submitError}</div>
              )}
            </div>
          )}

        </div>

        {/* ── Footer Actions ─────────────────────────────────────────────── */}
        <div className="cbf-footer">
          {/* Back button */}
          {step > 1 && (
            <button type="button" className="cbf-back-btn" onClick={goBack} disabled={loading}>
              <ChevronLeft size={16}/> Back
            </button>
          )}

          {/* Next / Submit */}
          {step < 4 ? (
            <button
              type="button"
              className="cbf-next-btn"
              onClick={goNext}
              disabled={
                (step === 2 && selectedTours.length === 0 && selectedTransfers.length === 0) ||
                (step === 3 && step3Phase === 'tours' && !tourDateValid) ||
                (step === 3 && step3Phase === 'transfers' && !detailValid) ||
                loading
              }
            >
              {step === 3 ? step3NextLabel() : step === 2 && selectedTours.length === 0 && selectedTransfers.length === 0 ? 'Select a service' : 'Continue'}
              <ChevronRight size={16}/>
            </button>
          ) : (
            <button
              type="button"
              className="cbf-submit-btn"
              onClick={handleSubmit}
              disabled={loading || (selectedTours.length === 0 && selectedTransfers.length === 0)}
            >
              {loading ? (
                <><span className="cbf-spinner-sm"/>Processing...</>
              ) : (
                <><CheckCircle size={16}/> Proceed to Payment</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>

    {/* ── Night Charge Warning Modal ──────────────────────────────────── */}
    {nightChargeModal && ReactDOM.createPortal(
      <div className="cbf-night-modal-backdrop">
        <div className="cbf-night-modal">
          <div className="cbf-nm-moon">🌙</div>
          <h3 className="cbf-nm-title">Late Night Schedule</h3>
          <p className="cbf-nm-desc">
            Schedules between <strong>12:00 AM – 5:00 AM</strong> include an additional
            late-night surcharge of <strong>₱500.00</strong> per time slot.
          </p>
          <p className="cbf-nm-sub">
            Do you want to continue with this schedule?
          </p>
          <div className="cbf-nm-actions">
            <button
              type="button"
              className="cbf-nm-close-btn"
              onClick={() => {
                // Clear the field value and dismiss
                setDetailForm(p => ({...p, [nightChargeModal.field]: ''}));
                setNightChargeModal(null);
              }}
            >
              ✕ Close
            </button>
            <button
              type="button"
              className="cbf-nm-confirm-btn"
              onClick={() => {
                // Accept the value and dismiss
                setDetailForm(p => ({...p, [nightChargeModal.field]: nightChargeModal.pendingValue}));
                setNightChargeModal(null);
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Tour List
// Multiple tours can be selected — clicking a selected tour deselects it;
// clicking an unselected tour adds it to the selection.
// ─────────────────────────────────────────────────────────────────────────────
function TourList({ tours, selected, onToggle, paxCount }) {
  if (tours.length === 0) {
    return <div className="cbf-empty">No tours available for this destination.</div>;
  }
  return (
    <>
      <p className="cbf-section-desc" style={{ marginBottom: '12px' }}>
        Choose one or more tours — you'll set dates in the next step.
      </p>
      <div className="cbf-service-list">
        {tours.map(tour => {
          const isSelected = selected.some(t => t._id === tour._id);
          const img = tour.imageUrl || tour.image;
          return (
            <div
              key={tour._id}
              className={`cbf-card-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(tour)}
            >
              {/* Image section */}
              <div className="cbf-card-image-wrap">
                {img
                  ? <img src={img} alt={tour.title || tour.name} className="cbf-card-img"/>
                  : <div className="cbf-card-img-placeholder">🏔️</div>
                }
                {/* Category badge top-left */}
                {tour.category && (
                  <span className="cbf-card-category-badge">{tour.category}</span>
                )}
                {/* Title overlay bottom-left */}
                <div className="cbf-card-img-title">{tour.title || tour.name}</div>
                {/* Check button top-right */}
                <button
                  type="button"
                  className={`cbf-card-check-btn ${isSelected ? 'checked' : ''}`}
                  onClick={e => { e.stopPropagation(); onToggle(tour); }}
                  aria-label={isSelected ? 'Deselect' : 'Select'}
                  style={{ outline: 'none', boxShadow: isSelected ? '0 2px 8px rgba(252,156,27,0.45)' : '0 2px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  {isSelected
                    ? <Check size={14} style={{ display: 'block', margin: 0 }}/>
                    : <Plus size={14} style={{ display: 'block', margin: 0 }}/>
                  }
                </button>
              </div>
              {/* Info row below image */}
              <div className="cbf-card-info-row">
                <div className="cbf-card-meta-left">
                  {tour.destination && (
                    <span className="cbf-card-meta-item">
                      <MapPin size={11}/> {tour.destination}
                    </span>
                  )}
                  {tour.paxCount > 0 && (
                    <span className="cbf-card-meta-item">
                      <Users size={11}/> {paxCount} pax
                    </span>
                  )}
                  {tour.rating > 0 && (
                    <span className="cbf-card-meta-item cbf-card-rating">
                      ⭐ {tour.rating}{tour.reviewCount > 0 ? ` (${tour.reviewCount})` : ''}
                    </span>
                  )}
                </div>
                {tour.price > 0 && (
                  <span className="cbf-card-price">
                    ₱{Number(tour.price).toLocaleString()}<span className="cbf-card-price-unit">/pax</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Transfer List
// ─────────────────────────────────────────────────────────────────────────────
function TransferList({ transfers, selected, transferTypes, onToggle, onTypeChange, paxCount }) {
  const userPax = parseInt(paxCount) || 0;

  if (transfers.length === 0) {
    return (
      <div className="cbf-empty">
        No transfers available for this destination
        {userPax > 0
          ? ` that can accommodate ${userPax} passenger${userPax > 1 ? 's' : ''}.`
          : '.'}
        {userPax > 0 && (
          <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--cbf-text-muted, #888)' }}>
            Only vehicles with enough capacity for your group are shown.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {userPax > 0 && (
        <p className="cbf-section-desc" style={{ marginBottom: '12px' }}>
          Showing transfers that can accommodate <strong>{userPax} passenger{userPax > 1 ? 's' : ''}</strong>.
        </p>
      )}
      <div className="cbf-service-list">
        {transfers.map(transfer => {
          const isSelected = selected.some(t => t._id === transfer._id);
          const type       = transferTypes[transfer._id] || 'oneway';
          return (
            <div
              key={transfer._id}
              className={`cbf-card-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(transfer)}
            >
              {/* Image section */}
              <div className="cbf-card-image-wrap">
                {transfer.imageUrl
                  ? <img src={transfer.imageUrl} alt={transfer.title} className="cbf-card-img"/>
                  : <div className="cbf-card-img-placeholder">🚐</div>
                }
                {/* Category badge top-left */}
                {transfer.category && (
                  <span className="cbf-card-category-badge">{transfer.category}</span>
                )}
                {/* Title overlay bottom-left */}
                <div className="cbf-card-img-title">{transfer.title}</div>
                {/* Check button top-right */}
                <button
                  type="button"
                  className={`cbf-card-check-btn ${isSelected ? 'checked' : ''}`}
                  onClick={e => { e.stopPropagation(); onToggle(transfer); }}
                  aria-label={isSelected ? 'Deselect' : 'Select'}
                  style={{ outline: 'none', boxShadow: isSelected ? '0 2px 8px rgba(252,156,27,0.45)' : '0 2px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  {isSelected
                    ? <Check size={14} style={{ display: 'block', margin: 0 }}/>
                    : <Plus size={14} style={{ display: 'block', margin: 0 }}/>
                  }
                </button>
              </div>
              {/* Info row below image */}
              <div className="cbf-card-info-row">
                <div className="cbf-card-meta-left">
                  {transfer.packageDestination && (
                    <span className="cbf-card-meta-item">
                      <MapPin size={11}/> {transfer.packageDestination}
                    </span>
                  )}
                  {transfer.pax > 0 && (
                    <span className="cbf-card-meta-item">
                      <Users size={11}/> Up to {transfer.pax} pax
                    </span>
                  )}
                </div>
                {transfer.oneWayPrice > 0 && (
                  <span className="cbf-card-price">
                    ₱{Number(transfer.oneWayPrice).toLocaleString()}<span className="cbf-card-price-unit">/trip</span>
                  </span>
                )}
              </div>

              {/* Type & price selector (only when selected) */}
              {isSelected && (
                <div className="cbf-transfer-type-select" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`cbf-tt-btn ${type === 'oneway' ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); onTypeChange(transfer._id, 'oneway'); }}
                  >
                    ➡️ One Way
                    {transfer.oneWayPrice > 0 && <span className="cbf-tt-price">₱{Number(transfer.oneWayPrice).toLocaleString()}</span>}
                  </button>
                  {transfer.roundtripPrice > 0 && (
                    <button
                      type="button"
                      className={`cbf-tt-btn ${type === 'roundtrip' ? 'active' : ''}`}
                      onClick={e => { e.stopPropagation(); onTypeChange(transfer._id, 'roundtrip'); }}
                    >
                      🔄 Roundtrip
                      <span className="cbf-tt-price">₱{Number(transfer.roundtripPrice).toLocaleString()}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Custom Date Picker
// Renders a calendar popup with past-date blocking.
// Props:
//   value      – "YYYY-MM-DD" string or ""
//   minDate    – "YYYY-MM-DD" earliest selectable date (defaults to today)
//   onChange   – (val: string) => void
//   hasError   – boolean  (optional)
//   placeholder– string   (optional)
// ─────────────────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_LABELS  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DatePicker({ value, minDate, maxDate, onChange, hasError = false, placeholder = 'Select date', disabledDates = [] }) {
  const today        = new Date().toISOString().split('T')[0];
  const effectiveMin = minDate || today;
  const effectiveMax = maxDate || null;

  const toDate       = (s) => s ? new Date(s + 'T00:00:00') : null;
  const selectedDate = toDate(value);
  const minD         = toDate(effectiveMin);

  const initView = () => {
    const base = selectedDate || minD || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  };

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(initView);
  const calRef = useRef(null);

  // Close on outside click (clicking the backdrop)
  const handleBackdropClick = (e) => {
    if (calRef.current && !calRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  const handleOpen = () => {
    setView(initView());
    setOpen(true);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const prevMonth = () => setView(v => {
    const m = v.month === 0 ? 11 : v.month - 1;
    const y = v.month === 0 ? v.year - 1 : v.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setView(v => {
    const m = v.month === 11 ? 0 : v.month + 1;
    const y = v.month === 11 ? v.year + 1 : v.year;
    return { year: y, month: m };
  });

  const firstDay  = new Date(view.year, view.month, 1).getDay();
  const daysInMon = new Date(view.year, view.month + 1, 0).getDate();
  const cells     = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);

  const cellDate = (d) => {
    const mm = String(view.month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${view.year}-${mm}-${dd}`;
  };

  const isPast     = (d) => {
    const cd = cellDate(d);
    if (cd < effectiveMin) return true;
    if (effectiveMax && cd > effectiveMax) return true;
    if (disabledDates.includes(cd)) return true;
    return false;
  };
  const isSelected = (d) => cellDate(d) === value;
  const isToday    = (d) => cellDate(d) === today;

  const select = (d) => {
    if (isPast(d)) return;
    onChange(cellDate(d));
    setOpen(false);
  };

  const displayValue = value ? fmtDate(value) : '';

  const calendarModal = open ? (
    <div className="cbf-dp-modal-backdrop" onMouseDown={handleBackdropClick}>
      <div className="cbf-dp-calendar cbf-dp-calendar-modal" ref={calRef}>
        <div className="cbf-dp-modal-header-row">
          <span className="cbf-dp-modal-title">Select Date</span>
          <button
            type="button"
            className="cbf-dp-modal-close"
            onClick={() => setOpen(false)}
            aria-label="Close calendar"
          >&#10005;</button>
        </div>
        <div className="cbf-dp-cal-header">
          <button type="button" className="cbf-dp-nav" onClick={prevMonth}>&#8249;</button>
          <span className="cbf-dp-month-label">{MONTH_NAMES[view.month]} {view.year}</span>
          <button type="button" className="cbf-dp-nav" onClick={nextMonth}>&#8250;</button>
        </div>
        <div className="cbf-dp-day-labels">
          {DAY_LABELS.map(l => <span key={l}>{l}</span>)}
        </div>
        <div className="cbf-dp-grid">
          {cells.map((d, i) => (
            d === null
              ? <span key={`e${i}`} className="cbf-dp-cell cbf-dp-empty"/>
              : <button
                  key={d}
                  type="button"
                  className={[
                    'cbf-dp-cell',
                    isPast(d)     ? 'cbf-dp-past'     : '',
                    isSelected(d) ? 'cbf-dp-selected' : '',
                    isToday(d) && !isSelected(d) ? 'cbf-dp-today' : '',
                  ].join(' ').trim()}
                  onClick={() => select(d)}
                  disabled={isPast(d)}
                >{d}</button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="cbf-datepicker-wrap">
      <div
        className={`cbf-input-wrap cbf-datepicker-trigger ${hasError ? 'cbf-dp-error' : ''}`}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleOpen()}
      >
        <Calendar size={14} className="cbf-input-icon"/>
        <span className={`cbf-dp-display ${!displayValue ? 'cbf-dp-placeholder' : ''}`}>
          {displayValue || placeholder}
        </span>
        <ChevronRight size={12} className="cbf-dp-chevron" style={{ transform: open ? 'rotate(90deg)' : 'none' }}/>
      </div>
      {ReactDOM.createPortal(calendarModal, document.body)}
    </div>
  );
}