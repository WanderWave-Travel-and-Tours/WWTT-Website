import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Calendar, MapPin, Bed, CreditCard } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import HotelRoomSelector from './hotelRoomSelector';
import './newBookingModal.css';

const NewBookingModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // States para sa packages at destinations
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Destination search dropdown state
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const destRef = useRef(null);

  // Departure date state
  const [departureDate, setDepartureDate] = useState('');

  // Step 1: Pax + package type states
  const [paxCount, setPaxCount] = useState(1);
  const [isSoloPkg, setIsSoloPkg] = useState(false);
  const [isMinTwoPkg, setIsMinTwoPkg] = useState(false);
  const [isSoloJoinersPkg, setIsSoloJoinersPkg] = useState(false);

  // Hotel states
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [hotelData, setHotelData] = useState(null);
  const [loadingHotelData, setLoadingHotelData] = useState(false);

  // 2-step form state
  const [currentStep, setCurrentStep] = useState(1);

  // Promo & Total computation states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [finalPackageTotal, setFinalPackageTotal] = useState(0);

  // FORM STATE
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    packageName: '',
    startDate: '',
    endDate: '',
    duration: '',
    pax: { adult: 1, children: 0, infants: 0 },
    totalAmount: 0,
    paymentType: 'full',
    initialPaymentAmount: 0,
    isWalkin: true,
    message: '',
    passengers: [{
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', age: '', gender: '', address: '', nationality: 'Filipino'
    }]
  });

  // Close destination dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setDestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch packages + destinations kapag bumukas ang modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchPackages = async () => {
      try {
        const res = await fetch('https://wanderwaveph.onrender.com/api/packages/all');
        const data = await res.json();

        if (data.status === 'ok' || data.success) {
          const pkgList = data.data || data;
          setPackages(pkgList);

          const uniqueDests = [...new Set(pkgList.map(p => p.destination))]
            .filter(Boolean)
            .sort();
          setDestinations(uniqueDests);
        }
      } catch (err) {
        console.error('Failed to load packages', err);
        toast.error('Failed to load destinations and packages');
      }
    };

    fetchPackages();
  }, [isOpen]);

  // Cascading logic — Destination → Packages
  useEffect(() => {
    if (!selectedDestination) {
      setFilteredPackages([]);
      return;
    }
    const filtered = packages.filter(p => p.destination === selectedDestination);
    setFilteredPackages(filtered);
  }, [selectedDestination, packages]);

  // Mirror logic — paxCount ↔ passengers array
  useEffect(() => {
  if (paxCount < 1) return;

  setFormData(prev => {
    let currentPassengers = [...prev.passengers];

    if (currentPassengers.length < paxCount) {
      while (currentPassengers.length < paxCount) {
        currentPassengers.push({
          firstName: '', lastName: '', email: '', phone: '',
          dateOfBirth: '', age: '', gender: '', address: '', nationality: 'Filipino'
        });
      }
    } else if (currentPassengers.length > paxCount) {
      currentPassengers = currentPassengers.slice(0, paxCount);
    }

    return { ...prev, passengers: currentPassengers };
  });
}, [paxCount]);

  // Fetch Hotel Data when destination + modal is open
  useEffect(() => {
    if (!selectedDestination || !isOpen) return;

    const fetchHotelData = async () => {
      setLoadingHotelData(true);
      try {
        const city = selectedDestination.split(',')[0].trim();
        const res = await fetch(`https://wanderwaveph.onrender.com/api/hotels/location/${encodeURIComponent(city)}/rooms`);
        const data = await res.json();

        if (data.success && data.data?.length > 0) {
          setHotelData({ name: `${city} Hotels`, location: city, roomTypes: data.data });
          setSelectedRoomType(data.data[0]);
        }
      } catch (err) {
        console.error('Hotel fetch error', err);
      } finally {
        setLoadingHotelData(false);
      }
    };

    fetchHotelData();
  }, [selectedDestination, isOpen]);

  // Update total kapag nagbago ang pax o room o package
  useEffect(() => {
    if (selectedPackage) {
      setFinalPackageTotal(computeFinalTotal());
    }
  }, [selectedPackage, paxCount, selectedRoomType]);

  // AUTO HALF PAYMENT LOGIC — kapag partial payment
  useEffect(() => {
    if (formData.paymentType === 'partial') {
      const total = computeFinalTotal();
      const halfAmount = Math.round(total / 2);   // exact half, rounded to nearest peso
      updateField('initialPaymentAmount', halfAmount);
    } else {
      // Kapag full payment, i-clear ang initial amount
      updateField('initialPaymentAmount', 0);
    }
  }, [formData.paymentType, selectedPackage, paxCount, selectedRoomType]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePassenger = (index, field, value) => {
    const newPassengers = [...formData.passengers];
    newPassengers[index][field] = value;
    setFormData(prev => ({ ...prev, passengers: newPassengers }));
  };

  const getDurationDays = (durationStr) => {
    if (!durationStr) return 1;
    const match = durationStr.match(/(\d+)D/i);
    return match ? parseInt(match[1]) : 1;
  };

  const calculateBasePackageTotal = () => {
  if (!selectedPackage) return 0;
  const basePrice = selectedPackage.price || 0;

  if (isSoloPkg) {
    return basePrice * 1;                    // Solo = 1 pax lang
  }

  if (isMinTwoPkg) {
    const baseFor2 = basePrice * 2;           // first 2 pax = full price each
    const additional = Math.max(0, paxCount - 2);

    let additionalCost = 0;
    if (additional > 0) {
      // EXACT rule mo:
      // +1 pax  → kalahati lang ng package price
      // +2 pax  → package price x 2
      // (para sa higit pa, ginawa kong half per pax para consistent)
      additionalCost = additional * (basePrice * 0.5);
    }
    return baseFor2 + additionalCost;
  }

  // Solo/Joiners at iba pa = normal per pax
  return basePrice * paxCount;
};

  const calculateHotelTotal = () => {
    if (!selectedRoomType) return 0;
    const nights = getDurationDays(selectedPackage?.duration || '1D') - 1;
    const roomsNeeded = Math.ceil(paxCount / (selectedRoomType.capacity || 4));
    const rate = selectedRoomType.type?.toUpperCase().includes('4') ? 1660 :
                 selectedRoomType.type?.toUpperCase().includes('5') ? 2500 : 0;
    return rate * nights * roomsNeeded;
  };

    const computeFinalTotal = () => {
    const base = calculateBasePackageTotal();
    const hotel = calculateHotelTotal();
    return base + hotel;
  };

  // ── NEW: Amount na talagang babayaran ngayon ──
  const payableAmount = formData.paymentType === 'partial'
    ? (formData.initialPaymentAmount || 0)
    : computeFinalTotal();

  const detectPackageType = (pkg) => {
  if (!pkg) return;

  const nameLower = (pkg.title || '').toLowerCase();

  const titleIsSolo = /\bsolo\b/i.test(nameLower) && !/solo\s*\/\s*joiners/i.test(nameLower);
  const titleIsSoloJoiners = /solo\s*\/\s*joiners/i.test(nameLower);
  const titleIsMinTwo = /min\s*of\s*2|min\.?\s*2|minimum\s*2|min 2 pax/i.test(nameLower);

  const solo = titleIsSolo || pkg.pax === 1;
  const soloJoiners = titleIsSoloJoiners || pkg.tourType === 'joiners';
  const minTwo = titleIsMinTwo || (pkg.tourType === 'private' && pkg.pax === 2);

  setIsSoloPkg(solo);
  setIsMinTwoPkg(minTwo);
  setIsSoloJoinersPkg(soloJoiners);

  // Bagong logic para sa minimum pax
  let initialPax = 1;
  if (solo) initialPax = 1;
  else if (minTwo) initialPax = 2;
  else if (soloJoiners) initialPax = 1;
  else initialPax = 2;

  setPaxCount(initialPax);
};

  const addPassenger = () => {
    setPaxCount(prev => prev + 1);
  };

  const removePassenger = (index) => {
  if (formData.passengers.length === 1) return;
  
  const min = isMinTwoPkg ? 2 : 1;
  if (paxCount <= min) return;   // hindi puwedeng bumaba sa minimum

  setPaxCount(prev => prev - 1);
};

  const handleSubmit = async () => {
    if (!selectedPackage || !departureDate) {
      toast.error('Please select a package and departure date');
      return;
    }
    if (paxCount < 1) {
      toast.error('Pax count cannot be zero');
      return;
    }

    setShowConfirm(false);
    setLoading(true);

    try {
      const start = new Date(departureDate);
      const days = getDurationDays(selectedPackage.duration);
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      const computedEndDate = end.toISOString().split('T')[0];

      const bookingData = {
        ...formData,
        packageId: selectedPackage?._id,
        startDate: departureDate,
        endDate: computedEndDate,
        duration: selectedPackage?.duration,
        price: selectedPackage.price,
        finalPackageTotal: computeFinalTotal(),
        totalAmount: payableAmount,
        pax: { adult: paxCount, children: 0, infants: 0 },
        selectedRoomType: selectedRoomType?.type || null,
        hotelName: selectedRoomType?.hotelName || null,
        numberOfRooms: Math.ceil(paxCount / (selectedRoomType?.capacity || 4)),
        isWalkin: true,
        status: 'confirmed',
      };

      const formPayload = new FormData();
      formPayload.append('bookingData', JSON.stringify(bookingData));

      const res = await fetch('https://wanderwaveph.onrender.com/api/bookings', {
        method: 'POST',
        body: formPayload,
      });

      const result = await res.json();

      if (result.success) {
        toast.success('New booking created successfully!', 'Success');
        handleClose();
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to create booking');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup kapag isasara ang modal
  const handleClose = () => {
    updateField('initialPaymentAmount', 0);
    onClose();
  };

  if (!isOpen) return null;

  // Filtered destinations for searchable dropdown
  const filteredDestinations = destinations.filter(dest =>
    dest.toLowerCase().includes(selectedDestination.toLowerCase())
  );

  return (
    <div className="nbm-overlay">
      <div className="nbm-modal">

        {/* ── HEADER ── */}
        <div className="nbm-header">
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            Create New Booking
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 1,
              padding: '0 4px',
              borderRadius: '6px',
              transition: 'color 0.2s'
            }}
          >
            ×
          </button>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="nbm-progress">
          <div className={`nbm-step ${currentStep === 1 ? 'active' : ''}`}>
            <div className={`nbm-step-dot ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            Trip Details
          </div>
          <div className="nbm-progress-line" style={{ background: currentStep === 2 ? '#f59e0b' : '#e2e8f0' }} />
          <div className={`nbm-step ${currentStep === 2 ? 'active' : ''}`}>
            <div className={`nbm-step-dot ${currentStep === 2 ? 'active' : ''}`}>2</div>
            Hotel & Payment
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="nbm-body">

          {/* ════════════════ STEP 1 ════════════════ */}
          {currentStep === 1 && (
            <>
              <h3 className="nbm-step-title">Trip Details</h3>
              <p className="nbm-step-subtitle">Fill in customer info, destination, package, and passengers.</p>

              {/* CARD WRAPPER — Basic Info + Destination + Package */}
              <div className="nbm-card">

                {/* BASIC INFO */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="nbm-field">
                    <label>Customer Full Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      value={formData.fullName}
                      onChange={e => updateField('fullName', e.target.value)}
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                  <div className="nbm-field">
                    <label>Email <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                      placeholder="customer@email.com"
                    />
                  </div>
                </div>

                {/* ── DESTINATION — Searchable ── */}
                <div className="nbm-field" style={{ marginTop: '16px' }} ref={destRef}>
                  <label>Destination <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={selectedDestination}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedDestination(val);
                        setDestDropdownOpen(true);
                        if (val !== selectedDestination) {
                          setSelectedPackage(null);
                          setDepartureDate('');
                          setPaxCount(1);
                          setIsSoloPkg(false);
                          setIsMinTwoPkg(false);
                          setIsSoloJoinersPkg(false);
                          updateField('packageName', '');
                          setHotelData(null);
                          setSelectedRoomType(null);
                        }
                      }}
                      onFocus={() => setDestDropdownOpen(true)}
                      placeholder="Type to search destination..."
                    />

                    {/* Filtered dropdown list */}
                    {destDropdownOpen && selectedDestination && filteredDestinations.length > 0 && (
                      <div className="nbm-dest-dropdown">
                        {filteredDestinations.map(dest => (
                          <div
                            key={dest}
                            className="nbm-dest-option"
                            onMouseDown={() => {
                              setSelectedDestination(dest);
                              setSelectedPackage(null);
                              setDepartureDate('');
                              setPaxCount(1);
                              setIsSoloPkg(false);
                              setIsMinTwoPkg(false);
                              setIsSoloJoinersPkg(false);
                              updateField('packageName', '');
                              setHotelData(null);
                              setSelectedRoomType(null);
                              setDestDropdownOpen(false);
                            }}
                          >
                            <span className="nbm-dest-pin">📍</span> {dest}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results state */}
                    {destDropdownOpen && selectedDestination && filteredDestinations.length === 0 && (
                      <div className="nbm-dest-dropdown">
                        <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                          No destinations found
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PACKAGE DROPDOWN — only shown when a valid destination is selected */}
                {selectedDestination && destinations.includes(selectedDestination) && (
                  <div className="nbm-field" style={{ marginTop: '16px' }}>
                    <label>Package <span style={{ color: 'red' }}>*</span></label>
                    <select
                      value={selectedPackage?._id || ''}
                      onChange={e => {
                        const pkg = filteredPackages.find(p => p._id === e.target.value);
                        if (pkg) {
                          setSelectedPackage(pkg);
                          setDepartureDate('');
                          const displayName = `${pkg.duration} ${pkg.destination} ${pkg.title}`;
                          updateField('packageName', displayName);
                          updateField('duration', pkg.duration);
                          detectPackageType(pkg);
                          setSelectedDestination(pkg.destination);
                        }
                      }}
                    >
                      <option value="">Select Package</option>
                      {filteredPackages.map(pkg => {
                        const display = `${pkg.duration} ${pkg.destination} ${pkg.title}`;
                        return (
                          <option key={pkg._id} value={pkg._id}>{display}</option>
                        );
                      })}
                    </select>
                  </div>
                )}

              </div>{/* end nbm-card */}

              {/* PAX SELECTOR — with clear Number of Pax label */}
{selectedPackage && (
  <div className="nbm-card" style={{ marginTop: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <label style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
        Number of Pax
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        {isSoloPkg && <span className="nbm-badge nbm-badge-green">Solo Package - Fixed 1 Pax</span>}
        {isMinTwoPkg && <span className="nbm-badge nbm-badge-blue">Min. 2 Pax</span>}
        {isSoloJoinersPkg && <span className="nbm-badge nbm-badge-green">Solo / Joiners</span>}
      </div>
    </div>

    {isSoloPkg ? (
      <div className="nbm-pax-solo">
        <span>1 Pax (Solo - Fixed)</span>
      </div>
    ) : (
      <div className="nbm-pax-counter">
        <button
          className="nbm-pax-btn"
          onClick={() => {
            const min = isMinTwoPkg ? 2 : 1;
            if (paxCount > min) setPaxCount(paxCount - 1);
          }}
          disabled={paxCount <= (isMinTwoPkg ? 2 : 1)}
        >
          −
        </button>
        <span className="nbm-pax-count">{paxCount}</span>
        <button
          className="nbm-pax-btn"
          onClick={() => setPaxCount(paxCount + 1)}
        >
          +
        </button>
      </div>
    )}
  </div>
)}

              {/* DEPARTURE DATE */}
              {selectedPackage && (
                <div className="nbm-card" style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Departure Date <span style={{ color: 'red' }}>*</span>
                  </label>

                  <input
                    type="date"
                    value={departureDate}
                    onChange={e => {
                      const date = new Date(e.target.value);
                      const day = date.getDay();

                      if (isSoloJoinersPkg && ![5, 6, 0].includes(day)) {
                        toast.error('Solo/Joiners packages can only depart on Friday, Saturday, or Sunday.');
                        return;
                      }

                      setDepartureDate(e.target.value);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%' }}
                  />

                  {isSoloJoinersPkg && (
                    <p style={{ fontSize: '0.85rem', color: '#166534', margin: '6px 0 0' }}>
                      📅 Only Friday, Saturday, or Sunday departures allowed for Solo/Joiners packages.
                    </p>
                  )}

                  {departureDate && (
                    <div className="nbm-date-preview">
                      <div className="nbm-date-preview-row">
                        <div><strong>Departure:</strong> {departureDate}</div>
                        <div style={{ fontSize: '1.1rem', color: '#f59e0b' }}>→</div>
                        <div>
                          <strong>Return:</strong>{' '}
                          {(() => {
                            const s = new Date(departureDate);
                            const days = getDurationDays(selectedPackage.duration);
                            s.setDate(s.getDate() + days - 1);
                            return s.toISOString().split('T')[0];
                          })()}
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.92rem', color: '#166534', fontWeight: 600 }}>
                        📅 {selectedPackage.duration} Trip • {getDurationDays(selectedPackage.duration)} days
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PASSENGERS SECTION */}
              <div style={{ marginTop: '24px', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
                    <Users size={18} /> Passengers
                  </h3>
                  {!isSoloPkg && (
                    <button className="nbm-btn-add-passenger" onClick={addPassenger}>
                      + Add Passenger
                    </button>
                  )}
                </div>

                {formData.passengers.map((p, i) => (
                  <div key={i} className="nbm-passenger-card">
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Passenger {i + 1}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input placeholder="First Name" value={p.firstName} onChange={e => updatePassenger(i, 'firstName', e.target.value)} />
                      <input placeholder="Last Name" value={p.lastName} onChange={e => updatePassenger(i, 'lastName', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <input placeholder="Email" value={p.email} onChange={e => updatePassenger(i, 'email', e.target.value)} />
                      <input placeholder="Phone" value={p.phone} onChange={e => updatePassenger(i, 'phone', e.target.value)} />
                    </div>
                    {formData.passengers.length > 1 && (
                      <button
                        onClick={() => removePassenger(i)}
                        style={{ marginTop: '10px', color: '#ef4444', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ✕ Remove Passenger
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ════════════════ STEP 2 ════════════════ */}
          {currentStep === 2 && (
            <>
              <h3 className="nbm-step-title">Accommodation & Payment</h3>
              <p className="nbm-step-subtitle">Choose hotel tier, apply promo, and review total.</p>

              {/* CARD WRAPPER */}
              <div className="nbm-card">

                {/* ── Hotel Room Selector ── */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ marginBottom: '12px', fontWeight: 700, color: '#0f172a', fontSize: '1rem', margin: '0 0 12px' }}>
                    Choose Accommodation Tier
                  </h4>

                  {hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0 ? (
                    <HotelRoomSelector
                      roomTypes={hotelData.roomTypes}
                      selectedRoomType={selectedRoomType}
                      onRoomTypeChange={setSelectedRoomType}
                      numberOfPax={paxCount}
                      durationDays={getDurationDays(selectedPackage?.duration || '1D')}
                      durationNights={getDurationDays(selectedPackage?.duration || '1D') - 1}
                    />
                  ) : (
                    <div style={{ padding: '20px', background: '#fefce8', borderRadius: '10px', color: '#854d0e', textAlign: 'center', fontWeight: 600 }}>
                      No hotels available for this destination yet.
                    </div>
                  )}
                </div>

                {/* ── Promo Field ── */}
                <div className="nbm-field">
                  <label>
                    Promo Code{' '}
                    <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.85rem' }}>(optional)</span>
                  </label>
                  <input
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                  />
                </div>

                {/* ── Payment Type ── */}
                <div className="nbm-field" style={{ marginTop: '20px' }}>
                  <label>Payment Type</label>
                  <select
                    value={formData.paymentType}
                    onChange={e => updateField('paymentType', e.target.value)}
                  >
                    <option value="full">Pay in Full</option>
                    <option value="partial">Partial Payment</option>
                  </select>
                </div>

                {formData.paymentType === 'partial' && (
                  <div className="nbm-field" style={{ marginTop: '12px' }}>
                    <label>
                      Initial Payment Amount (₱)
                      <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
                        {' '}— 50% of Total (auto)
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formData.initialPaymentAmount}
                      readOnly
                      style={{
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                )}

              </div>{/* end nbm-card */}

              {/* ── Total Summary ── */}
              <div className="nbm-total-box">
                <div className="nbm-total-row">
                  <span>Package Total</span>
                  <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
                </div>
                {selectedRoomType && (
                  <div className="nbm-total-row" style={{ fontSize: '0.95rem', color: '#64748b' }}>
                    <span>Hotel Accommodation</span>
                    <span>₱{calculateHotelTotal().toLocaleString()}</span>
                  </div>
                )}

                {/* Final / Payable amount */}
                <div className="nbm-total-row nbm-total-final">
                  <strong>
                    {formData.paymentType === 'partial' 
                      ? 'INITIAL PAYMENT DUE NOW (50%)' 
                      : 'FINAL TOTAL'}
                  </strong>
                  <strong>₱{payableAmount.toLocaleString()}</strong>
                </div>

                {/* Extra note kapag partial */}
                {formData.paymentType === 'partial' && (
                  <p style={{
                    textAlign: 'right',
                    fontSize: '0.85rem',
                    color: '#64748b',
                    marginTop: '8px',
                    fontWeight: 600
                  }}>
                    (50% deposit • Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure)
                  </p>
                )}
              </div>
            </>
          )}

        </div>{/* end nbm-body */}

        {/* ── FOOTER BUTTONS ── */}
        <div className="nbm-footer">
          {currentStep === 2 && (
            <button className="nbm-btn nbm-btn-back" onClick={() => setCurrentStep(1)}>
              ← Back
            </button>
          )}

          {currentStep === 1 ? (
            <button
              className="nbm-btn nbm-btn-next"
              onClick={() => setCurrentStep(2)}
              disabled={!selectedPackage || !departureDate}
            >
              Continue to Hotel & Payment →
            </button>
          ) : (
            <button
              className="nbm-btn nbm-btn-next"
              onClick={() => setShowConfirm(true)}
              disabled={loading || !selectedRoomType}
            >
              {loading ? 'Creating Booking...' : 'Create Booking ✓'}
            </button>
          )}
        </div>

      </div>

      {/* BEAUTIFUL BOOKING PREVIEW MODAL */}
      {showConfirm && (
        <div 
          className="nbm-preview-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
        >
          <div className="nbm-preview-modal" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="nbm-preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Booking Preview</h2>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>Please review before creating</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ background: 'none', border: 'none', fontSize: '32px', color: 'white', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="nbm-preview-body">

              {/* Customer */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">
                  <span>👤</span> Customer Information
                </div>
                <div className="nbm-preview-row">
                  <strong>{formData.fullName || '—'}</strong>
                  <span>{formData.email || '—'}</span>
                </div>
              </div>

              {/* Trip Details */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">
                  <MapPin size={18} /> Trip Details
                </div>
                <div className="nbm-preview-row">
                  <span>Destination</span>
                  <strong>{selectedDestination}</strong>
                </div>
                <div className="nbm-preview-row">
                  <span>Package</span>
                  <strong>{selectedPackage?.title || '—'}</strong>
                </div>
                <div className="nbm-preview-row">
                  <span><Calendar size={16} style={{ display: 'inline', marginRight: 4 }} /> Departure</span>
                  <strong>{departureDate}</strong>
                </div>
                <div className="nbm-preview-row">
                  <span>Return Date</span>
                  <strong>
                    {(() => {
                      const s = new Date(departureDate);
                      const days = getDurationDays(selectedPackage?.duration || '1D');
                      s.setDate(s.getDate() + days - 1);
                      return s.toISOString().split('T')[0];
                    })()}
                  </strong>
                </div>
                <div className="nbm-preview-row">
                  <span>Number of Pax</span>
                  <strong>{paxCount} {isSoloPkg ? '(Solo)' : isMinTwoPkg ? '(Min 2)' : ''}</strong>
                </div>
              </div>

              {/* Passengers */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">
                  <Users size={18} /> Passengers ({formData.passengers.length})
                </div>
                {formData.passengers.map((p, i) => (
                  <div key={i} className="nbm-preview-passenger">
                    <strong>Passenger {i + 1}:</strong> {p.firstName} {p.lastName}
                    {p.phone && <span style={{ marginLeft: 12, color: '#64748b' }}>• {p.phone}</span>}
                  </div>
                ))}
              </div>

              {/* Accommodation */}
              {selectedRoomType && (
                <div className="nbm-preview-section">
                  <div className="nbm-preview-section-title">
                    <Bed size={18} /> Accommodation
                  </div>
                  <div className="nbm-preview-row">
                    <span>Room Type</span>
                    <strong>{selectedRoomType.type}</strong>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">
                  <CreditCard size={18} /> Payment Summary
                </div>
                <div className="nbm-preview-row">
                  <span>Package Total</span>
                  <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
                </div>
                {selectedRoomType && (
                  <div className="nbm-preview-row">
                    <span>Hotel Accommodation</span>
                    <span>₱{calculateHotelTotal().toLocaleString()}</span>
                  </div>
                )}

                {/* BIG TOTAL */}
                <div className="nbm-preview-total">
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    {formData.paymentType === 'partial' ? 'INITIAL PAYMENT DUE NOW' : 'TOTAL AMOUNT'}
                  </div>
                  <div className="nbm-due-now">
                    ₱{payableAmount.toLocaleString()}
                  </div>
                  {formData.paymentType === 'partial' && (
                    <p style={{ marginTop: 8, color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>
                      50% deposit • Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div style={{
              padding: '24px 32px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              background: '#fff'
            }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="nbm-btn nbm-btn-back"
                style={{ flex: 1 }}
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="nbm-btn nbm-btn-next"
                style={{ flex: 1 }}
              >
                {loading ? 'Creating Booking...' : '✅ Confirm & Create Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewBookingModal;