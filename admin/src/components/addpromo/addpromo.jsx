import React, { useState, useEffect } from 'react';
import './AddPromo.css';

// --- Mock Sidebar para sa Preview (Upang maiwasan ang error sa import) ---
const Sidebar = () => (
  <div className="w-64 bg-blue-900 text-white min-h-screen hidden md:block p-4">
    <div className="font-bold text-xl mb-8">Wanderwave Admin</div>
    <div className="space-y-2">
      <div className="p-2 hover:bg-blue-800 rounded cursor-pointer">Dashboard</div>
      <div className="p-2 bg-blue-800 rounded cursor-pointer">Promos</div>
      <div className="p-2 hover:bg-blue-800 rounded cursor-pointer">Bookings</div>
    </div>
  </div>
);
// -------------------------------------------------------------------------

const AddPromo = () => {
    const [promoDetails, setPromoDetails] = useState({
        code: '',
        discount: '',
        validUntil: '',
        description: '',
        category: '',
        discountType: 'Fixed Amount (Peso)',
        discountValue: '',
        durationType: 'Weekly',
        startDate: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-calculate end date based on duration type and start date
    useEffect(() => {
        if (promoDetails.startDate && promoDetails.durationType) {
            const start = new Date(promoDetails.startDate);
            let endDate = new Date(start);

            switch (promoDetails.durationType) {
                case 'Weekly':
                    endDate.setDate(start.getDate() + 7);
                    break;
                case 'Monthly':
                    endDate.setMonth(start.getMonth() + 1);
                    break;
                case 'Yearly':
                    endDate.setFullYear(start.getFullYear() + 1);
                    break;
                default:
                    break;
            }

            // Handle invalid date case
            if (!isNaN(endDate.getTime())) {
                const formattedDate = endDate.toISOString().split('T')[0];
                setPromoDetails(prev => ({
                    ...prev,
                    validUntil: formattedDate
                }));
            }
        }
    }, [promoDetails.startDate, promoDetails.durationType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPromoDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    // --- DITO ANG API CALL ---
    const handleSubmit = async () => {
        // 1. Validation
        if (!promoDetails.code || !promoDetails.description || !promoDetails.category || 
            !promoDetails.discountValue || !promoDetails.startDate) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // 2. Send Data to Backend
            // NOTE: Ang URL ay naka-set sa localhost:5000/api/promos/add. 
            const response = await fetch('http://localhost:5000/api/promos/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(promoDetails),
            });

            const data = await response.json();

            if (response.ok) {
                // 3. Success Handling
                alert(`Promo Code ${promoDetails.code} added successfully!`);
                console.log('Saved Promo:', data);

                // Reset form
                setPromoDetails({
                    code: '',
                    discount: '',
                    validUntil: '',
                    description: '',
                    category: '',
                    discountType: 'Fixed Amount (Peso)',
                    discountValue: '',
                    durationType: 'Weekly',
                    startDate: ''
                });
            } else {
                // 4. Server Error Handling
                alert(`Error adding promo: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            // 5. Network Error Handling
            console.error('Network Error:', error);
            alert('Failed to connect to the server. Please check if your backend is running.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setPromoDetails({
            code: '',
            discount: '',
            validUntil: '',
            description: '',
            category: '',
            discountType: 'Fixed Amount (Peso)',
            discountValue: '',
            durationType: 'Weekly',
            startDate: ''
        });
    };

    return (
        <div className="promo-page">
            <Sidebar />
            <main className="promo-main">
                <div className="promo-container">
                    {/* Header */}
                    <header className="promo-header">
                        <h1 className="promo-title">NEW PROMO CODE</h1>
                        <p className="promo-subtitle">Create a new promotional code for your packages</p>
                    </header>

                    <div className="promo-grid">
                        {/* Left Column - Form */}
                        <div className="promo-left">
                            <section className="promo-section">
                                <h2 className="promo-section-title">PROMO DETAILS</h2>
                                <div className="promo-fields">
                                    <div className="promo-field promo-field--full">
                                        <label>Promo Code Name</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={promoDetails.code}
                                            onChange={handleChange}
                                            placeholder="e.g., SUMMER2025"
                                            style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                                        />
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={promoDetails.description}
                                            onChange={handleChange}
                                            placeholder="Briefly describe the promo's terms and conditions"
                                            rows="4"
                                        ></textarea>
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>Apply to Category</label>
                                        <select
                                            name="category"
                                            value={promoDetails.category}
                                            onChange={handleChange}
                                        >
                                            <option value="" disabled>Select Category</option>
                                            <option value="Barkada">Barkada Package</option>
                                            <option value="Tour Only">Tour Only</option>
                                            <option value="Package (Land)">Package (Land)</option>
                                            <option value="Full Package (Airfare)">Full Package (Airfare)</option>
                                        </select>
                                    </div>

                                    <div className="promo-field">
                                        <label>Discount Type</label>
                                        <select
                                            name="discountType"
                                            value={promoDetails.discountType}
                                            onChange={handleChange}
                                        >
                                            <option value="Fixed Amount (Peso)">Fixed Amount (Peso)</option>
                                            <option value="Percentage">Percentage (%)</option>
                                        </select>
                                    </div>

                                    <div className="promo-field">
                                        <label>Discount Value</label>
                                        <input
                                            type="number"
                                            name="discountValue"
                                            value={promoDetails.discountValue}
                                            onChange={handleChange}
                                            placeholder={promoDetails.discountType === 'Percentage' ? 'Enter %' : 'Enter amount'}
                                            min="1"
                                            max={promoDetails.discountType === 'Percentage' ? '100' : undefined}
                                        />
                                    </div>

                                    <div className="promo-field">
                                        <label>Duration Type</label>
                                        <select
                                            name="durationType"
                                            value={promoDetails.durationType}
                                            onChange={handleChange}
                                        >
                                            <option value="Weekly">Weekly (7 Days)</option>
                                            <option value="Monthly">Monthly (1 Month)</option>
                                            <option value="Yearly">Yearly (1 Year)</option>
                                        </select>
                                    </div>

                                    <div className="promo-field">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={promoDetails.startDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>End Date (Auto-Calculated)</label>
                                        <input
                                            type="date"
                                            name="validUntil"
                                            value={promoDetails.validUntil}
                                            readOnly
                                            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                                        />
                                        <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                            Automatically calculated based on Duration Type and Start Date
                                        </small>
                                    </div>
                                </div>
                            </section>

                            <div className="promo-actions">
                                <button 
                                    type="button" 
                                    className="promo-btn promo-btn--cancel" 
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="promo-btn promo-btn--submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Promo'}
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Preview */}
                        <aside className="promo-right">
                            <div className="promo-preview">
                                <span className="promo-preview-label">PREVIEW</span>
                                <div className="promo-card">
                                    <div className="promo-card-header">
                                        <div className="promo-card-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round"/>
                                                <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <span className="promo-card-discount">
                                            {promoDetails.discountValue ? (
                                                promoDetails.discountType === 'Percentage' 
                                                    ? `${promoDetails.discountValue}%` 
                                                    : `₱${promoDetails.discountValue}`
                                            ) : '--'}
                                        </span>
                                    </div>
                                    <div className="promo-card-body">
                                        <span className="promo-card-code">
                                            {promoDetails.code || 'PROMOCODE'}
                                        </span>
                                        {promoDetails.category && (
                                            <div className="promo-card-category">
                                                {promoDetails.category}
                                            </div>
                                        )}
                                        <p className="promo-card-desc">
                                            {promoDetails.description || 'Promo description will appear here'}
                                        </p>
                                        <div className="promo-card-validity">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                            </svg>
                                            <span>
                                                Valid: {promoDetails.startDate || '--'} to {promoDetails.validUntil || '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="promo-stats">
                                    <div className="promo-stat">
                                        <strong>{promoDetails.code ? '1' : '0'}</strong>
                                        <span>Code</span>
                                    </div>
                                    <div className="promo-stat">
                                        <strong>
                                            {promoDetails.discountValue || '0'}
                                            {promoDetails.discountType === 'Percentage' ? '%' : '₱'}
                                        </strong>
                                        <span>Discount</span>
                                    </div>
                                    <div className="promo-stat">
                                        <strong>{promoDetails.durationType || 'Weekly'}</strong>
                                        <span>Duration</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddPromo;