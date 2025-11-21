import React, { useState, useEffect } from 'react';
import './addpromo.css';
import Sidebar from '../sidebar/sidebar';

const AddPromo = () => {
    const [promoDetails, setPromoDetails] = useState({
        code: '',
        description: '',
        category: '',
        discountType: 'Fixed Amount (Peso)', 
        discountValue: '',
        durationType: 'Weekly', 
        startDate: '',
        validUntil: '', 
    });

    useEffect(() => {
        if (promoDetails.startDate && promoDetails.durationType) {
            const start = new Date(promoDetails.startDate);
            const end = new Date(start); 

            if (promoDetails.durationType === 'Weekly') {
                end.setDate(start.getDate() + 7);
            } else if (promoDetails.durationType === 'Monthly') {
                end.setMonth(start.getMonth() + 1);
            } else if (promoDetails.durationType === 'Yearly') {
                end.setFullYear(start.getFullYear() + 1);
            }

            const formattedEndDate = end.toISOString().split('T')[0];

            setPromoDetails(prev => ({
                ...prev,
                validUntil: formattedEndDate
            }));
        }
    }, [promoDetails.startDate, promoDetails.durationType]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPromoDetails(prevDetails => ({
            ...prevDetails,
            [name]: name === 'code' ? value.toUpperCase() : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/promos/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promoDetails)
            });

            const data = await response.json();

            if (data.status === "ok") {
                alert(`✅ Promo Code ${promoDetails.code} added successfully!`);
                // Reset Form
                setPromoDetails({
                    code: '',
                    description: '',
                    category: '',
                    discountType: 'Fixed Amount (Peso)',
                    discountValue: '',
                    durationType: 'Weekly',
                    startDate: '',
                    validUntil: '',
                });
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Server Error:', error);
            alert("⚠️ Failed to connect to the server.");
        }
    };

    return (
        <div className="admin-layout"> 
            <Sidebar />

            <div className="promo-content"> 
                <h1>🎟️ Add New Promo Code</h1>
                <p>Create distinct promo codes based on duration (Weekly, Monthly, Yearly).</p>
                
                <form onSubmit={handleSubmit} className="promo-form">
                    
                    <div className="form-group">
                        <label htmlFor="code">Promo Code Name:</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={promoDetails.code}
                            onChange={handleChange}
                            placeholder="e.g., SUMMER2025"
                            required
                            style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={promoDetails.description}
                            onChange={handleChange}
                            placeholder="e.g., Special discount for this month"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Apply to Category:</label>
                        <select
                            id="category"
                            name="category"
                            value={promoDetails.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="" disabled>Select Category</option>
                            <option value="Barkada">Barkada Package</option>
                            <option value="Tour Only">Tour Only</option>
                            <option value="Package (Land)">Package (Land)</option>
                            <option value="Full Package (Airfare)">Full Package (Airfare)</option>
                        </select>
                    </div>

                    <div className="form-row-split">
                        <div className="form-group half-width">
                            <label htmlFor="discountType">Discount Type:</label>
                            <select
                                id="discountType"
                                name="discountType"
                                value={promoDetails.discountType}
                                onChange={handleChange}
                            >
                                <option value="Fixed Amount (Peso)">Fixed Amount (Peso)</option>
                                <option value="Percentage">Percentage (%)</option>
                            </select>
                        </div>

                        <div className="form-group half-width">
                            <label htmlFor="discountValue">Value:</label>
                            <input
                                type="number"
                                id="discountValue"
                                name="discountValue"
                                value={promoDetails.discountValue}
                                onChange={handleChange}
                                placeholder="Amount or %"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row-split" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <div className="form-group half-width">
                            <label htmlFor="durationType" style={{ color: '#6200ea', fontWeight: 'bold' }}>1. Duration Type:</label>
                            <select
                                id="durationType"
                                name="durationType"
                                value={promoDetails.durationType}
                                onChange={handleChange}
                                required
                            >
                                <option value="Weekly">Weekly (7 Days)</option>
                                <option value="Monthly">Monthly (1 Month)</option>
                                <option value="Yearly">Yearly (1 Year)</option>
                            </select>
                        </div>

                        <div className="form-group half-width">
                            <label htmlFor="startDate" style={{ color: '#6200ea', fontWeight: 'bold' }}>2. Start Date:</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={promoDetails.startDate}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="validUntil">End Period (Auto-Calculated):</label>
                        <input
                            type="date"
                            id="validUntil"
                            name="validUntil"
                            value={promoDetails.validUntil}
                            readOnly 
                            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                        />
                        <small style={{ color: '#888' }}>
                            System automatically sets this based on Duration Type + Start Date.
                        </small>
                    </div>
                    
                    <button type="submit" className="submit-btn">Create Promo</button>
                </form>
            </div>
        </div>
    );
};

export default AddPromo;