
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  X, User, Compass, FileText, CheckCircle, Check,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

import './Customizedbookingform.css';

import {
  API_BASE,
  NIGHT_SURCHARGE_AMOUNT,
  fmt,
  fmtDate,
  isNightHour,
} from './cbf/utils';

import NightChargeModal    from './cbf/components/NightChargeModal';
import Step1BasicInfo      from './cbf/steps/Step1BasicInfo';
import Step2SelectServices from './cbf/steps/Step2SelectServices';
import Step3TourDates      from './cbf/steps/Step3TourDates';
import Step3TransferDetails from './cbf/steps/Step3TransferDetails';
import Step4Summary        from './cbf/steps/Step4Summary';

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Basic Info', icon: User },
  { id: 2, label: 'Services',   icon: Compass },
  { id: 3, label: 'Details',    icon: FileText },
  { id: 4, label: 'Summary',    icon: CheckCircle },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function CustomizedBookingForm({ isOpen, onClose, onSuccess }) {

  // ── Step navigation ────────────────────────────────────────────────────────
  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState('');
  const formRef = useRef(null);

  // ── Step 1 – Basic Info ────────────────────────────────────────────────────
  const [info, setInfo] = useState({
    destination: '', fullName: '', email: '', phone: '',
    travelDate: '', returnDate: '', paxCount: '', message: '',
  });
  const [infoErrors, setInfoErrors] = useState({});

  // ── Destination autocomplete ───────────────────────────────────────────────
  const [allDestinations,  setAllDestinations]  = useState([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // ── Step 2 – Services ─────────────────────────────────────────────────────
  const [availableTours,     setAvailableTours]     = useState([]);
  const [availableTransfers, setAvailableTransfers] = useState([]);
  const [fetchingServices,   setFetchingServices]   = useState(false);
  const [step2InitialTab,    setStep2InitialTab]    = useState('tours');

  const [selectedTours,     setSelectedTours]     = useState([]);
  const [selectedTransfers, setSelectedTransfers] = useState([]);
  const [transferTypes,     setTransferTypes]     = useState({});  // { [id]: 'oneway'|'roundtrip' }

  // ── Payment ────────────────────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState('full');

  // ── Night charge modal ─────────────────────────────────────────────────────
  const [nightChargeModal, setNightChargeModal] = useState(null);
  // null | { field: 'arrivalTime'|'departureTime', pendingValue: string }

  // ── Step 3A – Tour Scheduled Dates ────────────────────────────────────────
  const [tourDates,       setTourDates]       = useState({});   // { [tourId]: 'YYYY-MM-DD' }
  const [tourDateIdx,     setTourDateIdx]     = useState(0);
  const [currentTourDate, setCurrentTourDate] = useState('');
  const [step3Phase,      setStep3Phase]      = useState('tours'); // 'tours' | 'transfers'

  // ── Step 3B – Transfer Details ─────────────────────────────────────────────
  const [detailsIdx, setDetailsIdx] = useState(0);
  const [detailsMap, setDetailsMap] = useState({});  // { [transferId]: detailForm }
  const [detailForm, setDetailForm] = useState({
    arrivalTime: '', departureTime: '',
    pickupLocation: '', dropoffLocation: '', message: '',
  });

  // Track what was used for the last service fetch
  const lastFetchedPax  = useRef(null);
  const lastFetchedDest = useRef(null);

  // ─── Reset when modal closes ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setInfo({ destination:'', fullName:'', email:'', phone:'', travelDate:'', returnDate:'', paxCount:'', message:'' });
      setInfoErrors({});
      setShowDestDropdown(false);
      setStep2InitialTab('tours');
      setSelectedTours([]); setSelectedTransfers([]); setTransferTypes({});
      setTourDates({}); setTourDateIdx(0); setCurrentTourDate(''); setStep3Phase('tours');
      setDetailsIdx(0); setDetailsMap({});
      setDetailForm({ arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
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

  // ─── Reset to full payment if partial not allowed ─────────────────────────
  useEffect(() => {
    if (!isPartialPaymentAllowed && paymentType === 'partial') {
      setPaymentType('full');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.travelDate]);

  // ── Fetch all destinations for autocomplete ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fetchAllDestinations = async () => {
      try {
        const [toursRes, transfersRes] = await Promise.all([
          fetch(`${API_BASE}/api/tours/all`),
          fetch(`${API_BASE}/api/transfers?all=true`),
        ]);
        const toursData     = await toursRes.json();
        const transfersData = await transfersRes.json();
        const allTours      = toursData.data || toursData.tours || (Array.isArray(toursData) ? toursData : []);
        const allTransfers  = transfersData.data || [];

        const toTitleCase = (s) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const seen = new Map();
        const add  = (raw) => {
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
      }
    };
    fetchAllDestinations();
  }, [isOpen]);

  // ── Fetch services on Step 2 ──────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    if (
      lastFetchedPax.current  !== info.paxCount ||
      lastFetchedDest.current !== info.destination
    ) {
      fetchServices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, info.paxCount, info.destination]);

  const fetchServices = async () => {
    setFetchingServices(true);
    try {
      const normalise  = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
      const normDest   = normalise((info.destination || '').split(',')[0]);
      const kw         = (info.destination || '').split(',')[0].trim().toLowerCase();

      const [toursRes, transfersRes] = await Promise.all([
        fetch(`${API_BASE}/api/tours/all`),
        fetch(`${API_BASE}/api/transfers?all=true`),
      ]);
      const toursData     = await toursRes.json();
      const transfersData = await transfersRes.json();
      const allTours      = toursData.data || toursData.tours || (Array.isArray(toursData) ? toursData : []);
      const allTransfers  = transfersData.data || [];

      const filteredTours = info.destination
        ? allTours.filter(t => {
            if (t.isArchive === 'Yes') return false;
            const nd = normalise((t.destination || '').split(',')[0]);
            return nd.includes(normDest) || normDest.includes(nd);
          })
        : allTours.filter(t => t.isArchive !== 'Yes');

      const userPax  = parseInt(info.paxCount) || 0;
      const paxFits  = (t) => !t.pax || !userPax || t.pax >= userPax;

      const filteredTransfers = info.destination
        ? allTransfers.filter(t => {
            if (!t.isActive || !paxFits(t)) return false;
            if (!t.packageDestination) return true;
            const td = (t.packageDestination || '').toLowerCase().split(',')[0].trim();
            return td.includes(kw) || kw.includes(td);
          })
        : allTransfers.filter(t => t.isActive && paxFits(t));

      setAvailableTours(filteredTours);
      setAvailableTransfers(filteredTransfers);
      lastFetchedPax.current  = info.paxCount;
      lastFetchedDest.current = info.destination;

      // Drop selections that no longer match destination / pax
      const tourIds = new Set(filteredTours.map(t => t._id));
      setSelectedTours(prev => {
        const valid   = prev.filter(t => tourIds.has(t._id));
        const removed = prev.filter(t => !tourIds.has(t._id)).map(t => t._id);
        if (removed.length) setTourDates(pd => { const n = {...pd}; removed.forEach(id => delete n[id]); return n; });
        return valid;
      });

      const transferIds = new Set(filteredTransfers.map(t => t._id));
      setSelectedTransfers(prev => {
        const valid   = prev.filter(t => transferIds.has(t._id));
        const removed = prev.filter(t => !transferIds.has(t._id)).map(t => t._id);
        if (removed.length) {
          setTransferTypes(pt => { const n = {...pt}; removed.forEach(id => delete n[id]); return n; });
          setDetailsMap(pd   => { const n = {...pd};  removed.forEach(id => delete n[id]); return n; });
        }
        return valid;
      });
    } catch (err) {
    } finally {
      setFetchingServices(false);
    }
  };

  // ─── Computed values ───────────────────────────────────────────────────────
  const pax            = parseInt(info.paxCount) || 0;
  const toursTotal     = selectedTours.reduce((s, t) => s + (t.price || 0) * pax, 0);
  const transfersTotal = selectedTransfers.reduce((s, t) => {
    const type = transferTypes[t._id] || 'oneway';
    return s + (type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0));
  }, 0);
  const nightSurcharge = Object.entries(detailsMap).reduce((total, [transferId, details]) => {
    let charge = 0;
    if (isNightHour(details.arrivalTime)) charge += NIGHT_SURCHARGE_AMOUNT;
    const type = transferTypes[transferId] || 'oneway';
    if (type === 'roundtrip' && isNightHour(details.departureTime)) charge += NIGHT_SURCHARGE_AMOUNT;
    return total + charge;
  }, 0);
  const grandTotal    = toursTotal + transfersTotal + nightSurcharge;
  const partialAmount = Math.ceil(grandTotal * 0.5);

  const isPartialPaymentAllowed = (() => {
    if (!info.travelDate) return true;
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const travel   = new Date(info.travelDate + 'T00:00:00');
    return travel > tomorrow;
  })();

  const currentTransfer = selectedTransfers[detailsIdx];
  const isRoundtrip     = currentTransfer && transferTypes[currentTransfer._id] === 'roundtrip';
  const detailValid     =
    detailForm.arrivalTime &&
    detailForm.pickupLocation &&
    (!isRoundtrip || (detailForm.departureTime && detailForm.dropoffLocation));
  const tourDateValid = !!currentTourDate;

  // ─── Step 1 validation ─────────────────────────────────────────────────────
  const validateInfo = () => {
    const errs = {};
    if (!info.destination.trim()) errs.destination = 'Destination is required.';
    if (!info.fullName.trim())    errs.fullName    = 'Full name is required.';
    if (!info.email.trim())       errs.email       = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errs.email = 'Enter a valid email.';
    if (!info.travelDate)         errs.travelDate  = 'Travel date is required.';
    if (!info.paxCount || parseInt(info.paxCount) < 1) errs.paxCount = 'At least 1 passenger required.';
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Save current transfer detail form ────────────────────────────────────
  const saveCurrentDetail = () => {
    const t = selectedTransfers[detailsIdx];
    if (t) setDetailsMap(prev => ({ ...prev, [t._id]: { ...detailForm } }));
  };

  // ─── Navigation helpers ────────────────────────────────────────────────────
  const returnToStep2 = () => setStep(2);

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
        const currentTour = selectedTours[tourDateIdx];
        if (currentTour) setTourDates(prev => ({ ...prev, [currentTour._id]: currentTourDate }));

        if (tourDateIdx < selectedTours.length - 1) {
          const nextTour = selectedTours[tourDateIdx + 1];
          setTourDateIdx(tourDateIdx + 1);
          setCurrentTourDate(tourDates[nextTour._id] || '');
        } else if (selectedTransfers.length > 0) {
          setStep3Phase('transfers');
          setDetailsIdx(0);
          const first = selectedTransfers[0];
          setDetailForm(detailsMap[first._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
        } else {
          setStep(4);
        }
      } else {
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

  const goBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      if (step3Phase === 'tours') {
        if (tourDateIdx > 0) {
          const currentTour = selectedTours[tourDateIdx];
          if (currentTour) setTourDates(prev => ({ ...prev, [currentTour._id]: currentTourDate }));
          const prevTour = selectedTours[tourDateIdx - 1];
          setTourDateIdx(tourDateIdx - 1);
          setCurrentTourDate(tourDates[prevTour._id] || '');
        } else {
          returnToStep2();
        }
      } else {
        if (detailsIdx > 0) {
          saveCurrentDetail();
          const prev = selectedTransfers[detailsIdx - 1];
          setDetailsIdx(detailsIdx - 1);
          setDetailForm(detailsMap[prev._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
        } else if (selectedTours.length > 0) {
          saveCurrentDetail();
          setStep3Phase('tours');
          const lastTour = selectedTours[selectedTours.length - 1];
          setTourDateIdx(selectedTours.length - 1);
          setCurrentTourDate(tourDates[lastTour._id] || '');
        } else {
          returnToStep2();
        }
      }
    } else if (step === 4) {
      if (selectedTransfers.length > 0) {
        setStep(3); setStep3Phase('transfers');
        const last = selectedTransfers[selectedTransfers.length - 1];
        setDetailsIdx(selectedTransfers.length - 1);
        setDetailForm(detailsMap[last._id] || { arrivalTime:'', departureTime:'', pickupLocation:'', dropoffLocation:'', message:'' });
      } else if (selectedTours.length > 0) {
        setStep(3); setStep3Phase('tours');
        const lastTour = selectedTours[selectedTours.length - 1];
        setTourDateIdx(selectedTours.length - 1);
        setCurrentTourDate(tourDates[lastTour._id] || '');
      } else {
        returnToStep2();
      }
    }
  };

  // ─── Service toggles ───────────────────────────────────────────────────────
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
      // Deselect
      setSelectedTransfers([]);
      setTransferTypes({});
      setDetailsMap({});
    } else {
      // Replace any existing transfer with the new one (only 1 allowed)
      const prev = selectedTransfers[0];
      if (prev) {
        setTransferTypes({});
        setDetailsMap({});
      }
      setSelectedTransfers([transfer]);
      setTransferTypes({ [transfer._id]: 'oneway' });
    }
  };

  const setTransferType = (transferId, type) => {
    setTransferTypes(prev => ({ ...prev, [transferId]: type }));
  };

  // ─── Step 3 next-button label ──────────────────────────────────────────────
  const step3NextLabel = () => {
    if (step3Phase === 'tours') {
      if (tourDateIdx < selectedTours.length - 1)
        return `Next Tour (${tourDateIdx + 2}/${selectedTours.length})`;
      if (selectedTransfers.length > 0) return 'Next: Transfer Details';
      return 'Review Summary';
    } else {
      if (detailsIdx < selectedTransfers.length - 1)
        return `Next Transfer (${detailsIdx + 2}/${selectedTransfers.length})`;
      return 'Review Summary';
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError('');

    const transferSnapshots = selectedTransfers.map(t => {
      const type    = transferTypes[t._id] || 'oneway';
      const details = detailsMap[t._id] || {};
      const price   = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
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
        arrivalTime:     details.arrivalTime   || '',
        departureTime:   type === 'roundtrip' ? (details.departureTime  || '') : '',
        pickupLocation:  details.pickupLocation  || '',
        dropoffLocation: type === 'roundtrip' ? (details.dropoffLocation || '') : '',
        message:         details.message || '',
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
      subtotal:      (t.price || 0) * info.paxCount,
      scheduledDate: tourDates[t._id] || '',
    }));

    const amountToPay = paymentType === 'partial' ? partialAmount : grandTotal;

    const payload = {
      ...info,
      tours:                tourSnapshots,
      transfers:            transferSnapshots,
      toursTotal,
      transfersTotal,
      totalAmount:          grandTotal,
      nightSurcharge,
      paymentType,
      initialPaymentAmount: amountToPay,
      remainingBalance:     paymentType === 'partial' ? grandTotal - partialAmount : 0,
    };

    try {
      const res  = await fetch(`${API_BASE}/api/customized-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Booking failed.');

      const bookingId = data.bookingId || data.data?._id;
      if (!bookingId) throw new Error('Booking created but no ID returned. Please contact support.');

      const paymentRes  = await fetch(`${API_BASE}/api/payment/create-intent`, {
        method: 'POST',
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

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="cbf-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      >
        <div className="cbf-modal">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="cbf-header">
            <button className="cbf-close-btn" onClick={onClose} type="button">
              <X size={16} />
            </button>

            <div className="cbf-header-content">
              <div className="cbf-header-icon">✈️</div>
              <h2 className="cbf-header-title">Build Your Custom Trip</h2>
              <p className="cbf-header-sub">
                Mix tours &amp; transfers to craft your perfect itinerary
              </p>
            </div>

            {/* Step indicators */}
            <div className="cbf-steps">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className={`cbf-step ${step >= s.id ? 'active' : ''} ${step === s.id ? 'current' : ''}`}>
                    <div className="cbf-step-dot">
                      {step > s.id ? <Check size={10} /> : <s.icon size={10} />}
                    </div>
                    <span className="cbf-step-label">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`cbf-step-line ${step > s.id ? 'active' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Progress bar */}
            <div className="cbf-progress-bar-wrap">
              <div className="cbf-progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="cbf-body" ref={formRef}>

            {/* Step 1 */}
            {step === 1 && (
              <Step1BasicInfo
                info={info}
                infoErrors={infoErrors}
                allDestinations={allDestinations}
                showDestDropdown={showDestDropdown}
                onInfoChange={(field, value) => setInfo(p => ({ ...p, [field]: value }))}
                onDestFocus={() => setShowDestDropdown(true)}
                onDestBlur={() => setTimeout(() => setShowDestDropdown(false), 150)}
                onDestSelect={dest => { setInfo(p => ({ ...p, destination: dest })); setShowDestDropdown(false); }}
                setShowDestDropdown={setShowDestDropdown}
              />
            )}

            {/* Step 2 */}
            {step === 2 && (
              <Step2SelectServices
                info={info}
                availableTours={availableTours}
                availableTransfers={availableTransfers}
                fetchingServices={fetchingServices}
                selectedTours={selectedTours}
                selectedTransfers={selectedTransfers}
                transferTypes={transferTypes}
                tourDates={tourDates}
                grandTotal={grandTotal}
                pax={pax}
                initialTab={step2InitialTab}
                toggleTour={toggleTour}
                toggleTransfer={toggleTransfer}
                setTransferType={setTransferType}
              />
            )}

            {/* Step 3A — Tour Dates */}
            {step === 3 && step3Phase === 'tours' && (
              <Step3TourDates
                selectedTours={selectedTours}
                tourDateIdx={tourDateIdx}
                currentTourDate={currentTourDate}
                tourDates={tourDates}
                info={info}
                onDateChange={setCurrentTourDate}
              />
            )}

            {/* Step 3B — Transfer Details */}
            {step === 3 && step3Phase === 'transfers' && currentTransfer && (
              <Step3TransferDetails
                currentTransfer={currentTransfer}
                transferTypes={transferTypes}
                detailForm={detailForm}
                detailsIdx={detailsIdx}
                totalTransfers={selectedTransfers.length}
                info={info}
                onDetailChange={(field, value) => setDetailForm(p => ({ ...p, [field]: value }))}
                onNightTimeAttempt={(field, val) => setNightChargeModal({ field, pendingValue: val })}
              />
            )}

            {/* Step 4 */}
            {step === 4 && (
              <Step4Summary
                info={info}
                selectedTours={selectedTours}
                selectedTransfers={selectedTransfers}
                transferTypes={transferTypes}
                detailsMap={detailsMap}
                tourDates={tourDates}
                toursTotal={toursTotal}
                transfersTotal={transfersTotal}
                nightSurcharge={nightSurcharge}
                grandTotal={grandTotal}
                partialAmount={partialAmount}
                isPartialPaymentAllowed={isPartialPaymentAllowed}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                submitError={submitError}
                onChangeTours={() => { setStep2InitialTab('tours'); setStep(2); }}
                onChangeTransfers={() => { setStep2InitialTab('transfers'); setStep(2); }}
              />
            )}
          </div>

          {/* ── Footer Actions ───────────────────────────────────────────── */}
          <div className="cbf-footer">
            {/* Step 2 selection hint */}
            {step === 2 && (selectedTours.length > 0 || selectedTransfers.length > 0) && (
              <div className="cbf-footer-total">
                <span className="cbf-footer-total-items">
                  {selectedTours.length + selectedTransfers.length} item{selectedTours.length + selectedTransfers.length !== 1 ? 's' : ''}
                </span>
                <span className="cbf-footer-total-amt">₱{fmt(grandTotal)}</span>
              </div>
            )}

            <div className="cbf-footer-actions">
              {step > 1 && (
                <button type="button" className="cbf-back-btn" onClick={goBack} disabled={loading}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}

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
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="cbf-submit-btn"
                  onClick={handleSubmit}
                  disabled={loading || (selectedTours.length === 0 && selectedTransfers.length === 0)}
                >
                  {loading ? (
                    <><span className="cbf-spinner-sm" />Processing...</>
                  ) : (
                    <><CheckCircle size={16} /> Proceed to Payment</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Night Charge Warning Modal */}
      {nightChargeModal && (
        <NightChargeModal
          field={nightChargeModal.field}
          pendingValue={nightChargeModal.pendingValue}
          onConfirm={() => {
            setDetailForm(p => ({ ...p, [nightChargeModal.field]: nightChargeModal.pendingValue }));
            setNightChargeModal(null);
          }}
          onDismiss={() => {
            setDetailForm(p => ({ ...p, [nightChargeModal.field]: '' }));
            setNightChargeModal(null);
          }}
        />
      )}
    </>
  );
}
