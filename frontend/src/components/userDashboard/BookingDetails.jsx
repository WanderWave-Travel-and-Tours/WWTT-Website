import React, { useState } from 'react';
import BookingCustomizer from './BookingCustomizer';
import './BookingDetails.css';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wanderwaveph.onrender.com';

const BookingDetails = ({ booking, onUpdate }) => {
    const toast = useToast();

    const [showPassengers, setShowPassengers] = useState(false);
    const [isPayingBalance, setIsPayingBalance] = useState(false);
    const [editingPassenger, setEditingPassenger] = useState(null);
    const [passengerFormData, setPassengerFormData] = useState(null);
    const [isSavingPassenger, setIsSavingPassenger] = useState(false);

    // ── Confirm Modal State ──────────────────────────────────────
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

    if (!booking) return null;

    // ✅ FIXED: Extract destination from all available sources.
    // Priority: populated packageId.destination → parse from packageName pattern → fallback
    const QUALIFIER_ONLY_PATTERN = /^(solo\s*\/?\s*joiners?|solo|joiners?|min\.?\s*of\s*\d+\s*pax|private|group)$/i;

    const getDestination = () => {
        // Best case: packageId was populated and has a destination field
        if (booking.packageId?.destination) {
            return booking.packageId.destination;
        }
        // If packageName follows the "Duration + Destination + Title" pattern
        // e.g. "5D4N Puerto Princesa Solo" or "BOHOL 4D3N (solo)" — extract the middle part
        if (booking.packageName && !QUALIFIER_ONLY_PATTERN.test(booking.packageName.trim())) {
            const withoutDuration = booking.packageName
                .replace(/\b\d+D\d+N\b/gi, '')
                .replace(/\b(solo|joiners?|joiner|min\.?\s*of\s*\d+\s*pax|private|group)\b/gi, '')
                .replace(/[()]/g, '')
                .trim();
            if (withoutDuration.length > 0) {
                return withoutDuration;
            }
        }
        return booking.destination || booking.packageName || 'N/A';
    };

    // ✅ NEW: Format a user-friendly package display name.
    // When packageName is just a qualifier (e.g. "Solo", "Joiners", "Min of 2 Pax"),
    // the title alone is meaningless. Build a full title using the format:
    //   Duration · Destination · Title
    // Example: packageName="Solo", dest="Puerto Princesa", duration="5D4N"
    //       → "5D4N · Puerto Princesa · Solo"
    const getFormattedPackageName = () => {
        const name     = booking.packageName || '';
        const dest     = booking.packageId?.destination || '';
        const duration = booking.duration || '';

        // If the packageName is a meaningful title (not just a qualifier), use as-is
        if (!QUALIFIER_ONLY_PATTERN.test(name.trim())) {
            return name || 'N/A';
        }

        // packageName is just a qualifier — build a richer title from available parts
        const parts = [];
        if (duration) parts.push(duration);
        if (dest)     parts.push(dest);
        if (name)     parts.push(name);
        return parts.length > 1 ? parts.join(' · ') : name || 'N/A';
    };

    // Toast helpers — delegates to ToastManager useToast()
    const showSuccessToast = (message) => toast.success(message);
    const showErrorToast   = (message) => toast.error(message);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const getStatusClass = (status) => {
        const map = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'fully_paid': 'status-confirmed',
            'partial_paid': 'status-partial',
            'failed': 'status-failed',
            'cancelled': 'status-cancelled'
        };
        return map[status?.toLowerCase()] || 'status-default';
    };

    const handlePayBalance = () => {
        if (!booking.remainingBalance || booking.remainingBalance <= 0) {
            showErrorToast('No balance remaining to pay.');
            return;
        }

        showConfirm({
            title:   'Pay Remaining Balance',
            message: `Proceed to pay the remaining balance of ₱${booking.remainingBalance.toLocaleString()}?`,
            type:    'primary',
            onConfirm: async () => {
                closeConfirm();
                try {
                    setIsPayingBalance(true);
                    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking._id}/create-balance-payment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (data.success && data.checkoutUrl) {
                        window.location.href = data.checkoutUrl;
                    } else {
                        showErrorToast('Failed to create payment link. Please try again.');
                        setIsPayingBalance(false);
                    }
                } catch (error) {
                    console.error('Error creating balance payment:', error);
                    showErrorToast('Failed to process payment. Please try again.');
                    setIsPayingBalance(false);
                }
            },
        });
    };

    const handleCustomizerUpdate = (updatedBooking) => {
        if (onUpdate) {
            onUpdate(updatedBooking);
        }
        showSuccessToast('Booking customization saved successfully!');
    };

    const getTotalPax = () => {
        const { adult = 0, children = 0, infants = 0 } = booking.pax || {};
        return adult + children + infants;
    };

    const handleEditPassenger = (passenger) => {
        setEditingPassenger(passenger.passengerNumber);
        setPassengerFormData({...passenger});
    };

    const handleCancelEdit = () => {
        setEditingPassenger(null);
        setPassengerFormData(null);
    };

    const handlePassengerFormChange = (field, value) => {
        setPassengerFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSavePassenger = async () => {
        // 🐛 DEBUG: Check what API_BASE_URL actually is
        console.log('');
        console.log('🔍 ==================== API DEBUG ====================');
        console.log('🌐 API_BASE_URL:', API_BASE_URL);
        console.log('🔧 VITE_API_BASE_URL from .env:', import.meta.env.VITE_API_BASE_URL);
        console.log('📍 Environment MODE:', import.meta.env.MODE);
        console.log('📍 Is DEV?:', import.meta.env.DEV);
        console.log('📍 Is PROD?:', import.meta.env.PROD);
        console.log('====================================================');
        console.log('');

        if (!passengerFormData) {
            showErrorToast('No data to save');
            return;
        }

        // Validation
        if (!passengerFormData.firstName || !passengerFormData.lastName) {
            showErrorToast('First name and last name are required');
            return;
        }

        if (!passengerFormData.email || !passengerFormData.email.includes('@')) {
            showErrorToast('Please enter a valid email address');
            return;
        }

        if (!passengerFormData.phone) {
            showErrorToast('Phone number is required');
            return;
        }

        try {
            setIsSavingPassenger(true);

            // Find the passenger index
            const passengerIndex = booking.passengers.findIndex(
                p => p.passengerNumber === editingPassenger
            );

            if (passengerIndex === -1) {
                showErrorToast('Passenger not found');
                setIsSavingPassenger(false);
                return;
            }

            // Create updated passengers array
            const updatedPassengers = [...booking.passengers];
            updatedPassengers[passengerIndex] = {
                ...updatedPassengers[passengerIndex],
                ...passengerFormData
            };

            // 🐛 DEBUG: Show what we're about to send
            console.log('');
            console.log('🚀 ==================== API REQUEST ====================');
            console.log('📍 Full URL:', `${API_BASE_URL}/api/bookings/${booking._id}`);
            console.log('🆔 Booking ID:', booking._id);
            console.log('👤 Passenger #:', editingPassenger);
            console.log('📦 Updating fields:', Object.keys(passengerFormData));
            console.log('======================================================');
            console.log('');

            // ✅ Make the API call
            const url = `${API_BASE_URL}/api/bookings/${booking._id}`;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    passengers: updatedPassengers
                })
            });

            // 🐛 DEBUG: Log response details
            console.log('');
            console.log('📡 ==================== API RESPONSE ====================');
            console.log('📡 Status Code:', response.status);
            console.log('📡 Status Text:', response.statusText);
            console.log('📡 Response OK?:', response.ok);
            console.log('📡 Content-Type:', response.headers.get('content-type'));
            console.log('=======================================================');
            console.log('');

            // ✅ Check if response is HTML (404 error page)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                const htmlText = await response.text();
                console.error('');
                console.error('❌ ==================== ERROR ====================');
                console.error('❌ Received HTML instead of JSON!');
                console.error('❌ This means the backend route does not exist');
                console.error('❌ Response preview:', htmlText.substring(0, 200));
                console.error('==================================================');
                console.error('');
                
                throw new Error('🚨 Route not found! Backend is returning 404 HTML page instead of JSON. Check: 1) Backend server is running, 2) Route is registered in server.js, 3) Correct URL/port');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('');
                console.error('❌ ==================== ERROR ====================');
                console.error('❌ Response Status:', response.status);
                console.error('❌ Error Text:', errorText);
                console.error('==================================================');
                console.error('');
                
                // Try to parse as JSON for better error message
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `HTTP ${response.status}: Failed to update passenger`);
                } catch (parseError) {
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
            }

            const data = await response.json();
            
            console.log('');
            console.log('✅ ==================== SUCCESS ====================');
            console.log('✅ Response:', data);
            console.log('===================================================');
            console.log('');

            if (!data.success) {
                throw new Error(data.message || 'Failed to update passenger');
            }

            console.log('✅ Passenger updated successfully!');

            // Update parent with the booking from response
            if (onUpdate && data.booking) {
                onUpdate(data.booking);
            }

            // Clear edit mode
            setEditingPassenger(null);
            setPassengerFormData(null);
            
            showSuccessToast('Passenger details updated successfully!');

        } catch (error) {
            console.error('');
            console.error('❌ ==================== CATCH ERROR ====================');
            console.error('❌ Error Message:', error.message);
            console.error('❌ Error Stack:', error.stack);
            console.error('=======================================================');
            console.error('');
            
            // More helpful error messages based on error type
            let errorMessage = 'Failed to update passenger details';
            
            if (error.message.includes('404') || error.message.includes('Route not found')) {
                errorMessage = '🚨 Backend route not found!\n\n' +
                              'Possible fixes:\n' +
                              '1. Make sure backend server is running\n' +
                              '2. Check server.js has PUT /api/bookings/:id route\n' +
                              '3. Verify route is registered BEFORE app.use middleware\n' +
                              '4. Check .env file has correct VITE_API_BASE_URL';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = '🚨 Cannot connect to server!\n\n' +
                              'Is your backend running?\n' +
                              'Check: npm start in backend folder';
            } else if (error.message.includes('CORS')) {
                errorMessage = '🚨 CORS error!\n\n' +
                              'Check your backend CORS configuration';
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            showErrorToast(errorMessage);
        } finally {
            setIsSavingPassenger(false);
        }
    };

    return (
        <div className="bd-container">
            {/* ── Custom Confirm Modal ── */}
            <CustomConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />

            {/* Main Grid */}
            <div className="bd-grid">
                {/* Left Column - Booking Info */}
                <div className="bd-card">
                    <h3 className="bd-card-title">Booking Information</h3>
                    <div className="bd-info-section">
                        <div className="bd-row">
                            <span className="bd-label">Destination</span>
                            <span className="bd-value">{getDestination()}</span>
                        </div>
                        <div className="bd-row">
                            <span className="bd-label">Package</span>
                            <span className="bd-value">{getFormattedPackageName()}</span>
                        </div>

                        <div className="bd-row">
                            <span className="bd-label">Travel Dates</span>
                            <span className="bd-value">
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </span>
                        </div>

                        <div className="bd-row">
                            <span className="bd-label">Number of Travelers</span>
                            <span className="bd-value">
                                {getTotalPax()} person{getTotalPax() > 1 ? 's' : ''}
                                {booking.pax && (
                                    <span className="bd-pax-breakdown">
                                        ({booking.pax.adult} Adult{booking.pax.adult > 1 ? 's' : ''}
                                        {booking.pax.children > 0 && `, ${booking.pax.children} Child${booking.pax.children > 1 ? 'ren' : ''}`}
                                        {booking.pax.infants > 0 && `, ${booking.pax.infants} Infant${booking.pax.infants > 1 ? 's' : ''}`})
                                    </span>
                                )}
                            </span>
                        </div>

                        {booking.flightDetails && (
                            <div className="bd-flight-section">
                                <div className="bd-flight-header">
                                    <span className="bd-flight-icon">✈️</span>
                                    <h4>Flight Details</h4>
                                </div>
                                <div className="bd-flight-info">
                                    <p><strong>Airline:</strong> {booking.flightDetails.airline || 'N/A'}</p>
                                    <p><strong>Flight Number:</strong> {booking.flightDetails.flightNumber || 'N/A'}</p>
                                    <p><strong>Route:</strong> {booking.flightDetails.route || 'N/A'}</p>
                                </div>
                            </div>
                        )}

                        <div className="bd-booking-date">
                            Booked on {formatDate(booking.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Right Column - Payment Info */}
                <div className="bd-card">
                    <h3 className="bd-card-title">Payment Details</h3>
                    <div className="bd-payment-breakdown">
                        <div className="bd-price-row">
                            <span>Base Price</span>
                            <span>₱{(booking.finalPackageTotal || booking.packageTotal || 0).toLocaleString()}</span>
                        </div>

                        {booking.customizationAdditionalPrice > 0 && (
                            <div className="bd-price-row bd-highlight">
                                <span>Customization</span>
                                <span className="bd-price-added">+₱{booking.customizationAdditionalPrice.toLocaleString()}</span>
                            </div>
                        )}

                        {booking.airfareTotal > 0 && (
                            <div className="bd-price-row bd-highlight">
                                <span>Airfare</span>
                                <span className="bd-price-added">+₱{booking.airfareTotal.toLocaleString()}</span>
                            </div>
                        )}

                        {booking.discountAmount > 0 && (
                            <div className="bd-price-row bd-discount">
                                <span>Discount {booking.promoCode && `(${booking.promoCode})`}</span>
                                <span className="bd-price-discount">-₱{booking.discountAmount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="bd-divider"></div>

                        <div className="bd-price-row bd-total">
                            <span>Total Amount</span>
                            <span className="bd-price-total">₱{(booking.totalAmount || 0).toLocaleString()}</span>
                        </div>

                        {booking.paymentType === 'partial' && (
                            <>
                                <div className="bd-divider" style={{ margin: '8px 0' }}></div>
                                
                                <div className="bd-price-row">
                                    <span>Initial Payment</span>
                                    <span>₱{(booking.initialPaymentAmount || 0).toLocaleString()}</span>
                                </div>

                                {booking.balancePaidAmount > 0 && (
                                    <div className="bd-price-row">
                                        <span>Balance Paid</span>
                                        <span>₱{booking.balancePaidAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                {booking.remainingBalance > 0 && (
                                    <div className="bd-price-row">
                                        <span>Remaining Balance</span>
                                        <span className="bd-remaining">₱{booking.remainingBalance.toLocaleString()}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {booking.remainingBalance > 0 && (
                            <button 
                                onClick={handlePayBalance}
                                className="bd-pay-balance-btn"
                                disabled={isPayingBalance}
                            >
                                {isPayingBalance ? 'Processing...' : `Pay Balance (₱${booking.remainingBalance.toLocaleString()})`}
                            </button>
                        )}

                        <div className={`bd-payment-status ${
                            booking.status === 'confirmed' || booking.status === 'fully_paid' ? 'bd-payment-success' :
                            booking.status === 'partial_paid' ? 'bd-payment-partial' :
                            booking.status === 'cancelled' ? 'bd-payment-cancelled' :
                            'bd-payment-pending'
                        }`}>
                            <span className="bd-status-icon">
                                {booking.status === 'confirmed' || booking.status === 'fully_paid' ? '✅' :
                                 booking.status === 'partial_paid' ? '⏳' :
                                 booking.status === 'cancelled' ? '❌' : '⏱️'}
                            </span>
                            <span>
                                {booking.status === 'confirmed' || booking.status === 'fully_paid' ? 'Confirmed' :
                                 booking.status === 'partial_paid' ? 'Partially Paid' :
                                 booking.status === 'cancelled' ? 'Cancelled' :
                                 'Payment Pending'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {booking.passengers && booking.passengers.length > 0 && (
                <div className="bd-card bd-passengers-card">
                    <div className="bd-passengers-header">
                        <h3 className="bd-card-title">Passenger Information</h3>
                        <button 
                            className="bd-toggle-btn"
                            onClick={() => setShowPassengers(!showPassengers)}
                        >
                            {showPassengers ? 'Hide Details' : 'Show Details'}
                            <svg 
                                width="16" height="16" viewBox="0 0 24 24" 
                                fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{ 
                                    transform: showPassengers ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.25s'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                    </div>
                    
                    {showPassengers && (
                        <div className="bd-passengers-list">
                            {booking.passengers.map((passenger) => {
                                const initials = `${(passenger.firstName || '?')[0]}${(passenger.lastName || '?')[0]}`.toUpperCase();

                                return (
                                <div key={passenger.passengerNumber} className="bd-passenger-card">
                                    <div className="bd-pcard-strip"></div>

                                    {editingPassenger === passenger.passengerNumber ? (
                                        /* ── EDIT FORM ── */
                                        <div className="bd-passenger-edit-form">
                                            <div className="bd-form-header">
                                                <h4>Edit Passenger {passenger.passengerNumber}</h4>
                                                <p className="bd-form-subtitle">Update traveller information below</p>
                                            </div>

                                            <div className="bd-form-body">
                                                <div className="bd-form-grid">
                                                    {/* First Name */}
                                                    <div className="bd-form-group">
                                                        <label>First Name <span className="bd-required-star">*</span></label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={passengerFormData?.firstName || ''}
                                                                onChange={(e) => handlePassengerFormChange('firstName', e.target.value)}
                                                                placeholder="First name"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Last Name */}
                                                    <div className="bd-form-group">
                                                        <label>Last Name <span className="bd-required-star">*</span></label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={passengerFormData?.lastName || ''}
                                                                onChange={(e) => handlePassengerFormChange('lastName', e.target.value)}
                                                                placeholder="Last name"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Email */}
                                                    <div className="bd-form-group">
                                                        <label>Email <span className="bd-required-star">*</span></label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                                            </span>
                                                            <input
                                                                type="email"
                                                                value={passengerFormData?.email || ''}
                                                                onChange={(e) => handlePassengerFormChange('email', e.target.value)}
                                                                placeholder="email@example.com"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Phone */}
                                                    <div className="bd-form-group">
                                                        <label>Phone <span className="bd-required-star">*</span></label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.13-1.13a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                                            </span>
                                                            <input
                                                                type="tel"
                                                                value={passengerFormData?.phone || ''}
                                                                onChange={(e) => handlePassengerFormChange('phone', e.target.value)}
                                                                placeholder="09XXXXXXXXX"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Date of Birth */}
                                                    <div className="bd-form-group">
                                                        <label>Date of Birth</label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                            </span>
                                                            <input
                                                                type="date"
                                                                value={passengerFormData?.dateOfBirth || ''}
                                                                onChange={(e) => handlePassengerFormChange('dateOfBirth', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Gender */}
                                                    <div className="bd-form-group">
                                                        <label>Gender</label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v-4h4M16 4l-4 4M8 16v4H4M8 20l4-4"/></svg>
                                                            </span>
                                                            <select
                                                                value={passengerFormData?.gender || ''}
                                                                onChange={(e) => handlePassengerFormChange('gender', e.target.value)}
                                                            >
                                                                <option value="">Select Gender</option>
                                                                <option value="Male">Male</option>
                                                                <option value="Female">Female</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Nationality */}
                                                    <div className="bd-form-group">
                                                        <label>Nationality</label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={passengerFormData?.nationality || ''}
                                                                onChange={(e) => handlePassengerFormChange('nationality', e.target.value)}
                                                                placeholder="e.g. Filipino"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Address */}
                                                    <div className="bd-form-group bd-full-width">
                                                        <label>Address</label>
                                                        <div className="bd-input-wrapper">
                                                            <span className="bd-input-icon">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={passengerFormData?.address || ''}
                                                                onChange={(e) => handlePassengerFormChange('address', e.target.value)}
                                                                placeholder="Complete address"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bd-form-actions">
                                                <button 
                                                    className="bd-btn-cancel"
                                                    onClick={handleCancelEdit}
                                                    disabled={isSavingPassenger}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                                    </svg>
                                                    Cancel
                                                </button>
                                                <button 
                                                    className="bd-btn-save"
                                                    onClick={handleSavePassenger}
                                                    disabled={isSavingPassenger}
                                                >
                                                    {isSavingPassenger ? (
                                                        <>
                                                            <span className="bd-spinner-small"></span>
                                                            Saving…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── DISPLAY VIEW ── */
                                        <div className="bd-pcard-body">
                                            <div className="bd-pcard-head">
                                                <div className="bd-pcard-avatar">{initials}</div>
                                                <div className="bd-pcard-head-info">
                                                    <p className="bd-pcard-label">Passenger {passenger.passengerNumber}</p>
                                                    <h4 className="bd-pcard-name">
                                                        {passenger.firstName} {passenger.lastName}
                                                    </h4>
                                                </div>
                                                <button 
                                                    className="bd-edit-btn"
                                                    onClick={() => handleEditPassenger(passenger)}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                    </svg>
                                                    Edit
                                                </button>
                                            </div>

                                            <div className="bd-passenger-details">
                                                {/* Email */}
                                                <div className="bd-detail-row">
                                                    <div className="bd-detail-icon">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                                    </div>
                                                    <div className="bd-detail-text">
                                                        <span className="bd-detail-label">Email</span>
                                                        <span className="bd-detail-value">{passenger.email || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Phone */}
                                                <div className="bd-detail-row">
                                                    <div className="bd-detail-icon">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.58 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.13-1.13a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                                    </div>
                                                    <div className="bd-detail-text">
                                                        <span className="bd-detail-label">Phone</span>
                                                        <span className="bd-detail-value">{passenger.phone || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Date of Birth */}
                                                <div className="bd-detail-row">
                                                    <div className="bd-detail-icon">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                    </div>
                                                    <div className="bd-detail-text">
                                                        <span className="bd-detail-label">Date of Birth</span>
                                                        <span className="bd-detail-value">
                                                            {formatDate(passenger.dateOfBirth)}
                                                            {passenger.age ? ` · ${passenger.age} yrs` : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Gender */}
                                                <div className="bd-detail-row">
                                                    <div className="bd-detail-icon">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v-4h4M16 4l-4 4M8 16v4H4M8 20l4-4"/></svg>
                                                    </div>
                                                    <div className="bd-detail-text">
                                                        <span className="bd-detail-label">Gender</span>
                                                        <span className="bd-detail-value">{passenger.gender || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Nationality */}
                                                <div className="bd-detail-row">
                                                    <div className="bd-detail-icon">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                                    </div>
                                                    <div className="bd-detail-text">
                                                        <span className="bd-detail-label">Nationality</span>
                                                        <span className="bd-detail-value">{passenger.nationality || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Address */}
                                                <div className="bd-detail-row">
                                                    <div className="bd-detail-icon">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                    </div>
                                                    <div className="bd-detail-text">
                                                        <span className="bd-detail-label">Address</span>
                                                        <span className="bd-detail-value">{passenger.address || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Package Inclusions Section — handled by BookingCustomizer below */}

            {/* Customize Your Booking - Inline Component */}
            <BookingCustomizer 
                booking={booking}
                onUpdate={handleCustomizerUpdate}
            />

            {/* Additional Message */}
            {booking.message && (
                <div className="bd-card bd-message-card">
                    <h3 className="bd-card-title">Your Message</h3>
                    <div className="bd-message-content">
                        {booking.message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDetails;