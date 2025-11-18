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
    const [inclusions, setInclusions] = useState(['']); 
    const [itinerary, setItinerary] = useState([{ day: 1, title: 'Day 1: Arrival', activities: [''] }]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const addInclusion = () => {
        setInclusions(prev => [...prev, '']);
    };

    const removeInclusion = (indexToRemove) => {
        setInclusions(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleInclusionChange = (index, value) => {
        setInclusions(prev => prev.map((item, i) => i === index ? value : item));
    };

    const addItineraryDay = () => {
        setItinerary(prev => [
            ...prev,
            { day: prev.length + 1, title: `Day ${prev.length + 1}:`, activities: [''] }
        ]);
    };

    const removeItineraryDay = (dayIndex) => {
        setItinerary(prev => 
            prev.filter((_, index) => index !== dayIndex)
                .map((day, index) => ({ 
                    ...day, 
                    day: index + 1, 
                    title: day.title.replace(/^Day \d+:?/, `Day ${index + 1}:`) 
                }))
        );
    };

    const handleDayTitleChange = (dayIndex, value) => {
        const newTitle = value.trim() ? `Day ${dayIndex + 1}: ${value.trim()}` : `Day ${dayIndex + 1}:`;
        setItinerary(prev => prev.map((day, index) => 
            index === dayIndex ? { ...day, title: newTitle } : day
        ));
    };

    const addActivity = (dayIndex) => {
        setItinerary(prev => prev.map((day, index) => 
            index === dayIndex ? { ...day, activities: [...day.activities, ''] } : day
        ));
    };

    const handleActivityChange = (dayIndex, activityIndex, value) => {
        setItinerary(prev => prev.map((day, index) => 
            index === dayIndex ? { 
                ...day, 
                activities: day.activities.map((activity, aIndex) => 
                    aIndex === activityIndex ? value : activity
                )
            } : day
        ));
    };

    const removeActivity = (dayIndex, activityIndex) => {
        setItinerary(prev => prev.map((day, index) => 
            index === dayIndex ? { 
                ...day, 
                activities: day.activities.filter((_, aIndex) => aIndex !== activityIndex)
            } : day
        ));
    };

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
                    setInclusions(pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : ['']);

                    const formattedItinerary = pkg.itinerary?.map(day => ({
                        day: day.day,
                        title: day.title || `Day ${day.day}:`, 
                        activities: day.activities && day.activities.length > 0 ? day.activities : ['']
                    })) || [{ day: 1, title: 'Day 1:', activities: [''] }];

                    setItinerary(formattedItinerary);
                   
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
        
        const processedInclusions = inclusions.filter(item => item.trim().length > 0);
        const cleanedItinerary = itinerary
            .filter(day => day.activities.some(act => act.trim() !== ''))
            .map(day => ({
                day: day.day,
                title: day.title.replace(/^Day \d+:?/, '').trim(), 
                activities: day.activities.filter(act => act.trim() !== '')
            }));

        const formData = new FormData();
        formData.append('title', title);
        formData.append('destination', destination);
        formData.append('price', price);
        formData.append('duration', duration);
        formData.append('category', category);
        formData.append('inclusions', JSON.stringify(processedInclusions));
        formData.append('itinerary', JSON.stringify(cleanedItinerary));
        
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
                console.log('✅ Package Updated Successfully!');
                navigate('/view-packages'); 
            } else {
                console.error('❌ Error updating package: ' + data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) { 
        return (
            <div className="loading-state main-content">
                Loading package data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state main-content">
                Error loading package: {error}
            </div>
        );
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

                        {/* BASIC FIELDS */}
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

                        {/* WHATS INCLUDED DYNAMIC FIELDS (Same as AddPackage) */}
                        <div className="form-group section-divider">
                            <h3 className="section-title">✨ What's Included (Inclusions)</h3>
                            <label className="form-label">Add inclusions one by one:</label>
                            
                            {inclusions.map((item, index) => (
                                <div key={index} className="inclusion-input-group activity-input-group">
                                    <input
                                        type="text"
                                        placeholder="e.g. Daily Breakfast"
                                        value={item}
                                        onChange={e => handleInclusionChange(index, e.target.value)}
                                        className="input-field"
                                    />
                                    {(inclusions.length > 1 || (inclusions.length === 1 && item !== '')) && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeInclusion(index)}
                                            className="remove-activity-button"
                                            style={{ marginLeft: '10px' }}
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button type="button" onClick={addInclusion} className="add-activity-button" style={{ marginTop: '10px' }}>
                                + Add Inclusion
                            </button>
                        </div>
                        
                        {/* ITINERARY FIELDS (Same as AddPackage) */}
                        <div className="form-group section-divider">
                            <h3 className="section-title">🗺️ Itinerary Builder</h3>
                            
                            {itinerary.map((dayItem, dayIndex) => (
                                <div key={dayItem.day} className="itinerary-day-box">
                                    <div className="itinerary-header">
                                        <label className="form-label">Day {dayItem.day}:</label>
                                        {itinerary.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeItineraryDay(dayIndex)}
                                                className="remove-day-button"
                                            >
                                                Remove Day
                                            </button>
                                        )}
                                    </div>
                                    
                                    <input 
                                        type="text" 
                                        placeholder={`Day ${dayItem.day} Title (e.g., Arrival & City Tour)`}
                                        value={dayItem.title.replace(`Day ${dayItem.day}: `, '')} 
                                        onChange={e => handleDayTitleChange(dayIndex, e.target.value)}
                                        className="input-field day-title-input"
                                    />

                                    <div className="activities-list">
                                        <label className="form-label activity-label">Activities:</label>
                                        {dayItem.activities.map((activity, activityIndex) => (
                                            <div key={activityIndex} className="activity-input-group">
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 8:00 AM - Hotel Pickup"
                                                    value={activity}
                                                    onChange={e => handleActivityChange(dayIndex, activityIndex, e.target.value)}
                                                    className="input-field activity-input"
                                                />
                                                {(dayItem.activities.length > 1 || (dayItem.activities.length === 1 && activity !== '')) && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeActivity(dayIndex, activityIndex)}
                                                        className="remove-activity-button"
                                                    >
                                                        &times;
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button 
                                            type="button" 
                                            onClick={() => addActivity(dayIndex)}
                                            className="add-activity-button"
                                        >
                                            + Add Activity
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={addItineraryDay} className="add-day-button">
                                ➕ Add New Day
                            </button>
                        </div>

                        {/* FILE INPUT (Optional update) */}
                        <div className="form-group section-divider">
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