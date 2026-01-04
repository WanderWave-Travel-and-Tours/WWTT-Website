import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Image as ImageIcon, MapPin, DollarSign, Users, X, Plus } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditHotel.css';

const EditHotel = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
    // 👇 ADDED: State for Destinations list
    const [destinations, setDestinations] = useState([]);

    const API_BASE_URL = 'http://localhost:5000';

    // --- HELPER: Image URL Builder ---
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
        
        // Fix backslashes for Windows paths
        let cleanPath = imagePath.replace(/\\/g, '/');
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        
        // Handle 'uploads' prefix logic
        if (cleanPath.startsWith('uploads/')) return `${API_BASE_URL}/${cleanPath}`;
        return `${API_BASE_URL}/uploads/${cleanPath}`;
    };

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        city: '', // Controlled by dropdown
        country: 'Philippines',
        description: '',
        price: '',
        priceUnit: 'per night',
        maxCapacity: '',
        featured: false
    });

    const [amenities, setAmenities] = useState({
        wifi: false, parking: false, pool: false, gym: false,
        restaurant: false, spa: false, airConditioning: false,
        roomService: false, laundry: false, bar: false
    });

    // Image States
    const [mainImageFile, setMainImageFile] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState("");
    const [existingGallery, setExistingGallery] = useState([]); 
    const [newGalleryFiles, setNewGalleryFiles] = useState([]); 
    const [deletedImages, setDeletedImages] = useState([]);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // --- FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Destinations (Logic from AddHotel)
                const destResponse = await fetch(`${API_BASE_URL}/api/packages/all`);
                const destData = await destResponse.json();
                
                if (destData.status === 'ok' && Array.isArray(destData.data)) {
                    const uniqueDestinations = [...new Set(
                        destData.data.map(pkg => pkg.destination).filter(dest => dest && dest.trim() !== '')
                    )];
                    setDestinations(uniqueDestinations);
                }

                // 2. Fetch Hotel Details
                const response = await fetch(`${API_BASE_URL}/api/hotels/${id}`);
                if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
                
                const result = await response.json();
                const data = result.data || result;
                
                // Populate Fields
                setFormData({
                    name: data.name || '',
                    location: data.location || '',
                    city: data.city || '', // Will match with dropdown value
                    country: data.country || 'Philippines',
                    description: data.description || '',
                    price: data.price || '',
                    priceUnit: data.priceUnit || 'per night',
                    maxCapacity: data.maxCapacity || '',
                    featured: data.featured || false
                });

                if (data.amenities) setAmenities(prev => ({ ...prev, ...data.amenities }));
                if (data.mainImage) setMainImagePreview(getImageUrl(data.mainImage));

                // Populate Gallery
                if (data.images && Array.isArray(data.images)) {
                    const formattedGallery = data.images.map(img => ({
                        id: img._id || img,
                        url: getImageUrl(typeof img === 'string' ? img : img.url)
                    }));
                    setExistingGallery(formattedGallery);
                }

            } catch (err) {
                console.error("Load Error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) loadData();
    }, [id]);

    // --- HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAmenityChange = (key) => {
        setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setMainImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files);
        const newFilesWithPreview = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9)
        }));
        setNewGalleryFiles(prev => [...prev, ...newFilesWithPreview]);
    };

    const removeExistingImage = (imgId) => {
        setExistingGallery(prev => prev.filter(img => img.id !== imgId));
        setDeletedImages(prev => [...prev, imgId]); 
    };

    const removeNewImage = (tempId) => {
        setNewGalleryFiles(prev => prev.filter(img => img.id !== tempId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
            Object.keys(amenities).forEach(key => formDataToSend.append(`amenities[${key}]`, amenities[key]));
            
            if (mainImageFile) formDataToSend.append("mainImage", mainImageFile);
            newGalleryFiles.forEach(item => formDataToSend.append("galleryImages", item.file));
            
            formDataToSend.append("deletedImages", JSON.stringify(deletedImages));
            const remainingImages = existingGallery.map(img => img.url); 
            formDataToSend.append("existingImages", JSON.stringify(remainingImages));

            const response = await fetch(`${API_BASE_URL}/api/hotels/update/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update hotel');
            }

            alert('✅ Hotel updated successfully!');
            navigate('/view-hotels'); 
        } catch (err) {
            console.error(err);
            alert(`❌ Failed to update hotel: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <div className="eho-page"><div className="eho-loading"><div className="eho-spinner"></div><p>Loading...</p></div></div>;
    if (error) return <div className="eho-page"><div className="eho-container error-container"><h2>Error</h2><p>{error}</p><button className="eho-btn eho-btn--cancel" onClick={() => navigate('/view-hotels')}>Back</button></div></div>;

    return (
        <div className="eho-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`eho-main ${isSidebarCollapsed ? "eho-main--collapsed" : ""}`}>
                <div className="eho-container">
                    <header className="eho-header">
                        <div className="eho-header-content">
                            <button className="eho-back-btn" onClick={() => navigate('/view-hotels')}><ArrowLeft size={18} /> Back to Hotels</button>
                            <h1 className="eho-title">EDIT HOTEL</h1>
                            <p className="eho-subtitle">Update property details, pricing, and gallery</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="eho-form">
                        
                        {/* 1. Main Cover Image */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Main Cover Image</h2>
                            <div className="eho-upload-area">
                                <input type="file" id="mainImageUpload" className="eho-file-input" accept="image/*" onChange={handleMainImageChange} />
                                <label htmlFor="mainImageUpload" className="eho-upload-label">
                                    {mainImagePreview ? (
                                        <div className="eho-image-preview">
                                            <img src={mainImagePreview} alt="Preview" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/800x400?text=Image+Not+Found"; }} />
                                            <div className="eho-image-overlay"><Upload size={32} /><span>Change Main Cover</span></div>
                                        </div>
                                    ) : (
                                        <div className="eho-upload-placeholder"><ImageIcon size={48} /><span>Click to upload cover photo</span></div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* 2. Gallery Images */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Gallery Images</h2>
                            <div className="eho-gallery-grid">
                                <label className="eho-add-box">
                                    <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} hidden />
                                    <Plus size={24} /><span>Add Photos</span>
                                </label>
                                {existingGallery.map((img, idx) => (
                                    <div key={img.id || idx} className="eho-gallery-item">
                                        <img src={img.url} alt="Gallery" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Error"; }} />
                                        <button type="button" className="eho-remove-btn" onClick={() => removeExistingImage(img.id)}><X size={14} /></button>
                                        <span className="eho-badge-existing">Saved</span>
                                    </div>
                                ))}
                                {newGalleryFiles.map((item) => (
                                    <div key={item.id} className="eho-gallery-item eho-new-upload">
                                        <img src={item.preview} alt="New Upload" />
                                        <button type="button" className="eho-remove-btn" onClick={() => removeNewImage(item.id)}><X size={14} /></button>
                                        <span className="eho-badge-new">New</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Property Details (WITH DESTINATION DROPDOWN) */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Property Details</h2>
                            <div className="eho-form-grid">
                                <div className="eho-form-group">
                                    <label className="eho-label">Hotel Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="eho-input" />
                                </div>
                                
                                {/* 👇 DESTINATION DROPDOWN (Matches AddHotel) */}
                                <div className="eho-form-group">
                                    <label className="eho-label">Destination / City *</label>
                                    <select 
                                        name="city" 
                                        value={formData.city} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="eho-select"
                                    >
                                        <option value="">Select Destination</option>
                                        {destinations.map((dest, index) => (
                                            <option key={index} value={dest}>{dest}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="eho-form-group eho-form-group--full">
                                    <label className="eho-label">Full Location / Address *</label>
                                    <div style={{position: 'relative'}}>
                                        <input type="text" name="location" value={formData.location} onChange={handleInputChange} required className="eho-input" style={{paddingLeft: '40px'}} />
                                        <MapPin size={18} style={{position: 'absolute', left: '12px', top: '14px', color: '#94a3b8'}}/>
                                    </div>
                                </div>
                                <div className="eho-form-group eho-form-group--full">
                                    <label className="eho-label">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="eho-textarea" rows="5"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* 4. Pricing */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Pricing & Capacity</h2>
                            <div className="eho-form-grid-3">
                                <div className="eho-form-group">
                                    <label className="eho-label">Base Price (PHP) *</label>
                                    <div style={{position: 'relative'}}>
                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="eho-input" min="0" style={{paddingLeft: '36px'}} />
                                        <DollarSign size={16} style={{position: 'absolute', left: '12px', top: '15px', color: '#94a3b8'}}/>
                                    </div>
                                </div>
                                <div className="eho-form-group">
                                    <label className="eho-label">Price Unit</label>
                                    <select name="priceUnit" value={formData.priceUnit} onChange={handleInputChange} className="eho-select">
                                        <option value="per night">Per Night</option>
                                        <option value="per day">Per Day</option>
                                    </select>
                                </div>
                                <div className="eho-form-group">
                                    <label className="eho-label">Max Capacity</label>
                                    <div style={{position: 'relative'}}>
                                        <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} className="eho-input" min="1" style={{paddingLeft: '36px'}} />
                                        <Users size={16} style={{position: 'absolute', left: '12px', top: '15px', color: '#94a3b8'}}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Amenities */}
                        <div className="eho-section">
                            <h2 className="eho-section-title">Amenities</h2>
                            <div className="eho-amenities-grid">
                                {Object.keys(amenities).map((key) => (
                                    <label key={key} className="eho-checkbox-wrapper">
                                        <input type="checkbox" checked={amenities[key]} onChange={() => handleAmenityChange(key)} className="eho-checkbox" />
                                        <span className="eho-checkbox-label" style={{textTransform: 'capitalize'}}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="eho-form-actions">
                            <button type="button" className="eho-btn eho-btn--cancel" onClick={() => navigate('/view-hotels')} disabled={submitting}>Cancel</button>
                            <button type="submit" className="eho-btn eho-btn--submit" disabled={submitting}>{submitting ? 'Updating...' : <><Save size={18} /> Save Changes</>}</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditHotel;