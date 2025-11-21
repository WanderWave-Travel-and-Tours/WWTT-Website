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
    const [previewUrl, setPreviewUrl] = useState(null);
    const [inclusions, setInclusions] = useState(['']);
    const [itinerary, setItinerary] = useState([{ day: 1, title: 'Day 1: Arrival', activities: [''] }]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const addInclusion = () => setInclusions(prev => [...prev, '']);
    const removeInclusion = (i) => setInclusions(prev => prev.filter((_, idx) => idx !== i));
    const handleInclusionChange = (i, val) => setInclusions(prev => prev.map((item, idx) => idx === i ? val : item));

    const addItineraryDay = () => setItinerary(prev => [...prev, { day: prev.length + 1, title: `Day ${prev.length + 1}:`, activities: [''] }]);
    const removeItineraryDay = (dayIdx) => {
        setItinerary(prev => prev.filter((_, i) => i !== dayIdx).map((day, i) => ({ ...day, day: i + 1, title: day.title.replace(/^Day \d+:?/, `Day ${i + 1}:`) })));
    };
    const handleDayTitleChange = (dayIdx, val) => {
        const newTitle = val.trim() ? `Day ${dayIdx + 1}: ${val.trim()}` : `Day ${dayIdx + 1}:`;
        setItinerary(prev => prev.map((day, i) => i === dayIdx ? { ...day, title: newTitle } : day));
    };
    const addActivity = (dayIdx) => setItinerary(prev => prev.map((day, i) => i === dayIdx ? { ...day, activities: [...day.activities, ''] } : day));
    const handleActivityChange = (dayIdx, actIdx, val) => setItinerary(prev => prev.map((day, i) => i === dayIdx ? { ...day, activities: day.activities.map((a, ai) => ai === actIdx ? val : a) } : day));
    const removeActivity = (dayIdx, actIdx) => setItinerary(prev => prev.map((day, i) => i === dayIdx ? { ...day, activities: day.activities.filter((_, ai) => ai !== actIdx) } : day));

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        if (selected) setPreviewUrl(URL.createObjectURL(selected));
    };

    useEffect(() => {
        if (!packageId) { alert('Error: No package selected.'); navigate('/view-packages'); }
    }, [packageId, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            const isLoggedIn = localStorage.getItem('adminToken');
            if (!isLoggedIn) { navigate('/'); return; }
            if (!packageId) return;
            try {
                const res = await fetch(`${API_BASE_URL}/${packageId}`);
                const result = await res.json();
                if (result.status === 'ok' && result.data) {
                    const pkg = result.data;
                    setTitle(pkg.title); setDestination(pkg.destination); setPrice(pkg.price);
                    setDuration(pkg.duration); setCategory(pkg.category); setExistingImage(pkg.image);
                    setInclusions(pkg.inclusions?.length > 0 ? pkg.inclusions : ['']);
                    setItinerary(pkg.itinerary?.map(d => ({ day: d.day, title: d.title || `Day ${d.day}:`, activities: d.activities?.length > 0 ? d.activities : [''] })) || [{ day: 1, title: 'Day 1:', activities: [''] }]);
                } else { setError('Package not found.'); }
            } catch { setError('Network error.'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [packageId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const processedInclusions = inclusions.filter(i => i.trim().length > 0);
        const cleanedItinerary = itinerary.filter(d => d.activities.some(a => a.trim() !== '')).map(d => ({ day: d.day, title: d.title.replace(/^Day \d+:?/, '').trim(), activities: d.activities.filter(a => a.trim() !== '') }));
        const formData = new FormData();
        formData.append('title', title); formData.append('destination', destination);
        formData.append('price', price); formData.append('duration', duration);
        formData.append('category', category); formData.append('inclusions', JSON.stringify(processedInclusions));
        formData.append('itinerary', JSON.stringify(cleanedItinerary));
        if (file) formData.append('image', file); else formData.append('existingImage', existingImage);
        try {
            const res = await fetch(`${API_BASE_URL}/edit/${packageId}`, { method: 'PUT', body: formData });
            const data = await res.json();
            if (data.status === 'ok') { alert('✅ Package Updated!'); navigate('/view-packages'); }
            else alert('❌ Error: ' + data.error);
        } catch (err) { console.error(err); alert('❌ Server error'); }
    };

    if (loading) return <div className="edit-page"><Sidebar /><main className="edit-main"><div className="edit-loading">Loading...</div></main></div>;
    if (error) return <div className="edit-page"><Sidebar /><main className="edit-main"><div className="edit-error">{error}</div></main></div>;

    return (
        <div className="edit-page">
            <Sidebar />
            <main className="edit-main">
                <div className="edit-container">
                    <header className="edit-header">
                        <button className="edit-back" onClick={() => navigate(-1)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Back
                        </button>
                        <h1 className="edit-title">EDIT PACKAGE</h1>
                        <p className="edit-subtitle">Update the details of your tour package</p>
                    </header>

                    <form onSubmit={handleSubmit} className="edit-form">
                        <div className="edit-grid">
                            <div className="edit-left">
                                {/* Current/New Image */}
                                <section className="edit-section">
                                    <h2 className="edit-section-title">COVER IMAGE</h2>
                                    <label className="edit-upload">
                                        <input type="file" onChange={handleFileChange} accept="image/*" hidden />
                                        <div className="edit-upload-preview">
                                            <img src={previewUrl || `http://localhost:5000/uploads/${existingImage}`} alt="Package" onError={(e) => { e.target.src = 'https://placehold.co/400x250/eee/999?text=No+Image'; }} />
                                            <span className="edit-upload-change">Change Photo</span>
                                        </div>
                                    </label>
                                    <p className="edit-upload-hint">Click image to upload new photo (optional)</p>
                                </section>

                                {/* Basic Info */}
                                <section className="edit-section">
                                    <h2 className="edit-section-title">BASIC INFORMATION</h2>
                                    <div className="edit-fields">
                                        <div className="edit-field edit-field--full">
                                            <label>Package Name</label>
                                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                                        </div>
                                        <div className="edit-field">
                                            <label>Destination</label>
                                            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} required />
                                        </div>
                                        <div className="edit-field">
                                            <label>Category</label>
                                            <select value={category} onChange={e => setCategory(e.target.value)}>
                                                <option value="Local">Local Tour</option>
                                                <option value="International">International Tour</option>
                                            </select>
                                        </div>
                                        <div className="edit-field">
                                            <label>Price (PHP)</label>
                                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                                        </div>
                                        <div className="edit-field">
                                            <label>Duration</label>
                                            <input type="text" value={duration} onChange={e => setDuration(e.target.value)} required />
                                        </div>
                                    </div>
                                </section>

                                {/* Inclusions */}
                                <section className="edit-section">
                                    <div className="edit-section-header">
                                        <h2 className="edit-section-title">INCLUSIONS</h2>
                                        <span className="edit-count">{inclusions.filter(i => i.trim()).length} items</span>
                                    </div>
                                    <div className="edit-list">
                                        {inclusions.map((inc, i) => (
                                            <div key={i} className="edit-list-item">
                                                <span className="edit-bullet"></span>
                                                <input type="text" placeholder="What's included?" value={inc} onChange={e => handleInclusionChange(i, e.target.value)} />
                                                {inclusions.length > 1 && (
                                                    <button type="button" className="edit-remove" onClick={() => removeInclusion(i)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="edit-add-btn" onClick={addInclusion}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                                        Add Item
                                    </button>
                                </section>

                                {/* Itinerary */}
                                <section className="edit-section">
                                    <div className="edit-section-header">
                                        <h2 className="edit-section-title">ITINERARY</h2>
                                        <span className="edit-count">{itinerary.length} days</span>
                                    </div>
                                    <div className="edit-timeline">
                                        {itinerary.map((day, dayIdx) => (
                                            <div key={day.day} className="edit-day">
                                                <div className="edit-day-marker">
                                                    <span className="edit-day-num">{day.day}</span>
                                                    {dayIdx < itinerary.length - 1 && <div className="edit-day-line"></div>}
                                                </div>
                                                <div className="edit-day-content">
                                                    <div className="edit-day-header">
                                                        <input type="text" className="edit-day-title" placeholder="Day title" value={day.title.replace(`Day ${day.day}: `, '')} onChange={e => handleDayTitleChange(dayIdx, e.target.value)} />
                                                        {itinerary.length > 1 && <button type="button" className="edit-day-remove" onClick={() => removeItineraryDay(dayIdx)}>Delete</button>}
                                                    </div>
                                                    <div className="edit-activities">
                                                        {day.activities.map((act, actIdx) => (
                                                            <div key={actIdx} className="edit-activity">
                                                                <input type="text" placeholder="Add activity" value={act} onChange={e => handleActivityChange(dayIdx, actIdx, e.target.value)} />
                                                                {day.activities.length > 1 && (
                                                                    <button type="button" className="edit-remove edit-remove--sm" onClick={() => removeActivity(dayIdx, actIdx)}>
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button type="button" className="edit-add-activity" onClick={() => addActivity(dayIdx)}>+ Activity</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="edit-add-btn" onClick={addItineraryDay}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                                        Add Day
                                    </button>
                                </section>
                            </div>

                            {/* Preview */}
                            <aside className="edit-right">
                                <div className="edit-preview">
                                    <span className="edit-preview-label">PREVIEW</span>
                                    <div className="edit-card">
                                        <div className="edit-card-image">
                                            <img src={previewUrl || `http://localhost:5000/uploads/${existingImage}`} alt="Preview" onError={(e) => { e.target.src = 'https://placehold.co/400x200/eee/999?text=No+Image'; }} />
                                        </div>
                                        <div className="edit-card-body">
                                            <span className="edit-card-badge">{category}</span>
                                            <h3 className="edit-card-title">{title || 'Package Name'}</h3>
                                            <p className="edit-card-location">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                {destination || 'Destination'}
                                            </p>
                                            <div className="edit-card-divider"></div>
                                            <div className="edit-card-meta">
                                                <div><span>Price</span><strong>₱{price ? Number(price).toLocaleString() : '0'}</strong></div>
                                                <div><span>Duration</span><strong>{duration || '--'}</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="edit-stats">
                                        <div className="edit-stat"><strong>{inclusions.filter(i => i.trim()).length}</strong><span>Inclusions</span></div>
                                        <div className="edit-stat"><strong>{itinerary.length}</strong><span>Days</span></div>
                                        <div className="edit-stat"><strong>{itinerary.reduce((a, d) => a + d.activities.filter(x => x.trim()).length, 0)}</strong><span>Activities</span></div>
                                    </div>
                                </div>
                                <div className="edit-actions">
                                    <button type="button" className="edit-btn edit-btn--cancel" onClick={() => navigate(-1)}>Cancel</button>
                                    <button type="submit" className="edit-btn edit-btn--submit">Update Package</button>
                                </div>
                            </aside>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditPackage;