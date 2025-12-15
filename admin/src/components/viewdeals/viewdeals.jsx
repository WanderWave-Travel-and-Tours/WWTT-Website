import React, { useState } from 'react';
import { Search, Edit, Trash2, Plus } from 'lucide-react';
import Sidebar from "../sidebar/sidebar";
import { useNavigate } from 'react-router-dom';
import './viewdeals.css';

const ViewDeals = () => {
    const navigate = useNavigate();

    const [deals, setDeals] = useState([
        {
            id: 1,
            title: 'SIARGAO',
            duration: '3 Days 2 Nights',
            price: 3699,
            image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600&auto=format&fit=crop',
            status: 'Active'
        },
        {
            id: 2,
            title: 'EL NIDO',
            duration: '4 Days 3 Nights',
            price: 4999,
            image: 'https://images.unsplash.com/photo-1552083375-1447ce886485?q=80&w=600&auto=format&fit=crop',
            status: 'Active'
        },
        {
            id: 3,
            title: 'BORACAY',
            duration: '3 Days 2 Nights',
            price: 3899,
            image: 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?q=80&w=600&auto=format&fit=crop',
            status: 'Active'
        },
        {
            id: 4,
            title: 'BOHOL',
            duration: '3 Days 2 Nights',
            price: 3499,
            image: 'https://images.unsplash.com/photo-1534951474654-88456f7be74e?q=80&w=600&auto=format&fit=crop',
            status: 'Active'
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredDeals = deals.filter(deal => 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id) => {
        if(window.confirm("Are you sure you want to delete this deal?")) {
            setDeals(deals.filter(d => d.id !== id));
        }
    };

    return (
        <div className="vd-page">
            <Sidebar />
            <main className="vd-main">
                <div className="vd-container">
                    <header className="vd-header">
                        <div>
                            <h1 className="vd-title">DEALS & PACKAGES</h1>
                            <p className="vd-subtitle">Manage your travel promo cards</p>
                        </div>
                        <div className="vd-actions-top">
                            <div className="vd-search-wrapper">
                                <Search className="search-icon" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search destination..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="vd-add-btn" onClick={() => navigate('/add-deal')}>
                                <Plus size={18} /> New Deal
                            </button>
                        </div>
                    </header>

                    {filteredDeals.length > 0 ? (
                        <div className="vd-grid">
                            {filteredDeals.map((deal) => (
                                <div key={deal.id} className="travel-card" style={{ backgroundImage: `url(${deal.image})` }}>
                                    
                                    <div className="card-admin-controls">
                                        <button className="ctrl-btn edit" title="Edit">
                                            <Edit size={14} />
                                        </button>
                                        <button className="ctrl-btn delete" title="Delete" onClick={() => handleDelete(deal.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="card-overlay">
                                        <div className="card-top">
                                            <h2 className="card-dest-title">{deal.title}</h2>
                                        </div>
                                        
                                        <div className="card-bottom">
                                            <span className="card-duration">{deal.duration}</span>
                                            <div className="card-price">
                                                ₱{deal.price.toLocaleString()}.00/PAX
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="vd-empty">
                            <p>No deals found.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ViewDeals;