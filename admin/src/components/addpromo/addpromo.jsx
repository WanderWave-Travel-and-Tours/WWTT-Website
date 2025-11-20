import React, { useState } from 'react';
import './addpromo.css';
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
        
        setPromoDetails({
            code: '',
            discount: '',
            validUntil: '',
            description: '',
        });
    };

    return (
        <div className="admin-layout"> 
            <Sidebar />

            <div className="promo-content"> 
                <h1> Add New Promo Code</h1>
                <p>Fill out the form below to create a new promotional code for packages.</p>
                
                <form onSubmit={handleSubmit} className="promo-form">
                    
                    <div className="form-group">
                        <label htmlFor="code">Promo Code:</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={promoDetails.code}
                            onChange={handleChange}
                            placeholder="e.g., SUMMER20"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="discount">Discount Percentage (%):</label>
                        <input
                            type="number"
                            id="discount"
                            name="discount"
                            value={promoDetails.discount}
                            onChange={handleChange}
                            placeholder="e.g., 20"
                            min="1"
                            max="100"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="validUntil">Valid Until:</label>
                        <input
                            type="date"
                            id="validUntil"
                            name="validUntil"
                            value={promoDetails.validUntil}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={promoDetails.description}
                            onChange={handleChange}
                            placeholder="Briefly describe the promo's terms and conditions."
                            rows="4"
                            required
                        ></textarea>
                    </div>
                    
                    <button type="submit" className="submit-btn">Create Promo</button>
                </form>
            </div>
        </div>
    );
};

export default AddPromo;