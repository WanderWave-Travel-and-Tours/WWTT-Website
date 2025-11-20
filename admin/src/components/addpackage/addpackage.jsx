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
    const [inclusions, setInclusions] = useState(['']); 
    const [itinerary, setItinerary] = useState([{ day: 1, title: 'Arrival', activities: [''] }]);

    const navigate = useNavigate();

    // --- INCLUSION HANDLERS ---

    const addInclusion = () => {
        setInclusions(prev => [...prev, '']);
    };

    const removeInclusion = (indexToRemove) => {
        setInclusions(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleInclusionChange = (index, value) => {
        setInclusions(prev => prev.map((item, i) => i === index ? value : item));
    };

    // --- ITINERARY HANDLERS ---

    const addItineraryDay = () => {
        setItinerary(prev => [
            ...prev,
            { day: prev.length + 1, title: '', activities: [''] }
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
        const newTitle = value.trim() ? `Day ${dayIndex + 1}: ${value.trim()}` : '';
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const processedInclusions = inclusions.filter(item => item.trim().length > 0);

        const cleanedItinerary = itinerary
            .filter(day => day.activities.some(act => act.trim() !== ''))
            .map(day => ({
                day: day.day,
                title: day.title.split(': ').slice(1).join(': ') || day.title.trim(), 
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
             console.error('Please upload an image for the package.');
             return;
        }

        // NOTE: This fetch call is for mock purposes and assumes a backend server is running at localhost:5000.
        try {
            const response = await fetch('http://localhost:5000/api/packages/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) { // Check for successful HTTP status code
                console.log('✅ Package Added Successfully!');
                
                // Reset form state upon successful submission
                setTitle('');
                setDestination('');
                setPrice('');
                setDuration('');
                setCategory('Local');
                setFile(null);
                setInclusions(['']); 
                setItinerary([{ day: 1, title: 'Arrival', activities: [''] }]);
                
                // You might want to navigate after a successful addition
                // navigate('/view-packages'); 
            } else {
                console.error('❌ Error submitting package:', data.error || 'Server error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    return (
        <div className="addpackage-page-container"> 
            <Sidebar />
            
            <div className="main-content"> 
                <div className="addpackage-container">
                    <h2 className="form-title">Add New Tour Package (Admin)</h2>
                    
                    <form onSubmit={handleSubmit} className="add-form">
                        
                        {/* LEFT COLUMN: Basic Fields */}
                        <div className="form-column">
                            <div className="form-group">
                                <label className="form-label">📝 Package Title:</label>
                                <input type="text" placeholder="e.g. Boracay Super Sale" 
                                    value={title} onChange={e => setTitle(e.target.value)} required className="input-field" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">📍 Destination (City/Province):</label>
                                <input type="text" placeholder="e.g. Aklan, Philippines" 
                                    value={destination} onChange={e => setDestination(e.target.value)} required className="input-field" />
                            </div>

                            <div className="price-category-group">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">💰 Price (₱):</label>
                                    <input type="number" placeholder="e.g. 8999" 
                                        value={price} onChange={e => setPrice(e.target.value)} required className="input-field" />
                                </div>
                                
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">🏷️ Category:</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="select-field">
                                        <option value="Local">Local</option>
                                        <option value="International">International</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">⏱️ Duration (Days & Nights):</label>
                                <input type="text" placeholder="e.g. 3D2N" 
                                    value={duration} onChange={e => setDuration(e.target.value)} required className="input-field" />
                            </div>

                            {/* FILE INPUT in left column */}
                            <div className="form-group section-divider">
                                <label className="form-label">🖼️ Upload Image:</label>
                                <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" required className="input-field" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Inclusions and Itinerary */}
                        <div className="form-column">
                            {/* INCLUSIONS FIELDS */}
                            <div className="form-group section-divider">
                                <h3 className="section-title">What's Included (Inclusions)</h3>
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
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button type="button" onClick={addInclusion} className="add-activity-button">
                                    + Add Inclusion
                                </button>
                            </div>

                            {/* ITINERARY FIELDS */}
                            <div className="form-group section-divider">
                                <h3 className="section-title">Itinerary Builder</h3>
                                
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
                                            required
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
                        </div>
                        
                        <button type="submit" className="submit-button">Upload Package 🚀</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPackage;