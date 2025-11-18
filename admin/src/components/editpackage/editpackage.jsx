import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import Sidebar from '../sidebar/sidebar';
import './EditPackage.css'; 

const API_BASE_URL = 'http://localhost:5000/api/packages';

const EditPackage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const packageId = location.state?.packageId; 

    const [title, setTitle] = useState('');
    const [destination, setDestination] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [category, setCategory] = useState('Local');
    const [file, setFile] = useState(null); 
    const [existingImage, setExistingImage] = useState(''); 
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!packageId) {
            alert('Error: No package selected for editing.');
            navigate('/view-packages');
        }
    }, [packageId, navigate]);

    useEffect(() => {
        const fetchPackageData = async () => {
            const isLoggedIn = localStorage.getItem('adminToken');
            if (!isLoggedIn) {
                navigate('/');
                return;
            }

            if (!packageId) return; 
            
            try {
                const response = await fetch(`${API_BASE_URL}/${packageId}`);
                const result = await response.json();

                if (result.status === 'ok' && result.data) {
                    const pkg = result.data;
                    setTitle(pkg.title);
                    setDestination(pkg.destination);
                    setPrice(pkg.price);
                    setDuration(pkg.duration);
                    setCategory(pkg.category);
                    setExistingImage(pkg.image); 
                } else {
                    setError('Error: Package not found or failed to fetch.');
                }
            } catch (err) {
                setError('Network error or server connection failed.');
            } finally {
                setLoading(false);
            }
        };

        fetchPackageData();
    }, [packageId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('destination', destination);
        formData.append('price', price);
        formData.append('duration', duration);
        formData.append('category', category);
        
        if (file) {
            formData.append('image', file); 
        } else {
            formData.append('existingImage', existingImage);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/edit/${packageId}`, {
                method: 'PUT',
                body: formData, 
            });

            const data = await response.json();
            if (data.status === 'ok') {
                alert('✅ Package Updated Successfully!');
                navigate('/view-packages'); 
            } else {
                alert('❌ Error updating package: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong during update.');
        }
    };

    if (loading || !packageId) { 
    }

    if (error) {
    }

    return (
        <div className="editpackage-page-container">
            <Sidebar />
            
            <div className="main-content">
                <div className="editpackage-container">
                    <small style={{display: 'block', marginBottom: '10px', color: '#999'}}>Internal ID: {packageId}</small>
                    <h2 className="form-title">✏️ Edit Package: {title}</h2>
                    
                    <form onSubmit={handleSubmit} className="edit-form">
                        
                        {/* Current Image Display */}
                        <div className="form-group current-image-group">
                            <label className="form-label">Current Image:</label>
                            <img 
                                src={`http://localhost:5000/uploads/${existingImage}`} 
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x250/cccccc/333333?text=Image+Not+Found" }}
                                alt="Current Package" 
                                className="current-image-preview" 
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Package Title:</label>
                            <input type="text" 
                                value={title} onChange={e => setTitle(e.target.value)} required className="input-field" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Destination:</label>
                            <input type="text" 
                                value={destination} onChange={e => setDestination(e.target.value)} required className="input-field" />
                        </div>

                        <div className="price-category-group">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Price (₱):</label>
                                <input type="number" 
                                    value={price} onChange={e => setPrice(e.target.value)} required className="input-field" />
                            </div>
                            
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Category:</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="select-field">
                                    <option value="Local">Local</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Duration:</label>
                            <input type="text" 
                                value={duration} onChange={e => setDuration(e.target.value)} required className="input-field" />
                        </div>

                        {/* FILE INPUT (Optional update) */}
                        <div className="form-group">
                            <label className="form-label">Upload New Image (Optional):</label>
                            <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" className="file-input-group" />
                            <small>Leave blank to keep current image.</small>
                        </div>

                        <button type="submit" className="submit-button update-btn">Update Package 💾</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPackage;