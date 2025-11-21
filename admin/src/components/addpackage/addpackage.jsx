import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import './AddPackage.css';

const AddPackage = () => {
    const [title, setTitle] = useState('');
    const [destination, setDestination] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [category, setCategory] = useState('Local');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [inclusions, setInclusions] = useState(['']); 
    const [itinerary, setItinerary] = useState([{ day: 1, title: 'Arrival', activities: [''] }]);

    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        if (selected) setPreviewUrl(URL.createObjectURL(selected));
    };

    const addInclusion = () => setInclusions([...inclusions, '']);
    const removeInclusion = (i) => setInclusions(inclusions.filter((_, idx) => idx !== i));
    const handleIncChange = (i, val) => setInclusions(inclusions.map((item, idx) => idx === i ? val : item));

    const addDay = () => setItinerary([...itinerary, { day: itinerary.length + 1, title: '', activities: [''] }]);
    const removeDay = (dayIndex) => {
        setItinerary(itinerary.filter((_, index) => index !== dayIndex).map((day, index) => ({ ...day, day: index + 1, title: day.title.replace(/^Day \d+:?/, `Day ${index + 1}:`) })));
    };
    const handleDayTitle = (dayIndex, value) => {
        const newTitle = value.trim() ? `Day ${dayIndex + 1}: ${value.trim()}` : '';
        setItinerary(itinerary.map((day, index) => index === dayIndex ? { ...day, title: newTitle } : day));
    };

    const addAct = (i) => setItinerary(itinerary.map((d, idx) => idx === i ? { ...d, activities: [...d.activities, ''] } : d));
    const removeAct = (di, ai) => setItinerary(itinerary.map((d, idx) => idx === di ? { ...d, activities: d.activities.filter((_, x) => x !== ai) } : d));
    const handleAct = (di, ai, val) => setItinerary(itinerary.map((d, idx) => idx === di ? { ...d, activities: d.activities.map((a, x) => x === ai ? val : a) } : d));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const processedInclusions = inclusions.filter(item => item.trim().length > 0);
        const cleanedItinerary = itinerary.filter(day => day.activities.some(act => act.trim() !== '')).map(day => ({ day: day.day, title: day.title.split(': ').slice(1).join(': ') || day.title.trim(), activities: day.activities.filter(act => act.trim() !== '') }));

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
            alert('Please upload an image for the package.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/packages/add', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) { 
                alert('✅ Package Added Successfully!');
                setTitle(''); setDestination(''); setPrice(''); setDuration(''); setCategory('Local');
                setFile(null); setPreviewUrl(null); setInclusions(['']); 
                setItinerary([{ day: 1, title: 'Arrival', activities: [''] }]);
            } else {
                alert('❌ Error: ' + (data.error || 'Server error'));
            }
        } catch (error) {
            console.error('Fetch error:', error);
            alert('❌ Error connecting to server');
        }
    };

    return (
        <div className="pkg-page">
            <Sidebar />
            <main className="pkg-main">
                <div className="pkg-container">
                    {/* Header */}
                    <header className="pkg-header">
                        <button className="pkg-back" onClick={() => navigate(-1)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Back
                        </button>
                        <h1 className="pkg-title">NEW PACKAGE</h1>
                        <p className="pkg-subtitle">Fill in the details below to create a new tour package</p>
                    </header>

                    <form onSubmit={handleSubmit} className="pkg-form">
                        <div className="pkg-grid">
                            {/* Left Column */}
                            <div className="pkg-left">
                                {/* Cover Image */}
                                <section className="pkg-section">
                                    <h2 className="pkg-section-title">COVER IMAGE</h2>
                                    <label className="pkg-upload">
                                        <input type="file" onChange={handleFileChange} accept="image/*" hidden required />
                                        {previewUrl ? (
                                            <div className="pkg-upload-preview">
                                                <img src={previewUrl} alt="Cover" />
                                                <span className="pkg-upload-change">Change Photo</span>
                                            </div>
                                        ) : (
                                            <div className="pkg-upload-empty">
                                                <div className="pkg-upload-icon">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                                </div>
                                                <p>Click to upload cover photo</p>
                                                <span>JPG, PNG or WebP • Max 5MB</span>
                                            </div>
                                        )}
                                    </label>
                                </section>

                                {/* Basic Info */}
                                <section className="pkg-section">
                                    <h2 className="pkg-section-title">BASIC INFORMATION</h2>
                                    <div className="pkg-fields">
                                        <div className="pkg-field pkg-field--full">
                                            <label>Package Name</label>
                                            <input type="text" placeholder="Enter package name" value={title} onChange={e => setTitle(e.target.value)} required />
                                        </div>
                                        <div className="pkg-field">
                                            <label>Destination</label>
                                            <input type="text" placeholder="e.g. Boracay" value={destination} onChange={e => setDestination(e.target.value)} required />
                                        </div>
                                        <div className="pkg-field">
                                            <label>Tour Type</label>
                                            <select value={category} onChange={e => setCategory(e.target.value)}>
                                                <option>Local Tour</option>
                                                <option>International Tour</option>
                                            </select>
                                        </div>
                                        <div className="pkg-field">
                                            <label>Price (PHP)</label>
                                            <input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} required step="0.01" min="0" />
                                        </div>
                                        <div className="pkg-field">
                                            <label>Duration</label>
                                            <input type="text" placeholder="e.g. 3D2N" value={duration} onChange={e => setDuration(e.target.value)} required />
                                        </div>
                                    </div>
                                </section>

                                {/* Inclusions */}
                                <section className="pkg-section">
                                    <div className="pkg-section-header">
                                        <h2 className="pkg-section-title">INCLUSIONS</h2>
                                        <span className="pkg-count">{inclusions.filter(i => i.trim()).length} items</span>
                                    </div>
                                    <div className="pkg-list">
                                        {inclusions.map((inc, i) => (
                                            <div key={i} className="pkg-list-item">
                                                <span className="pkg-bullet"></span>
                                                <input type="text" placeholder="What's included?" value={inc} onChange={e => handleIncChange(i, e.target.value)} />
                                                {inclusions.length > 1 && (
                                                    <button type="button" className="pkg-remove" onClick={() => removeInclusion(i)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="pkg-add-btn" onClick={addInclusion}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                                        Add Item
                                    </button>
                                </section>

                                {/* Itinerary */}
                                <section className="pkg-section">
                                    <div className="pkg-section-header">
                                        <h2 className="pkg-section-title">ITINERARY</h2>
                                        <span className="pkg-count">{itinerary.length} days</span>
                                    </div>
                                    <div className="pkg-timeline">
                                        {itinerary.map((day, dayIdx) => (
                                            <div key={day.day} className="pkg-day">
                                                <div className="pkg-day-marker">
                                                    <span className="pkg-day-num">{day.day}</span>
                                                    {dayIdx < itinerary.length - 1 && <div className="pkg-day-line"></div>}
                                                </div>
                                                <div className="pkg-day-content">
                                                    <div className="pkg-day-header">
                                                        <input type="text" className="pkg-day-title" placeholder="Day title" value={day.title.replace(`Day ${day.day}: `, '')} onChange={e => handleDayTitle(dayIdx, e.target.value)} required />
                                                        {itinerary.length > 1 && (
                                                            <button type="button" className="pkg-day-remove" onClick={() => removeDay(dayIdx)}>Delete</button>
                                                        )}
                                                    </div>
                                                    <div className="pkg-activities">
                                                        {day.activities.map((act, actIdx) => (
                                                            <div key={actIdx} className="pkg-activity">
                                                                <input type="text" placeholder="Add activity" value={act} onChange={e => handleAct(dayIdx, actIdx, e.target.value)} />
                                                                {day.activities.length > 1 && (
                                                                    <button type="button" className="pkg-remove pkg-remove--sm" onClick={() => removeAct(dayIdx, actIdx)}>
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button type="button" className="pkg-add-activity" onClick={() => addAct(dayIdx)}>+ Activity</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="pkg-add-btn" onClick={addDay}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                                        Add Day
                                    </button>
                                </section>
                            </div>

                            {/* Right Column - Preview */}
                            <aside className="pkg-right">
                                <div className="pkg-preview">
                                    <span className="pkg-preview-label">PREVIEW</span>
                                    <div className="pkg-card">
                                        <div className="pkg-card-image">
                                            {previewUrl ? <img src={previewUrl} alt="Preview" /> : <span>No Image</span>}
                                        </div>
                                        <div className="pkg-card-body">
                                            <span className="pkg-card-badge">{category}</span>
                                            <h3 className="pkg-card-title">{title || 'Package Name'}</h3>
                                            <p className="pkg-card-location">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                {destination || 'Destination'}
                                            </p>
                                            <div className="pkg-card-divider"></div>
                                            <div className="pkg-card-meta">
                                                <div>
                                                    <span>Price</span>
                                                    <strong>₱{price ? Number(price).toLocaleString() : '0'}</strong>
                                                </div>
                                                <div>
                                                    <span>Duration</span>
                                                    <strong>{duration || '--'}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pkg-stats">
                                        <div className="pkg-stat">
                                            <strong>{inclusions.filter(i => i.trim()).length}</strong>
                                            <span>Inclusions</span>
                                        </div>
                                        <div className="pkg-stat">
                                            <strong>{itinerary.length}</strong>
                                            <span>Days</span>
                                        </div>
                                        <div className="pkg-stat">
                                            <strong>{itinerary.reduce((a, d) => a + d.activities.filter(x => x.trim()).length, 0)}</strong>
                                            <span>Activities</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pkg-actions">
                                    <button type="button" className="pkg-btn pkg-btn--cancel" onClick={() => navigate(-1)}>Cancel</button>
                                    <button type="submit" className="pkg-btn pkg-btn--submit">Publish</button>
                                </div>
                            </aside>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddPackage;