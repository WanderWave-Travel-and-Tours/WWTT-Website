import React, { useState, useEffect } from 'react';
import './addpromo.css';
import Sidebar from '../sidebar/sidebar';

const AddPromo = () => {
    // --- SIDEBAR LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR LOGIC END ---

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
    const [isOtherCategory, setIsOtherCategory] = useState(false);

    // --- DATE VALIDATION LOGIC START ---
    const getTomorrowDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
    };
    
    const getMaxStartDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); 
        tomorrow.setFullYear(tomorrow.getFullYear() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    const minStartDate = getTomorrowDate();
    const maxStartDate = getMaxStartDate(); 
    // --- DATE VALIDATION LOGIC END ---


    useEffect(() => {
        if (promoDetails.startDate && promoDetails.durationType) {
            const start = new Date(promoDetails.startDate);
            let endDate = new Date(start);

            // 1. Calculate base end date based on duration type
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
            
            // 2. Calculate the absolute max end date (1 year from start date)
            const maxEndDateLimit = new Date(start);
            maxEndDateLimit.setFullYear(start.getFullYear() + 1);
            
            // 3. CAP THE END DATE
            if (endDate.getTime() > maxEndDateLimit.getTime()) {
                endDate = maxEndDateLimit;
            }

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
        
        if (name === 'discountValue') {
            const isPercentage = promoDetails.discountType === 'Percentage';
            
            // Step 1: Clean the input value (removes signs/decimals if pasted)
            let numericValueString = value.replace(/[^0-9]/g, '');

            // Step 2: Allow clearing the input (empty string)
            if (numericValueString === '') {
                setPromoDetails(prevDetails => ({ ...prevDetails, [name]: '' }));
                return;
            }

            // --- Updated Logic: Handle Leading Zeroes ---
            // If the string starts with '0' and is longer than one character, remove leading zeros.
            // Example: '0123' becomes '123'; '000' becomes '0'.
            if (numericValueString.length > 1 && numericValueString.startsWith('0')) {
                numericValueString = String(parseInt(numericValueString, 10)); 
            }
            
            const numValue = parseInt(numericValueString, 10);
            
            if (isPercentage) {
                // Percentage Check (0-100) - Handles paste events
                if (numValue < 0 || numValue > 100) {
                    alert('Discount Percentage must be a whole number between 0 and 100. Input has been reset.');
                    setPromoDetails(prevDetails => ({ ...prevDetails, [name]: '' })); // AUTOMATIC RESET
                    return;
                }
            } else { // Fixed Amount (Peso)
                // New Logic: Max 6 digits check (Handles paste events)
                if (numericValueString.length > 6) {
                    alert('Discount amount must not exceed 6 digits. Input has been reset.');
                    setPromoDetails(prevDetails => ({ ...prevDetails, [name]: '' })); 
                    return;
                }
                 // Fixed amount check: ensure it's non-negative
                 if (numValue < 0) { 
                    alert('Discount amount must be a non-negative whole number. Input has been reset.');
                    setPromoDetails(prevDetails => ({ ...prevDetails, [name]: '' })); 
                    return;
                }
            }

            // Update state with the clean numeric string if all checks pass
            setPromoDetails(prevDetails => ({
                ...prevDetails,
                [name]: numericValueString
            }));
            return;
        }

        // Default handler for other fields
        setPromoDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    /**
     * Key Press Handler for Discount Value Input: Blocks all non-digit characters (signs)
     * AND implements real-time maximum restrictions.
     */
    const handleDiscountValueKeyDown = (e) => {
        // Allow functional keys (e.g., Backspace, Delete, Tab, Arrow Keys, Enter)
        const isFunctionalKey = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
        ].includes(e.key);
        
        // Allow command keys (e.g., Ctrl+C, Ctrl+V, Ctrl+A)
        if (isFunctionalKey || (e.ctrlKey || e.metaKey)) {
            return;
        }
        
        // Check if the pressed key is a digit (0-9)
        const isDigit = /^\d$/.test(e.key);
        
        // Block non-digit keys (including signs/symbols)
        if (!isDigit) {
            e.preventDefault();
            return;
        }
        
        const { discountType, discountValue } = promoDetails;
        const currentValue = discountValue.toString();
        const newKey = e.key;
        
        if (discountType === 'Percentage') {
            // Logic: Real-time 100% restriction
            if (currentValue === '10') {
                if (newKey !== '0') {
                    e.preventDefault();
                    return;
                }
            }
            
            if (currentValue.length >= 2) {
                if (currentValue === '100') {
                    e.preventDefault();
                    return;
                }
                
                const resultingValue = parseInt(currentValue + newKey, 10);
                
                if (resultingValue > 100) {
                    e.preventDefault();
                    return;
                }
            }
        } else { // Fixed Amount (Peso)
            // New Logic: Real-time 6-digit restriction
            if (currentValue.length >= 6) {
                 e.preventDefault();
                 return;
            }
            
            // New Logic: Prevent typing '00' (The 'handleChange' handles '01' becoming '1')
            if (currentValue === '0' && newKey === '0') {
                e.preventDefault();
                return;
            }
        }
    };
    
    /**
     * Key Press Handler for Promo Code Name: Allows only alphanumeric characters.
     */
    const handleCodeKeyPress = (e) => {
        const isFunctionalKey = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'
        ].includes(e.key);
        
        if (isFunctionalKey || (e.ctrlKey || e.metaKey)) {
            return;
        }

        const regex = /^[a-zA-Z0-9]$/;
        if (!regex.test(e.key)) {
            e.preventDefault();
        }
    };

    const handleCategorySelect = (e) => {
        const value = e.target.value;
        
        if (value === 'Other') {
            setIsOtherCategory(true);
            setPromoDetails(prev => ({ ...prev, category: '' }));
        } else {
            setIsOtherCategory(false);
            setPromoDetails(prev => ({ ...prev, category: value }));
        }
    };

    const handleSubmit = async () => {
        if (!promoDetails.code || !promoDetails.description || !promoDetails.category || 
            !promoDetails.discountValue || !promoDetails.startDate) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:5000/api/promos/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(promoDetails),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Promo Code ${promoDetails.code} added successfully!`);
                console.log('Saved Promo:', data);

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
                setIsOtherCategory(false);
            } else {
                alert(`Error adding promo: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
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
        setIsOtherCategory(false);
    };

    return (
        <div className="promo-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`promo-main ${
                isSidebarCollapsed ? "promo-main--collapsed" : ""
            }`}>
                <div className="promo-container">
                    <header className="promo-header">
                        <h1 className="promo-title">NEW PROMO CODE</h1>
                        <p className="promo-subtitle">Create a new promotional code for your packages</p>
                    </header>

                    <div className="promo-grid">
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
                                            onKeyDown={handleCodeKeyPress}
                                            maxLength="20"
                                            placeholder="e.g., SUMMER2025 (Max 20 chars, Alphanumeric only)"
                                            style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                                        />
                                        <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                            Only alphanumeric characters (A-Z, 0-9) allowed. Maximum of 20 characters.
                                        </small>
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
                                            name="categorySelect"
                                            value={isOtherCategory ? 'Other' : promoDetails.category}
                                            onChange={handleCategorySelect}
                                        >
                                            <option value="" disabled>Select Category</option>
                                            <option value="Barkada">Barkada Package</option>
                                            <option value="Tour Only">Tour Only</option>
                                            <option value="Package (Land)">Package (Land)</option>
                                            <option value="Full Package (Airfare)">Full Package (Airfare)</option>
                                            <option value="Other" style={{fontWeight: 'bold', color: '#FF8C42'}}>+ Other (Custom)</option>
                                        </select>

                                        {isOtherCategory && (
                                            <input
                                                type="text"
                                                name="category"
                                                value={promoDetails.category}
                                                onChange={handleChange}
                                                placeholder="Type your custom category here..."
                                                className="promo-input-custom"
                                                autoFocus
                                            />
                                        )}
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
                                            type="text" 
                                            name="discountValue"
                                            value={promoDetails.discountValue}
                                            onChange={handleChange}
                                            onKeyDown={handleDiscountValueKeyDown} 
                                            placeholder={promoDetails.discountType === 'Percentage' ? 'Enter % (0-100)' : 'Enter amount (Max 6 digits)'}
                                        />
                                        <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                            {promoDetails.discountType === 'Percentage' ? 'Value must be between 0 and 100.' : 'Enter a non-negative whole number, maximum 6 digits.'}
                                        </small>
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
                                            min={minStartDate} 
                                            max={maxStartDate} 
                                        />
                                        <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                            Start Date must be between tomorrow and one year from tomorrow.
                                        </small>
                                    </div>

                                    <div className="promo-field promo-field--full">
                                        <label>End Date (Auto-Calculated - Max 1 Year)</label>
                                        <input
                                            type="date"
                                            name="validUntil"
                                            value={promoDetails.validUntil}
                                            readOnly
                                            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                                        />
                                        <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                            Automatically calculated based on Duration Type and Start Date, but capped at a **maximum of 1 year** from the Start Date.
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