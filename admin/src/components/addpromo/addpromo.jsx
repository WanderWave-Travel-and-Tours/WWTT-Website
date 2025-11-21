import React, { useState } from 'react';
import './AddPromo.css';
import Sidebar from '../sidebar/sidebar';

const AddPromo = () => {
    const [promoDetails, setPromoDetails] = useState({
        code: '',
        discount: '',
        validUntil: '',
        description: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPromoDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submitting Promo Details:', promoDetails);
        alert(`Promo Code ${promoDetails.code} added successfully!`);
        setPromoDetails({ code: '', discount: '', validUntil: '', description: '' });
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

                    <form onSubmit={handleSubmit} className="promo-form">
                        <div className="promo-grid">
                            {/* Left Column - Form */}
                            <div className="promo-left">
                                <section className="promo-section">
                                    <h2 className="promo-section-title">PROMO DETAILS</h2>
                                    <div className="promo-fields">
                                        <div className="promo-field promo-field--full">
                                            <label>Promo Code</label>
                                            <input
                                                type="text"
                                                name="code"
                                                value={promoDetails.code}
                                                onChange={handleChange}
                                                placeholder="e.g., SUMMER20"
                                                required
                                            />
                                        </div>
                                        <div className="promo-field">
                                            <label>Discount (%)</label>
                                            <input
                                                type="number"
                                                name="discount"
                                                value={promoDetails.discount}
                                                onChange={handleChange}
                                                placeholder="e.g., 20"
                                                min="1"
                                                max="100"
                                                required
                                            />
                                        </div>
                                        <div className="promo-field">
                                            <label>Valid Until</label>
                                            <input
                                                type="date"
                                                name="validUntil"
                                                value={promoDetails.validUntil}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="promo-field promo-field--full">
                                            <label>Description</label>
                                            <textarea
                                                name="description"
                                                value={promoDetails.description}
                                                onChange={handleChange}
                                                placeholder="Briefly describe the promo's terms and conditions."
                                                rows="4"
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>

                                <div className="promo-actions">
                                    <button type="button" className="promo-btn promo-btn--cancel">Cancel</button>
                                    <button type="submit" className="promo-btn promo-btn--submit">Create Promo</button>
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
                                                {promoDetails.discount ? `${promoDetails.discount}%` : '--'}
                                            </span>
                                        </div>
                                        <div className="promo-card-body">
                                            <span className="promo-card-code">{promoDetails.code || 'PROMOCODE'}</span>
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
                                                <span>Valid until: {promoDetails.validUntil || '--'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="promo-stats">
                                        <div className="promo-stat">
                                            <strong>{promoDetails.code ? 1 : 0}</strong>
                                            <span>Code</span>
                                        </div>
                                        <div className="promo-stat">
                                            <strong>{promoDetails.discount || 0}%</strong>
                                            <span>Discount</span>
                                        </div>
                                        <div className="promo-stat">
                                            <strong>{promoDetails.validUntil ? 'Set' : '--'}</strong>
                                            <span>Expiry</span>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddPromo;