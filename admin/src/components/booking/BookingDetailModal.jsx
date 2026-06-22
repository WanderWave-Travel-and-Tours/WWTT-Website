import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Check, DollarSign, Calendar, User, Mail, Wallet, CreditCard, FileText, Smartphone, Store, Image, File, ReceiptText } from 'lucide-react';
import './BookingDetailModal.css'; 
import VoucherPreviewModal from './VoucherPreviewModal';
import OrderSlipModal from './OrderSlipModal';

const getAdminHeaders = () => {
    const token = sessionStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

// Smart Destination Resolver - Fixes wrong destination like "BOHOL" when title indicates Siargao
const getRealDestination = (packageTitle, storedDestination, packageData = null) => {
    const title = (packageTitle || '').toLowerCase().trim();
    const dest = (storedDestination || '').toLowerCase().trim();

    // Priority 1: Strong keywords in the actual package title (most reliable)
    if (title.includes('siargao')) return 'Siargao';
    if (title.includes('bohol')) return 'Bohol';
    if (title.includes('boracay')) return 'Boracay';
    if (title.includes('palawan') || title.includes('el nido') || title.includes('coron')) return 'Palawan';
    if (title.includes('cebu')) return 'Cebu';
    if (title.includes('clark') || title.includes('pampanga')) return 'Clark / Pampanga';

    // Priority 2: If stored destination looks wrong but title has "solo/joiners" or generic
    if ((dest === 'bohol' || dest === '') && 
        (title.includes('solo') || title.includes('joiners') || title === 'solo/joiners')) {
        
        // Check packageData destination as backup
        if (packageData?.destination && packageData.destination.toLowerCase() !== 'bohol') {
            return packageData.destination;
        }
        
        // Last resort: Assume Siargao for this specific mismatch (you can expand later)
        return 'Siargao';
    }

    // Priority 3: Use stored destination if it seems reasonable
    if (dest && dest !== 'bohol' && dest.length > 2) {
        return storedDestination; // Return original casing
    }

    return storedDestination || 'Philippines';
};

// ── Helper: build itinerary array from start/end dates ──────────────────────
const buildItinerary = (startDate, endDate, duration) => {
    if (!startDate) return [];

    const start = new Date(startDate);
    let days = 1;

    if (endDate) {
        const end = new Date(endDate);
        days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    } else if (duration) {
        const match = duration.match(/(\d+)\s*[Dd]/);
        if (match) days = parseInt(match[1]);
    }

    if (days < 1) days = 1;

    return Array.from({ length: days }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        let activity = `Day ${i + 1} Activities`;
        if (i === 0) activity = 'Arrival, Airport Pickup & Hotel Check-in';
        if (i === days - 1 && days > 1) activity = 'Hotel Check-out & Transfer to Airport – End of Service';
        return {
            day: i + 1,
            date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            activity,
        };
    });
};

