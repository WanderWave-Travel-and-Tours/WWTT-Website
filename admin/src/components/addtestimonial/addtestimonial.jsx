import React, { useState } from 'react';
import './addtestimonial.css';
import Sidebar from '../sidebar/sidebar';

const AddTestimonial = () => {
    const [testimonialDetails, setTestimonialDetails] = useState({
        name: '',
        feedback: '',
        source: '',
    });

    const [pictureFile, setPictureFile] = useState(null); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTestimonialDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setPictureFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => { 
        e.preventDefault();
        const formData = new FormData();

        formData.append('customerName', testimonialDetails.name); 
        formData.append('source', testimonialDetails.source);
        formData.append('feedback', testimonialDetails.feedback);

        if (pictureFile) {
            formData.append('customerImage', pictureFile); 
        }

        try {
            const response = await fetch('http://localhost:5000/api/testimonials', {
                    method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Testimonial from ${testimonialDetails.name} added successfully!`);
                
                setTestimonialDetails({
                    name: '',
                    feedback: '',
                    source: '',
                });
                setPictureFile(null);
                e.target.reset();
            } else {
                console.error("Failed to submit");
                alert("Error submitting testimonial.");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong with the server.");
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />

            <div className="testimonial-form-content">
                <h1>✍️ Add New Customer Testimonial</h1>
                <p>Enter the details of the testimonial to display it on the website.</p>
                
                <form onSubmit={handleSubmit} className="add-testimonial-form">
                    
                    <div className="form-group">
                        <label htmlFor="name">Customer Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={testimonialDetails.name}
                            onChange={handleChange}
                            placeholder="e.g., Maria T. Reyes"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="source">Source of Feedback:</label>
                        <select
                            id="source"
                            name="source"
                            value={testimonialDetails.source}
                            onChange={handleChange}
                            required
                        >
                            <option value="" disabled>Select Source</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Google Review">Google Review</option>
                            <option value="Website Form">Website Form</option>
                            <option value="Email">Email</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="pictureFile">Customer Picture (Upload):</label>
                        <input
                            type="file"
                            id="pictureFile"
                            name="pictureFile"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <small>Upload the customer's profile picture or avatar here.</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="feedback">Feedback / Testimonial:</label>
                        <textarea
                            id="feedback"
                            name="feedback"
                            value={testimonialDetails.feedback}
                            onChange={handleChange}
                            placeholder="Enter the full quote or review here..."
                            rows="6"
                            required
                        ></textarea>
                    </div>
                    
                    <button type="submit" className="submit-btn">Submit Testimonial</button>
                </form>
            </div>
        </div>
    );
};

export default AddTestimonial;