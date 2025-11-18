import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddPackage.css';

const AddPackage = () => {
    const [title, setTitle] = useState('');
    const [destination, setDestination] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [category, setCategory] = useState('Local');
    const [file, setFile] = useState(null);
    
    const navigate = useNavigate();

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
        }

        try {
            const response = await fetch('http://localhost:5000/api/packages/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.status === 'ok') {
                alert('✅ Package Added Successfully!');
                setTitle('');
                setDestination('');
                setPrice('');
                setDuration('');
                setCategory('Local');
                setFile(null);
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong.');
        }
    };

    return (
        <div className="addpackage-container">
            <h2 className="form-title">📦 Add New Tour Package</h2>
            
            <form onSubmit={handleSubmit} className="add-form">
                
                <div className="form-group">
                    <label className="form-label">Package Title:</label>
                    <input type="text" placeholder="e.g. Boracay Super Sale" 
                        value={title} onChange={e => setTitle(e.target.value)} required className="input-field" />
                </div>

                <div className="form-group">
                    <label className="form-label">Destination (City/Province):</label>
                    <input type="text" placeholder="e.g. Aklan, Philippines" 
                        value={destination} onChange={e => setDestination(e.target.value)} required className="input-field" />
                </div>

                <div className="price-category-group">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Price (₱):</label>
                        <input type="number" placeholder="e.g. 8999" 
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
                    <label className="form-label">Duration (Days & Nights):</label>
                    <input type="text" placeholder="e.g. 3D2N" 
                        value={duration} onChange={e => setDuration(e.target.value)} required className="input-field" />
                </div>

                {/* FILE INPUT */}
                <div className="form-group">
                    <label className="form-label">Upload Image:</label>
                    <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" required className="file-input-group" />
                </div>

                <button type="submit" className="submit-button">Upload Package 🚀</button>
            </form>
        </div>
    );
};

export default AddPackage;