export const BookingDetailModal = ({ 
    showModal, 
    selectedBooking, 
    setShowModal, 
    handleConfirm,
    handleCancel,
    handleArchive,           // ← idagdag
    actionLoading,
    CheckCircleIcon,
    AlertCircleIcon,
    XCircleIcon,
    CheckIcon,
    XIcon,
    ArchiveIcon,             // ← idagdag
    RotateCcwIcon
}) => {
    const [showVoucherPreview, setShowVoucherPreview] = useState(false);
    const [voucherData, setVoucherData] = useState(null);
    const [submittedDocs, setSubmittedDocs] = useState([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
    const [showOrderSlip, setShowOrderSlip] = useState(false);

    // Fetch submitted documents whenever the modal opens for a booking
    useEffect(() => {
        if (!showModal || !selectedBooking?.mongoId) {
            setSubmittedDocs([]);
            return;
        }
        const fetchDocs = async () => {
            setIsLoadingDocs(true);
            try {
                const res = await fetch(`https://wanderwaveph.onrender.com/api/documents/inquiry/${selectedBooking.mongoId}`);
                const data = await res.json();
                if (data.success) {
                    setSubmittedDocs(data.documents || []);
                } else {
                    setSubmittedDocs([]);
                }
            } catch (err) {
                console.error('Error fetching booking documents:', err);
                setSubmittedDocs([]);
            } finally {
                setIsLoadingDocs(false);
            }
        };
        fetchDocs();
    }, [showModal, selectedBooking?.mongoId]);

    if (!showModal || !selectedBooking) return null;

    const closeModal = () => setShowModal(false);

    const hasDocuments = submittedDocs.length > 0;

    const handleConfirmAndClose = (booking) => {
        handleConfirm(booking);
    };

    const handleCancelAndClose = (booking) => handleCancel(booking);

    // ── Generate voucher: fetch full booking from API so we get real inclusions ──
    // ── Generate voucher: fetch full booking from API so we get real inclusions ──
// ── Generate voucher with Smart Destination Detection ──
const generateVoucherData = async (booking) => {
    setIsGeneratingVoucher(true);
    try {
        // 1. Fetch full booking details
        const res = await fetch(`https://wanderwaveph.onrender.com/api/bookings/${booking.mongoId}`);
        if (!res.ok) throw new Error(`Failed to fetch booking: ${res.status}`);
        const fullBooking = await res.json();

        // 2. Fetch package data (by ID or fallback by title)
        let packageData = null;
        const packageId = fullBooking.packageId?._id || fullBooking.packageId;

        if (packageId) {
            try {
                const pkgRes = await fetch(`https://wanderwaveph.onrender.com/api/packages/admin/${packageId}`, { headers: getAdminHeaders() });
                if (pkgRes.ok) {
                    const pkgJson = await pkgRes.json();
                    packageData = pkgJson.data || pkgJson;
                }
            } catch (e) { /* silent */ }
        }

        // Fallback: search by packageName if needed
        if (!packageData && fullBooking.packageName) {
            try {
                const allRes = await fetch(`https://wanderwaveph.onrender.com/api/packages/admin/all`, { headers: getAdminHeaders() });
                if (allRes.ok) {
                    const allPkgs = await allRes.json();
                    const found = (allPkgs.data || allPkgs).find(p => 
                        p.title?.trim() === fullBooking.packageName?.trim()
                    );
                    if (found) packageData = found;
                }
            } catch (e) { /* silent */ }
        }

        // ── 3. SMART DESTINATION RESOLVER ──
        const getRealDestination = (pkgTitle, storedDest, pkgData) => {
            const title = (pkgTitle || '').toLowerCase();
            const dest = (storedDest || '').toLowerCase();

            // Strong keyword detection from title (most reliable)
            if (title.includes('siargao')) return 'Siargao';
            if (title.includes('bohol')) return 'Bohol';
            if (title.includes('boracay')) return 'Boracay';
            if (title.includes('palawan') || title.includes('el nido') || title.includes('coron')) return 'Palawan';
            if (title.includes('cebu')) return 'Cebu';

            // Fix common mismatch: "solo/joiners" with wrong Bohol destination
            if ((dest === 'bohol' || dest === '') && 
                (title.includes('solo') || title.includes('joiners') || title === 'solo/joiners')) {
                return 'Siargao';   // ← This is the key fix for your current booking
            }

            // Use stored destination if it seems valid
            if (dest && dest !== 'bohol' && dest.length > 2) {
                return storedDest;
            }

            return storedDest || pkgData?.destination || 'Philippines';
        };

        // ── 4. Build clean package display name ──
        const pkgDuration = (packageData?.duration || fullBooking.duration || '4D3N').trim();
        const pkgTitle = (packageData?.title || fullBooking.packageName || booking.packageName || 'Solo/Joiners').trim();
        const finalDestination = getRealDestination(
            pkgTitle, 
            packageData?.destination || fullBooking.destination || selectedBooking.destination,
            packageData
        );

        const displayPackageName = [pkgDuration, finalDestination, pkgTitle]
            .filter(Boolean)
            .join(' | ');

        // ── 5. Inclusions (keep your existing accurate logic) ──
        let inclusions = [];

        if (fullBooking.isCustomized && Array.isArray(fullBooking.customizedInclusions)) {
            inclusions = fullBooking.customizedInclusions
                .filter(i => i.isChecked !== false)
                .map(i => i.name)
                .filter(Boolean);
        }

        if (inclusions.length === 0 && Array.isArray(packageData?.inclusions)) {
            inclusions = packageData.inclusions.filter(Boolean);
        }

        if (inclusions.length === 0 && Array.isArray(fullBooking.packageId?.inclusions)) {
            inclusions = fullBooking.packageId.inclusions.filter(Boolean);
        }

        if (inclusions.length === 0 && Array.isArray(fullBooking.originalInclusions)) {
            inclusions = fullBooking.originalInclusions.filter(Boolean);
        }

        if (inclusions.length === 0) {
            inclusions = ['Package inclusions not specified. Please contact the agency.'];
        }

        // ── 6. Guest List & Itinerary ──
        let guestList = [];
        if (Array.isArray(fullBooking.passengers) && fullBooking.passengers.length > 0) {
            guestList = fullBooking.passengers.map(p => ({
                name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || fullBooking.fullName,
                age: p.age ?? 'N/A',
                nationality: p.nationality || 'Filipino',
            }));
        }
        if (guestList.length === 0) {
            guestList = [{ name: fullBooking.fullName || booking.customerName, age: 'N/A', nationality: 'Filipino' }];
        }

        const itinerary = buildItinerary(fullBooking.startDate, fullBooking.endDate, fullBooking.duration);

        // ── 7. Final Voucher Object ──
        const voucher = {
            clientName: fullBooking.fullName || booking.customerName,
            clientEmail: fullBooking.email || booking.email,
            clientPhone: fullBooking.primaryContact?.phone || 'N/A',

            travelDate: formatDate(fullBooking.startDate) || booking.travelDate,

            // FIXED: Now correctly shows "4D3N | Siargao | solo/joiners" or better
            packageName: displayPackageName,

            packageRate: fullBooking.totalAmount / ((fullBooking.pax?.adult || booking.guests) || 1),
            numberOfGuests: fullBooking.pax?.adult || booking.guests || 1,

            guestList,
            inclusions,
            exclusions: ['Snorkeling Gears', 'Other Entrance fees not included', 'Travel Insurance'],
            amenities: { amenities: ['Free Wi-Fi'], facilities: ['Air conditioning'] },
            itinerary,

            totalAmount: fullBooking.totalAmount || booking.totalAmount,
            downPayment: (fullBooking.totalAmount || booking.totalAmount) - (fullBooking.remainingBalance || 0),
            amountDue: fullBooking.remainingBalance || 0,

            referenceNumber: fullBooking.referenceNumber || booking.referenceNumber,
        };

        setVoucherData(voucher);
        setShowVoucherPreview(true);

    } catch (err) {
        console.error('❌ Error generating voucher:', err);
        alert('May error sa pag-load ng voucher data. Please try again.');
    } finally {
        setIsGeneratingVoucher(false);
    }
};

    const getStatusConfig = (status) => {
        const configs = {
          PENDING: { color: "amber", icon: AlertCircle, label: "Pending Review", description: "Awaiting confirmation" },
          CONFIRMED: { color: "green", icon: CheckCircle, label: "Confirmed", description: "Booking is active" },
          CANCELLED: { color: "red", icon: X, label: "Cancelled", description: "Request was cancelled" },
        };
        return configs[status.toUpperCase()] || configs.PENDING;
    };
    
    const status = (selectedBooking.status || 'PENDING').toUpperCase();
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

    // ✅ Walk-in logic
    const isWalkin = selectedBooking.isWalkin || false;
    
    // Payment calculations - ✅ Adjusted for walk-in
    const isPartialPayment = !isWalkin && selectedBooking.paymentType === 'partial'; // Walk-in never partial
    const totalAmount = selectedBooking.totalAmount || 0;
    const remainingBalance = isWalkin ? 0 : (selectedBooking.remainingBalance || 0); // Walk-in has no balance
    const balancePaid = isWalkin ? totalAmount : (selectedBooking.balancePaidAmount || 0); // Walk-in is fully paid
    
    const initialPaid = totalAmount - remainingBalance;
    const totalPaid = initialPaid + balancePaid;
    
    const isFullyPaid = isWalkin || (balancePaid > 0 && remainingBalance <= 0); // ✅ Walk-in is always fully paid
    const isPendingPayment = !isWalkin && !isPartialPayment && status === 'PENDING'; // ✅ Walk-in never pending payment

    // Payment Method Logic
    const paymentMethod = isWalkin ? 'Pay Over the Counter' : 'Online Payment';
    const PaymentMethodIcon = isWalkin ? Store : Smartphone;

    return (
        <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div className="modal-overlay" onClick={closeModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="cnm-header-content">
                            <div className="cnm-title-group">
                                <h2 className="cnm-title">Booking Details</h2>
                                <div className="cnm-meta">
                                    <span className="cnm-ref">ID: #{selectedBooking.id}</span>
                                    <span className="cnm-divider">•</span>
                                    <span className="cnm-date">Booked: {formatDate(selectedBooking.bookingDate)}</span>
                                </div>
                            </div>
                            <div className={`cnm-status-badge cnm-status-${statusConfig.color}`}>
                                <div className="cnm-status-icon"><StatusIcon size={16} /></div>
                                <div className="cnm-status-content">
                                    <span className="cnm-status-label">{statusConfig.label}</span>
                                    <span className="cnm-status-desc">{statusConfig.description}</span>
                                </div>
                            </div>
                        </div>
                        <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="modal-body">
                        {/* CLIENT/BOOKING INFORMATION */}
                        <div className="cnm-card">
                            <div className="cnm-card-header">
                                <h3 className="cnm-card-title">Booking Information</h3>
                            </div>
                            <div className="cnm-grid">
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><User size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Client Name</label>
                                        <span className="cnm-info-value">{selectedBooking.customerName}</span>
                                    </div>
                                </div>
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><Mail size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Email Address</label>
                                        <span className="cnm-info-value">{selectedBooking.email}</span>
                                    </div>
                                </div>
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><DollarSign size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Total Amount</label>
                                        <span className="cnm-info-value cnm-val-amount">₱{selectedBooking.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><Calendar size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Travel Date</label>
                                        <span className="cnm-info-value">{selectedBooking.travelDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASSENGER DETAILS */}
                        {selectedBooking.passengers && selectedBooking.passengers.length > 0 && (
                            <div className="cnm-card">
                                <div className="cnm-card-header">
                                    <h3 className="cnm-card-title">Passenger Details</h3>
                                    <span className="cnm-badge cnm-badge-amber">
                                        {selectedBooking.passengers.length} Passenger{selectedBooking.passengers.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="cnm-passenger-list">
                                    {selectedBooking.passengers.map((passenger, index) => (
                                        <div key={index} className="cnm-passenger-card">
                                            <div className="cnm-passenger-header">
                                                <div className="cnm-passenger-avatar">
                                                    <User size={18} />
                                                </div>
                                                <div className="cnm-passenger-name-group">
                                                    <span className="cnm-passenger-name">
                                                        {passenger.firstName} {passenger.lastName}
                                                    </span>
                                                    <span className="cnm-passenger-number">Passenger #{passenger.passengerNumber || index + 1}</span>
                                                </div>
                                                <div className="cnm-passenger-badges">
                                                    <span className="cnm-pax-badge gender">{passenger.gender}</span>
                                                    <span className="cnm-pax-badge age">{passenger.age} yrs</span>
                                                </div>
                                            </div>
                                            <div className="cnm-passenger-details">
                                                <div className="cnm-passenger-details-row">
                                                    <div className="cnm-passenger-detail-item">
                                                        <span className="cnm-passenger-detail-label">✉ Email Address</span>
                                                        <span className="cnm-passenger-detail-value">{passenger.email}</span>
                                                    </div>
                                                    <div className="cnm-passenger-detail-item">
                                                        <span className="cnm-passenger-detail-label">📞 Phone Number</span>
                                                        <span className="cnm-passenger-detail-value">{passenger.phone}</span>
                                                    </div>
                                                </div>
                                                <div className="cnm-passenger-details-row">
                                                    <div className="cnm-passenger-detail-item">
                                                        <span className="cnm-passenger-detail-label">🎂 Date of Birth</span>
                                                        <span className="cnm-passenger-detail-value">{formatDate(passenger.dateOfBirth)}</span>
                                                    </div>
                                                    <div className="cnm-passenger-detail-item">
                                                        <span className="cnm-passenger-detail-label">🌏 Nationality</span>
                                                        <span className="cnm-passenger-detail-value">{passenger.nationality}</span>
                                                    </div>
                                                </div>
                                                <div className="cnm-passenger-details-row cnm-passenger-details-row-full">
                                                    <div className="cnm-passenger-detail-item">
                                                        <span className="cnm-passenger-detail-label">📍 Address</span>
                                                        <span className="cnm-passenger-detail-value">{passenger.address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ENHANCED PAYMENT DETAILS SECTION */}
                        <div className="cnm-payment-card">
                            <div className="cnm-payment-header">
                                <div className="cnm-payment-title">
                                    <CreditCard size={18} />
                                    PAYMENT DETAILS
                                </div>
                                <div className={`cnm-payment-badge ${isPartialPayment ? 'partial' : 'full'}`}>
                                    {isWalkin ? 'PAID OVER THE COUNTER' : (isPartialPayment ? 'PARTIAL PAYMENT' : 'FULL PAYMENT')}
                                </div>
                            </div>
                            
                            <div className="cnm-payment-body">
                                {/* Payment Method and Type */}
                                <div className="cnm-payment-section">
                                    {/* Payment Method Row */}
                                    <div className="cnm-payment-row">
                                        <span className="cnm-payment-label">
                                            Payment Method:
                                        </span>
                                        <span className="cnm-payment-value" style={{
                                            color: isWalkin ? '#ea580c' : '#0284c7',
                                            fontWeight: '800'
                                        }}>
                                            {paymentMethod}
                                        </span>
                                    </div>

                                    <div className="cnm-payment-row">
                                        <span className="cnm-payment-label">Payment Type:</span>
                                        <span className="cnm-payment-value">
                                            {isWalkin ? 'Paid in Full' : (isPartialPayment ? 'Pay in Partial' : 'Pay in Full')}
                                        </span>
                                    </div>
                                    <div className="cnm-payment-row">
                                        <span className="cnm-payment-label">Total Booking Amount:</span>
                                        <span className="cnm-payment-value">₱{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* ✅ WALK-IN: Always show as FULLY PAID */}
                                {isWalkin && (
                                    <>
                                        <div className="cnm-payment-divider"></div>
                                        
                                        <div className="cnm-payment-status-box paid">
                                            <div className="cnm-payment-status-left">
                                                <div className="cnm-payment-status-title">
                                                    <CheckCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                    FULLY PAID (WALK-IN)
                                                </div>
                                                <div className="cnm-payment-status-amount">
                                                    ₱{totalAmount.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="cnm-payment-status-icon">
                                                <CheckCircle size={24} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Partial Payment Breakdown - Only for NON-walk-in */}
                                {!isWalkin && isPartialPayment && (
                                    <>
                                        <div className="cnm-payment-divider"></div>
                                        
                                        <div className="cnm-payment-section">
                                            <div className="cnm-payment-row">
                                                <span className="cnm-payment-label">
                                                    <CheckCircle size={16} style={{color: '#16a34a'}} />
                                                    Initial Payment:
                                                </span>
                                                <span className="cnm-payment-value" style={{color: '#16a34a'}}>
                                                    ₱{initialPaid.toLocaleString()}
                                                </span>
                                            </div>

                                            {balancePaid > 0 && (
                                                <div className="cnm-payment-row">
                                                    <span className="cnm-payment-label">
                                                        <CheckCircle size={16} style={{color: '#16a34a'}} />
                                                        Balance Paid:
                                                    </span>
                                                    <span className="cnm-payment-value" style={{color: '#16a34a'}}>
                                                        ₱{balancePaid.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Status Box */}
                                        {remainingBalance > 0 ? (
                                            <div className="cnm-payment-status-box pending">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <AlertCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        PENDING PAYMENT
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{remainingBalance.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="cnm-payment-status-icon">
                                                    <AlertCircle size={24} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="cnm-payment-status-box paid">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <CheckCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        FULLY PAID
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{totalAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="cnm-payment-status-icon">
                                                    <CheckCircle size={24} />
                                                </div>
                                            </div>
                                        )}

                                        {selectedBooking.balancePaidAt && (
                                            <div className="cnm-payment-date">
                                                Balance paid on: {formatDate(selectedBooking.balancePaidAt)}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Full Payment Status - Only for NON-walk-in */}
                                {!isWalkin && !isPartialPayment && (
                                    <>
                                        <div className="cnm-payment-divider"></div>
                                        
                                        {isPendingPayment ? (
                                            <div className="cnm-payment-status-box pending">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <AlertCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        PENDING PAYMENT
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{totalAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="cnm-payment-status-icon">
                                                    <AlertCircle size={24} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="cnm-payment-status-box paid">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <CheckCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        FULLY PAID
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{totalAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="cnm-payment-status-icon">
                                                    <CheckCircle size={24} />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* PACKAGE DETAILS */}
                        {/* PACKAGE DETAILS */}
<div className="cnm-card">
    <div className="cnm-card-header">
        <h3 className="cnm-card-title">Package Details</h3>
        <span className="cnm-badge cnm-badge-amber">{selectedBooking.guests} PAX</span>
    </div>
    <div className="cnm-message-box">
        <h4 style={{margin: '0 0 12px 0', fontSize: '17px', fontWeight: '700'}}>
            {selectedBooking.packageName || 'solo/joiners'}
        </h4>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px 20px'}}>
            <div>
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '600'}}>Destination</label>
                <p style={{margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a'}}>
                    {getRealDestination(
                        selectedBooking.packageName, 
                        selectedBooking.destination || selectedBooking.rawData?.packageId?.destination,
                        selectedBooking.rawData?.packageId || null
                    )}
                </p>
            </div>
            
            <div>
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '600'}}>Duration</label>
                <p style={{margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a'}}>
                    {selectedBooking.duration || '4D3N'}
                </p>
            </div>
            
            <div>
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '600'}}>Reference No.</label>
                <p style={{margin: '4px 0 0 0', fontWeight: '600', color: '#475569', fontFamily: 'monospace'}}>
                    {selectedBooking.referenceNumber || 'N/A'}
                </p>
            </div>
        </div>
    </div>
</div>

                        {/* ADD-ONS SECTION */}
                        {(() => {
                            const addOns = selectedBooking.rawData?.addOns;
                            const hasTours     = Array.isArray(addOns?.tours)     && addOns.tours.length > 0;
                            const hasTransfers = Array.isArray(addOns?.transfers) && addOns.transfers.length > 0;
                            if (!hasTours && !hasTransfers) return null;
                            const itemCount = (addOns.tours?.length || 0) + (addOns.transfers?.length || 0);

                            return (
                                <div className="cnm-card">
                                    <div className="cnm-card-header">
                                        <h3 className="cnm-card-title">Add-Ons</h3>
                                        <span className="cnm-badge cnm-badge-amber">
                                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* ── TOURS ── */}
                                    {hasTours && (
                                        <div className="cnm-addons-group">
                                            <div className="cnm-addons-group-title">🗺️ Tours</div>
                                            {addOns.tours.map((tour, i) => (
                                                <div key={i} className="cnm-addon-item">
                                                    <div className="cnm-addon-item-header">
                                                        <div className="cnm-addon-item-icon tour">🗺️</div>
                                                        <div className="cnm-addon-item-info">
                                                            <span className="cnm-addon-item-name">{tour.title || 'Tour'}</span>
                                                            <div className="cnm-addon-item-meta">
                                                                {tour.destination && <span>📍 {tour.destination}</span>}
                                                                {tour.duration    && <span>⏱ {tour.duration}</span>}
                                                                {tour.category    && <span>🏷 {tour.category}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="cnm-addon-item-price">
                                                            <div className="cnm-addon-item-subtotal">
                                                                ₱{(tour.subtotal || 0).toLocaleString()}
                                                            </div>
                                                            <div className="cnm-addon-item-per">
                                                                ₱{(tour.price || 0).toLocaleString()} × {tour.paxCount || 1} pax
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ── TRANSFERS ── */}
                                    {hasTransfers && (
                                        <div className="cnm-addons-group">
                                            <div className="cnm-addons-group-title">🚐 Transfers</div>
                                            {addOns.transfers.map((transfer, i) => (
                                                <div key={i} className="cnm-addon-item">
                                                    <div className="cnm-addon-item-header">
                                                        <div className="cnm-addon-item-icon transfer">🚐</div>
                                                        <div className="cnm-addon-item-info">
                                                            <span className="cnm-addon-item-name">{transfer.title || 'Transfer'}</span>
                                                            <div className="cnm-addon-item-meta">
                                                                {transfer.category && <span>🏷 {transfer.category}</span>}
                                                                <span className={`cnm-addon-type-badge ${transfer.transferType === 'roundtrip' ? 'roundtrip' : 'oneway'}`}>
                                                                    {transfer.transferType === 'roundtrip' ? '🔄 Roundtrip' : '➡️ One Way'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="cnm-addon-item-price">
                                                            <div className="cnm-addon-item-subtotal">
                                                                ₱{(transfer.subtotal || transfer.selectedPrice || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Transfer scheduling details */}
                                                    <div className="cnm-addon-transfer-details">
                                                        {transfer.travelDate && (
                                                            <div className="cnm-addon-detail-row">
                                                                <span className="cnm-addon-detail-label">Travel Date</span>
                                                                <span className="cnm-addon-detail-value">{formatDate(transfer.travelDate)}</span>
                                                            </div>
                                                        )}
                                                        {transfer.transferType === 'roundtrip' && transfer.returnDate && (
                                                            <div className="cnm-addon-detail-row">
                                                                <span className="cnm-addon-detail-label">Return Date</span>
                                                                <span className="cnm-addon-detail-value">{formatDate(transfer.returnDate)}</span>
                                                            </div>
                                                        )}
                                                        {transfer.arrivalTime && (
                                                            <div className="cnm-addon-detail-row">
                                                                <span className="cnm-addon-detail-label">Arrival Time</span>
                                                                <span className="cnm-addon-detail-value">{transfer.arrivalTime}</span>
                                                            </div>
                                                        )}
                                                        {transfer.transferType === 'roundtrip' && transfer.departureTime && (
                                                            <div className="cnm-addon-detail-row">
                                                                <span className="cnm-addon-detail-label">Departure Time</span>
                                                                <span className="cnm-addon-detail-value">{transfer.departureTime}</span>
                                                            </div>
                                                        )}
                                                        {transfer.pickupLocation && (
                                                            <div className="cnm-addon-detail-row">
                                                                <span className="cnm-addon-detail-label">Pickup Location</span>
                                                                <span className="cnm-addon-detail-value">{transfer.pickupLocation}</span>
                                                            </div>
                                                        )}
                                                        {transfer.transferType === 'roundtrip' && transfer.dropoffLocation && (
                                                            <div className="cnm-addon-detail-row">
                                                                <span className="cnm-addon-detail-label">Dropoff Location</span>
                                                                <span className="cnm-addon-detail-value">{transfer.dropoffLocation}</span>
                                                            </div>
                                                        )}
                                                        {transfer.message && (
                                                            <div className="cnm-addon-detail-row">
                                                                <span className="cnm-addon-detail-label">Special Requests</span>
                                                                <span className="cnm-addon-detail-value">{transfer.message}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add-Ons Grand Total */}
                                    <div className="cnm-addons-total">
                                        <span>Add-Ons Total</span>
                                        <strong>₱{(addOns.addOnsTotal || 0).toLocaleString()}</strong>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* SPECIAL REQUESTS */}
                        {selectedBooking.message && (
                            <div className="cnm-card">
                                <div className="cnm-card-header">
                                    <h3 className="cnm-card-title">Special Requests / Notes</h3>
                                </div>
                                <div className="cnm-message-box">
                                    {selectedBooking.message}
                                </div>
                            </div>
                        )}

                        {/* SUBMITTED DOCUMENTS */}
                        <div className="cnm-card">
                            <div className="cnm-card-header">
                                <h3 className="cnm-card-title">Submitted Documents</h3>
                                {!isLoadingDocs && (
                                    <span className="cnm-badge cnm-badge-amber">
                                        {submittedDocs.length} file{submittedDocs.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {isLoadingDocs ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                    <div style={{
                                        width: '32px', height: '32px', border: '3px solid #e2e8f0',
                                        borderTop: '3px solid #f97316', borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite', margin: '0 auto 8px'
                                    }} />
                                    <p style={{ margin: 0, fontSize: '14px' }}>Loading documents...</p>
                                </div>
                            ) : submittedDocs.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                    <FileText size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontSize: '14px' }}>No documents submitted yet.</p>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                    gap: '12px',
                                    padding: '4px 0'
                                }}>
                                    {submittedDocs.map((doc, idx) => {
                                        // Correct field names from Document model:
                                        // fileUrl, fileName, originalName, fileType, fileSize, section
                                        const fileUrl = doc.fileUrl || '#';
                                        const isImage = doc.fileType?.startsWith('image/') ||
                                            /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.originalName || doc.fileName || '');

                                        return (
                                            <a
                                                key={doc._id || idx}
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    border: '1px solid #e2e8f0', borderRadius: '10px',
                                                    overflow: 'hidden', textDecoration: 'none',
                                                    background: '#f8fafc', transition: 'box-shadow 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                                            >
                                                {isImage ? (
                                                    <div style={{ width: '100%', height: '90px', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
                                                        <img
                                                            src={fileUrl}
                                                            alt={doc.originalName || doc.fileName || `Doc ${idx + 1}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={e => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div style={{
                                                            display: 'none', width: '100%', height: '100%',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            position: 'absolute', top: 0, left: 0, background: '#f1f5f9'
                                                        }}>
                                                            <Image size={28} color="#94a3b8" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        width: '100%', height: '90px', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', background: '#f1f5f9'
                                                    }}>
                                                        <File size={32} color="#64748b" />
                                                    </div>
                                                )}
                                                <div style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}>
                                                    <p style={{
                                                        margin: '0 0 2px 0', fontSize: '11px', fontWeight: '600',
                                                        color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {doc.originalName || doc.fileName || `Document ${idx + 1}`}
                                                    </p>
                                                    {doc.section && (
                                                        <span style={{
                                                            fontSize: '10px', color: '#f97316', fontWeight: '600',
                                                            background: '#fff7ed', padding: '1px 6px', borderRadius: '4px'
                                                        }}>
                                                            {doc.section}
                                                        </span>
                                                    )}
                                                    {doc.fileSize && (
                                                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                                                            {(doc.fileSize / 1024).toFixed(1)} KB
                                                        </span>
                                                    )}
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
<div className="modal-footer">
    <button
        className="cnm-btn"
        style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
        }}
        onClick={() => setShowOrderSlip(true)}
    >
        <ReceiptText size={15} />
        Order Slip
    </button>

    {status === 'CONFIRMED' && (
        <button 
            className="cnm-btn cnm-btn-primary"
            onClick={() => generateVoucherData(selectedBooking)}
            disabled={isGeneratingVoucher}
        >
            <FileText size={15} />
            {isGeneratingVoucher ? 'Loading...' : 'View Voucher'}
        </button>
    )}

    {selectedBooking && (
        <button
            className="cnm-btn cnm-btn-outline"
            onClick={() => {
                closeModal();
                handleArchive(selectedBooking);
            }}
            disabled={actionLoading}
        >
            {selectedBooking.isArchive === 'Yes' ? (
                <>
                    <RotateCcwIcon size={15} />
                    Unarchive
                </>
            ) : (
                <>
                    <ArchiveIcon size={15} />
                    Archive
                </>
            )}
        </button>
    )}

    {status === 'PENDING' && (
        <>
            <button 
                className="cnm-btn cnm-btn-success"
                onClick={() => handleConfirmAndClose(selectedBooking)}
                disabled={actionLoading}
            >
                <CheckIcon size={15} /> Confirm Booking
            </button>
            <button 
                className="cnm-btn cnm-btn-danger cnm-btn-outline"
                onClick={() => handleCancelAndClose(selectedBooking)}
                disabled={actionLoading}
            >
                <XIcon size={15} /> Cancel Booking
            </button>
        </>
    )}

    {status === 'CONFIRMED' && (
        <button 
            className="cnm-btn cnm-btn-danger cnm-btn-outline"
            onClick={() => handleCancelAndClose(selectedBooking)}
            disabled={actionLoading}
        >
            <XIcon size={15} /> Cancel Booking
        </button>
    )}

</div>
                </div>
            </div> 

            {/* Voucher Preview Modal */}
            {showVoucherPreview && voucherData && (
                <VoucherPreviewModal
                    voucherData={voucherData}
                    onClose={() => setShowVoucherPreview(false)}
                    onEdit={(updatedData) => setVoucherData(updatedData)}
                />
            )}

            {/* ✅ ORDER SLIP MODAL */}
            {showOrderSlip && (
                <OrderSlipModal
                    booking={selectedBooking}
                    onClose={() => setShowOrderSlip(false)}
                />
            )}
        </>
    );
};

export default BookingDetailModal;