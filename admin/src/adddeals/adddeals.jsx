import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Globe, DollarSign, Calculator, Loader2, MapPin } from 'lucide-react';
import Sidebar from '../components/sidebar/sidebar'; // Ensure path is correct
import './AddDeals.css';

const AddDeals = () => {
    // Current Forex Rate (Hardcoded for now, implies 1 USD = 58 PHP)
    const FOREX_RATE = 58;

    const [dealData, setDealData] = useState({
        destination: '',      // Place of the place
        tagline: '',          // Subtitle
        description: '',
        netCost: '',          // Base price (Puhunan)
        markupPercent: 15,    // Default 15% markup
        sellingPrice: 0,      // Final Promo Price per pax
        status: 'Active'
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Automatic Calculation Effect
    useEffect(() => {
        const cost = parseFloat(dealData.netCost) || 0;
        const markup = parseFloat(dealData.markupPercent) || 0;
        
        // Formula: Cost + (Cost * Markup%)
        const calculatedPrice = cost + (cost * (markup / 100));
        
        setDealData(prev => ({
            ...prev,
            sellingPrice: Math.round(calculatedPrice) // Round off to nearest integer
        }));
    }, [dealData.netCost, dealData.markupPercent]);

    // Cleanup memory for image preview
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDealData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file.');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!dealData.destination || !dealData.netCost || !imageFile) {
            alert('Please fill in the Destination, Net Cost, and upload an Image.');
            return;
        }

        setIsSubmitting(true);
        // const API_BASE_URL = 'http://localhost:5000'; 

        try {
            const formData = new FormData();
            formData.append('destination', dealData.destination);
            formData.append('tagline', dealData.tagline);
            formData.append('price', dealData.sellingPrice); // Sending the Final Price
            formData.append('description', dealData.description);
            formData.append('status', dealData.status);
            formData.append('image', imageFile);

            // Simulation of API Call
            setTimeout(() => {
                console.log("Submitting Deal:", Object.fromEntries(formData));
                alert('Deal published successfully!');
                handleCancel();
                setIsSubmitting(false);
            }, 1500);

        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setDealData({
            destination: '',
            tagline: '',
            description: '',
            netCost: '',
            markupPercent: 15,
            sellingPrice: 0,
            status: 'Active'
        });
        setImageFile(null);
        setImagePreview(null);
    };

    // Helper to format currency
    const formatCurrency = (amount, currency = 'PHP') => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    return (
        <div className="ad-page">
            <Sidebar />
            <main className="ad-main">
                <div className="ad-container">
                    <header className="ad-header">
                        <h1 className="ad-title">CREATE NEW DEAL</h1>
                        <p className="ad-subtitle">Manage your travel packages and pricing strategy</p>
                    </header>

                    <div className="ad-grid">
                        {/* LEFT COLUMN: Input Form */}
                        <div className="ad-form-wrapper">
                            
                            {/* 1. Destination Details */}
                            <section className="ad-section">
                                <h3 className="ad-section-title">
                                    <MapPin size={16} /> Destination Info
                                </h3>
                                <div className="ad-field-group">
                                    <div className="ad-field full-width">
                                        <label>Place / Destination *</label>
                                        <input 
                                            type="text" name="destination" 
                                            value={dealData.destination} onChange={handleChange} 
                                            placeholder="e.g. El Nido, Palawan" 
                                        />
                                    </div>
                                    <div className="ad-field full-width">
                                        <label>Tagline / Subtitle</label>
                                        <input 
                                            type="text" name="tagline" 
                                            value={dealData.tagline} onChange={handleChange} 
                                            placeholder="e.g. 3D2N Island Hopping Adventure" 
                                        />
                                    </div>
                                    <div className="ad-field full-width">
                                        <label>Inclusions / Description</label>
                                        <textarea 
                                            name="description" rows="4"
                                            value={dealData.description} onChange={handleChange}
                                            placeholder="Flight + Hotel + Transfer..."
                                        ></textarea>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Smart Pricing Engine */}
                            <section className="ad-section pricing-engine">
                                <h3 className="ad-section-title">
                                    <Calculator size={16} /> Smart Pricing Calculator
                                </h3>
                                <div className="pricing-grid">
                                    {/* Input: Net Cost */}
                                    <div className="ad-field">
                                        <label>Net Cost per Pax (PHP)</label>
                                        <div className="input-icon-wrapper">
                                            <span className="currency-symbol">₱</span>
                                            <input 
                                                type="number" name="netCost" 
                                                value={dealData.netCost} onChange={handleChange} 
                                                placeholder="0.00" 
                                            />
                                        </div>
                                        <small>Your base capital per person</small>
                                    </div>

                                    {/* Input: Markup */}
                                    <div className="ad-field">
                                        <label>Markup Percentage (%)</label>
                                        <div className="input-icon-wrapper">
                                            <input 
                                                type="number" name="markupPercent" 
                                                value={dealData.markupPercent} onChange={handleChange} 
                                                placeholder="15" 
                                            />
                                            <span className="percent-symbol">%</span>
                                        </div>
                                        <small>Profit margin added</small>
                                    </div>
                                </div>

                                {/* Output: Calculated Results */}
                                <div className="calculation-result">
                                    <div className="result-item php">
                                        <span>Final Promo Price (PHP)</span>
                                        <strong>{formatCurrency(dealData.sellingPrice, 'PHP')}</strong>
                                    </div>
                                    <div className="divider-icon">=</div>
                                    <div className="result-item usd">
                                        <div className="usd-label">
                                            <Globe size={14} /> Est. in USD
                                        </div>
                                        <strong>{formatCurrency(dealData.sellingPrice / FOREX_RATE, 'USD')}</strong>
                                    </div>
                                </div>
                            </section>
                            
                            <div className="ad-actions">
                                <button className="ad-btn cancel" onClick={handleCancel}>Discard</button>
                                <button className="ad-btn submit" onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="spinner" /> : 'Publish Deal'}
                                </button>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Preview & Image */}
                        <aside className="ad-sidebar">
                            <div className="ad-card upload-card">
                                <h4 className="card-head">Destination Image</h4>
                                {!imagePreview ? (
                                    <label className="upload-box">
                                        <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                                        <Upload size={32} className="upload-icon" />
                                        <span>Click to Upload</span>
                                    </label>
                                ) : (
                                    <div className="preview-box">
                                        <img src={imagePreview} alt="Preview" />
                                        <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="remove-btn">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Live Ticket Preview */}
                            <div className="ad-card preview-card">
                                <h4 className="card-head">Live Preview</h4>
                                <div className="deal-ticket">
                                    <div className="ticket-img">
                                        {imagePreview ? <img src={imagePreview} alt="Deal" /> : <div className="placeholder">No Image</div>}
                                        <span className="ticket-badge">PROMO</span>
                                    </div>
                                    <div className="ticket-info">
                                        <h5>{dealData.destination || 'Destination Name'}</h5>
                                        <p className="ticket-sub">{dealData.tagline || 'Package Subtitle'}</p>
                                        
                                        <div className="ticket-pricing-row">
                                            <div className="price-block">
                                                <span className="price-label">PHP PRICE</span>
                                                <span className="final-price">
                                                    {dealData.sellingPrice > 0 ? `₱${dealData.sellingPrice.toLocaleString()}` : '₱0'}
                                                </span>
                                            </div>
                                            <div className="price-block usd-block">
                                                <span className="price-label">USD (APPROX)</span>
                                                <span className="usd-price">
                                                    {dealData.sellingPrice > 0 ? `$${(dealData.sellingPrice / FOREX_RATE).toFixed(2)}` : '$0'}
                                                </span>
                                            </div>
                                        </div>
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

export default AddDeals;