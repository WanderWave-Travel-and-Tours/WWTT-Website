import React, { useState, useEffect } from 'react';
import { Upload, Trash2, BadgePercent } from 'lucide-react';
import Sidebar from '../sidebar/Sidebar';
import './adddeal.css';

const AddDeal = () => {
    const [dealDetails, setDealDetails] = useState({
        title: '',
        description: '',
        price: '',
        discountedPrice: '',
        status: 'Active'
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDealDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image.');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!dealDetails.title || !dealDetails.price || !imageFile) {
            alert('Please provide title, price, and image.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', dealDetails.title);
        formData.append('description', dealDetails.description);
        formData.append('price', dealDetails.price);
        formData.append('discountedPrice', dealDetails.discountedPrice);
        formData.append('status', dealDetails.status);

        try {
            const response = await fetch('https://wanderwaveph-backend.onrender.com0/api/deals/add', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                alert('Deal added successfully!');
                handleCancel();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to connect to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setDealDetails({
            title: '', description: '', price: '', discountedPrice: '', status: 'Active'
        });
        removeImage();
    };

    return (
        <div className="ad-page">
            <Sidebar />
            <main className="ad-main">
                <div className="ad-container">
                    <header className="ad-header">
                        <h1 className="ad-title">CREATE EXCLUSIVE DEAL</h1>
                        <p className="ad-subtitle">Offer special pricing for your customers</p>
                    </header>

                    <div className="ad-grid">
                        <div className="ad-left">
                            <section className="ad-section">
                                <h2 className="ad-section-title">DEAL DETAILS</h2>
                                <div className="ad-fields">
                                    <div className="ad-field ad-field--full">
                                        <label>Deal Image</label>
                                        {!imagePreview ? (
                                            <div className="ad-upload-zone">
                                                <input type="file" id="deal-upload" accept="image/*" onChange={handleImageChange} hidden />
                                                <label htmlFor="deal-upload" className="ad-upload-label">
                                                    <div className="ad-upload-icon"><Upload size={32} /></div>
                                                    <span className="ad-upload-text">Upload Image</span>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="ad-preview-container">
                                                <img src={imagePreview} alt="Preview" />
                                                <button onClick={removeImage} className="ad-remove-btn"><Trash2 size={14} /> Remove</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ad-field ad-field--full">
                                        <label>Deal Title</label>
                                        <input type="text" name="title" value={dealDetails.title} onChange={handleChange} placeholder="e.g., 3D2N Boracay Budget" />
                                    </div>

                                    <div className="ad-field">
                                        <label>Original Price</label>
                                        <input type="number" name="price" value={dealDetails.price} onChange={handleChange} placeholder="0.00" />
                                    </div>

                                    <div className="ad-field">
                                        <label>Discounted Price</label>
                                        <input type="number" name="discountedPrice" value={dealDetails.discountedPrice} onChange={handleChange} placeholder="0.00" />
                                    </div>

                                    <div className="ad-field ad-field--full">
                                        <label>Description</label>
                                        <textarea name="description" value={dealDetails.description} onChange={handleChange} rows="4"></textarea>
                                    </div>

                                    <div className="ad-field">
                                        <label>Status</label>
                                        <select name="status" value={dealDetails.status} onChange={handleChange}>
                                            <option value="Active">Active</option>
                                            <option value="Expired">Expired</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <div className="ad-actions">
                                <button className="ad-btn ad-btn--cancel" onClick={handleCancel}>Cancel</button>
                                <button className="ad-btn ad-btn--submit" onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Create Deal'}
                                </button>
                            </div>
                        </div>

                        <aside className="ad-right">
                            <div className="ad-preview-card">
                                <span>PREVIEW</span>
                                <div className="deal-card-mockup">
                                    <div className="dc-img">
                                        {imagePreview ? <img src={imagePreview} alt="Deal" /> : <BadgePercent size={40} color="#cbd5e1"/>}
                                        {dealDetails.discountedPrice && (
                                            <div className="dc-badge">SALE</div>
                                        )}
                                    </div>
                                    <div className="dc-content">
                                        <h4>{dealDetails.title || 'Deal Title'}</h4>
                                        <div className="dc-prices">
                                            <span className="dc-old">₱{dealDetails.price || '0'}</span>
                                            <span className="dc-new">₱{dealDetails.discountedPrice || '0'}</span>
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

export default AddDeal;