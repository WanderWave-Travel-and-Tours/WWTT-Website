import React from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewhotel.css';
import { Edit, Trash2, MapPin, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ViewHotels = () => {
  const navigate = useNavigate();

  const hotels = [
    { id: 1, name: 'Wanderwave Resort', location: 'El Nido, Palawan', price: 4500, rating: 4.8, rooms: 12 },
    { id: 2, name: 'City Central Inn', location: 'Cebu City', price: 2500, rating: 4.2, rooms: 25 },
    { id: 3, name: 'Siargao Surf Stay', location: 'General Luna, Siargao', price: 1800, rating: 4.5, rooms: 8 },
  ];

  return (
    <div className="hotel-page">
      <Sidebar />
      <main className="hotel-main">
        <div className="hotel-container">
          <header className="hotel-header flex-between">
            <div>
              <h1 className="hotel-title">HOTEL LIST</h1>
              <p className="hotel-subtitle">Manage your accommodation partners</p>
            </div>
            <button className="btn-submit flex-center" onClick={() => navigate('/add-hotel')}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Hotel
            </button>
          </header>

          <div className="hotel-table-container">
            <table className="hotel-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Price / Night</th>
                  <th>Rooms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel) => (
                  <tr key={hotel.id}>
                    <td>
                      <div className="hotel-cell-name">
                        <div className="hotel-thumb">H</div>
                        <span className="font-bold">{hotel.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">
                      <div className="flex-align">
                        <MapPin size={14} style={{ marginRight: '4px' }} />
                        {hotel.location}
                      </div>
                    </td>
                    <td>
                      <div className="flex-align">
                        <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ marginRight: '4px' }} />
                        {hotel.rating}
                      </div>
                    </td>
                    <td className="font-bold text-blue">₱{hotel.price.toLocaleString()}</td>
                    <td>{hotel.rooms}</td>
                    <td><span className="badge badge-active">Active</span></td>
                    <td>
                      <div className="action-group">
                        <button className="action-btn edit" title="Edit"><Edit size={16} /></button>
                        <button className="action-btn delete" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewHotels;