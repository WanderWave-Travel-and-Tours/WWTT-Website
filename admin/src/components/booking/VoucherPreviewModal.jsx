import React, { useState, useRef } from 'react';
import { X, Edit2, Download, Printer, Save, Calendar, User, Mail, Phone, MapPin } from 'lucide-react';
import './VoucherPreviewModal.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const VoucherPreviewModal = ({ voucherData, onClose, onEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(voucherData);
    const [isGenerating, setIsGenerating] = useState(false);
    const voucherRef = useRef(null);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        onEdit(editedData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedData(voucherData);
        setIsEditing(false);
    };

    const handleInputChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleGuestChange = (index, field, value) => {
        const updatedGuests = [...editedData.guestList];
        updatedGuests[index] = {
            ...updatedGuests[index],
            [field]: value
        };
        setEditedData(prev => ({
            ...prev,
            guestList: updatedGuests
        }));
    };

    const handleDownloadPDF = async () => {
        if (!voucherRef.current) return;
        
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(voucherRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`WanderWave_Voucher_${editedData.clientName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('May error sa pag-generate ng PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="voucher-modal-overlay" onClick={onClose}>
            <div className="voucher-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Action Bar */}
                <div className="voucher-action-bar">
                    <div className="voucher-action-left">
                        <h2 className="voucher-action-title">
                            {isEditing ? 'Edit Voucher' : 'Travel Voucher Preview'}
                        </h2>
                    </div>
                    <div className="voucher-action-buttons">
                        {!isEditing ? (
                            <>
                                <button className="voucher-btn voucher-btn-edit" onClick={handleEdit}>
                                    <Edit2 size={18} /> Edit
                                </button>
                                <button 
                                    className="voucher-btn voucher-btn-download" 
                                    onClick={handleDownloadPDF}
                                    disabled={isGenerating}
                                >
                                    <Download size={18} /> 
                                    {isGenerating ? 'Generating...' : 'Download PDF'}
                                </button>
                                <button className="voucher-btn voucher-btn-print" onClick={handlePrint}>
                                    <Printer size={18} /> Print
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="voucher-btn voucher-btn-save" onClick={handleSave}>
                                    <Save size={18} /> Save Changes
                                </button>
                                <button className="voucher-btn voucher-btn-cancel" onClick={handleCancel}>
                                    Cancel
                                </button>
                            </>
                        )}
                        <button className="voucher-btn voucher-btn-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Voucher Content */}
                <div className="voucher-content-wrapper">
                    <div className="voucher-document" ref={voucherRef}>
                        {/* Header with Navy Blue Wave Design */}
                        <div className="voucher-header-design">
                            <div className="voucher-wave-top"></div>
                            <div className="voucher-logo-container">
                                <div className="voucher-logo">
                                    <span className="logo-icon">✈️</span>
                                </div>
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="voucher-title-section">
                            <h1 className="voucher-main-title">Travel Voucher</h1>
                        </div>

                        {/* Client Information */}
                        <div className="voucher-section">
                            <div className="voucher-info-grid">
                                <div className="voucher-info-left">
                                    <p className="voucher-label">TO:</p>
                                    {isEditing ? (
                                        <>
                                            <input 
                                                type="text"
                                                className="voucher-edit-input"
                                                value={editedData.clientName}
                                                onChange={(e) => handleInputChange('clientName', e.target.value)}
                                                placeholder="Client Name"
                                            />
                                            <input 
                                                type="email"
                                                className="voucher-edit-input"
                                                value={editedData.clientEmail}
                                                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                                placeholder="Email"
                                            />
                                            <input 
                                                type="text"
                                                className="voucher-edit-input"
                                                value={editedData.clientPhone}
                                                onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                                                placeholder="Phone"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <p className="voucher-client-name">{editedData.clientName}</p>
                                            <p className="voucher-client-info">{editedData.clientEmail}</p>
                                            <p className="voucher-client-info">{editedData.clientPhone}</p>
                                        </>
                                    )}
                                </div>
                                <div className="voucher-info-right">
                                    <div className="voucher-brand">WANDERWAVE</div>
                                    <p className="voucher-date-label">Travel Date Voucher:</p>
                                    {isEditing ? (
                                        <input 
                                            type="text"
                                            className="voucher-edit-input"
                                            value={editedData.travelDate}
                                            onChange={(e) => handleInputChange('travelDate', e.target.value)}
                                            placeholder="Travel Date"
                                        />
                                    ) : (
                                        <p className="voucher-date-value">{editedData.travelDate}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Package Details Table */}
                        <div className="voucher-section">
                            <table className="voucher-table">
                                <thead>
                                    <tr>
                                        <th>NAME OF THE PACKAGE</th>
                                        <th>PACKAGE RATE</th>
                                        <th>NO. OF GUESTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            {isEditing ? (
                                                <input 
                                                    type="text"
                                                    className="voucher-edit-input"
                                                    value={editedData.packageName}
                                                    onChange={(e) => handleInputChange('packageName', e.target.value)}
                                                />
                                            ) : (
                                                editedData.packageName
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input 
                                                    type="number"
                                                    className="voucher-edit-input"
                                                    value={editedData.packageRate}
                                                    onChange={(e) => handleInputChange('packageRate', parseFloat(e.target.value))}
                                                />
                                            ) : (
                                                `${editedData.packageRate.toLocaleString()} / pax`
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input 
                                                    type="number"
                                                    className="voucher-edit-input"
                                                    value={editedData.numberOfGuests}
                                                    onChange={(e) => handleInputChange('numberOfGuests', parseInt(e.target.value))}
                                                />
                                            ) : (
                                                `${editedData.numberOfGuests} adult`
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="voucher-table">
                                <thead>
                                    <tr>
                                        <th>NAME OF GUESTS</th>
                                        <th>AGE</th>
                                        <th>NATIONALITY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editedData.guestList.map((guest, index) => (
                                        <tr key={index}>
                                            <td>
                                                {isEditing ? (
                                                    <input 
                                                        type="text"
                                                        className="voucher-edit-input"
                                                        value={guest.name}
                                                        onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                                                    />
                                                ) : (
                                                    guest.name
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <input 
                                                        type="number"
                                                        className="voucher-edit-input"
                                                        value={guest.age}
                                                        onChange={(e) => handleGuestChange(index, 'age', parseInt(e.target.value))}
                                                    />
                                                ) : (
                                                    guest.age
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <input 
                                                        type="text"
                                                        className="voucher-edit-input"
                                                        value={guest.nationality}
                                                        onChange={(e) => handleGuestChange(index, 'nationality', e.target.value)}
                                                    />
                                                ) : (
                                                    guest.nationality
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Payment Summary */}
                            <table className="voucher-table voucher-payment-table">
                                <thead>
                                    <tr>
                                        <th>TOTAL</th>
                                        <th>TOTAL DOWN PAYMENT</th>
                                        <th>AMOUNT DUE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>₱ {editedData.totalAmount.toLocaleString()}</td>
                                        <td>₱ {editedData.downPayment.toLocaleString()}</td>
                                        <td>₱ {editedData.amountDue.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Installment Schedule */}
                        {editedData.amountDue > 0 && (
                            <div className="voucher-section">
                                <h3 className="voucher-section-title">Installment Due:</h3>
                                <table className="voucher-table">
                                    <thead>
                                        <tr>
                                            <th>BALANCE</th>
                                            <th>DUE DATE</th>
                                            <th>DUE AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>₱ {editedData.amountDue.toLocaleString()}</td>
                                            <td>{editedData.travelDate}</td>
                                            <td>₱ {editedData.amountDue.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Inclusions & Exclusions */}
                        <div className="voucher-section">
                            <div className="voucher-scope-header">
                                <h2 className="voucher-scope-title">Scope & Boundaries</h2>
                                <div className="voucher-brand-small">WANDERWAVE</div>
                            </div>

                            <div className="voucher-inclusions-box">
                                <h3 className="voucher-box-title">INCLUSIONS</h3>
                                <ul className="voucher-list">
                                    {editedData.inclusions.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="voucher-exclusions-box">
                                <h3 className="voucher-box-title">EXCLUSIONS</h3>
                                <ul className="voucher-list voucher-list-red">
                                    {editedData.exclusions.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <p className="voucher-note">
                                Please be aware that the destinations listed for Island Hopping are not guaranteed, 
                                and some may be excluded based on the actual weather and ocean currents. 
                                Safety remains our foremost concern.
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="voucher-section">
                            <div className="voucher-scope-header">
                                <h2 className="voucher-scope-title">Scope & Boundaries</h2>
                                <div className="voucher-brand-small">WANDERWAVE</div>
                            </div>

                            <div className="voucher-amenities-box">
                                <h3 className="voucher-box-title">AMENITIES AND FACILITIES</h3>
                                <div className="voucher-amenities-content">
                                    <div>
                                        <p className="voucher-amenities-label">AMENITIES:</p>
                                        <ul className="voucher-list">
                                            {editedData.amenities.amenities.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="voucher-amenities-label">FACILITIES:</p>
                                        <ul className="voucher-list">
                                            {editedData.amenities.facilities.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Itinerary */}
                        <div className="voucher-section">
                            <div className="voucher-scope-header">
                                <h2 className="voucher-scope-title">Itinerary</h2>
                                <div className="voucher-brand-small">WANDERWAVE</div>
                            </div>

                            <div className="voucher-itinerary-note">
                                <ul style={{paddingLeft: '20px', margin: 0}}>
                                    <li>This itinerary is just an estimate. It might change without prior notice.</li>
                                    <li>For Joiner/Sharing Tours, please anticipate possible delays and adjustments to waiting times.</li>
                                </ul>
                            </div>

                            <table className="voucher-table voucher-itinerary-table">
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>TIME</th>
                                        <th>ACTIVITY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editedData.itinerary.map((day, index) => (
                                        <tr key={index}>
                                            <td>{day.date}</td>
                                            <td></td>
                                            <td>DAY {day.day}: {day.activity}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="3" style={{textAlign: 'center', fontStyle: 'italic'}}>
                                            - end of service -
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="voucher-itinerary-notes">
                                <p>🔄 City Tour may be moved to Day 1 or 3 depending on guests' flight details.</p>
                                <p>🌅 AM City Tour is NOT always available.</p>
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="voucher-section">
                            <div className="voucher-scope-header">
                                <h2 className="voucher-scope-title">Terms and Conditions</h2>
                                <div className="voucher-brand-small">WANDERWAVE</div>
                            </div>

                            <div className="voucher-terms-box">
                                <h3 className="voucher-box-title">CANCELLATION & REFUNDS POLICY</h3>
                                <p>
                                    Please note that <strong>NO</strong> cancellations or modifications are allowed once your booking is confirmed.
                                    <strong> NO</strong> refunds will be provided if the tour has commenced or in cases of no-show or on-the-spot cancellations.
                                </p>
                            </div>

                            <div className="voucher-terms-box">
                                <h3 className="voucher-box-title">IMPORTANT REMINDERS</h3>
                                <ol className="voucher-terms-list">
                                    <li>This voucher is valid only for the specified hotel and information stated above.</li>
                                    <li>Valid photo ID required during check-in (Passport, Driver's License, etc.)</li>
                                    <li>Peak period charges must be settled directly with the hotel.</li>
                                    <li>This voucher is non-transferable, non-endorsable, and non-refundable.</li>
                                    <li>Personal expenses not mentioned in inclusions will be charged separately.</li>
                                    <li>Full charges apply for cancellations, amendments, and no-shows.</li>
                                    <li>WanderWave Travel & Tours is not liable for circumstances beyond control (force majeure).</li>
                                </ol>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="voucher-footer">
                            <div className="voucher-footer-wave"></div>
                            <div className="voucher-footer-content">
                                <div className="voucher-contact-item">
                                    <Phone size={16} />
                                    <span>09668200029 / (044) 325-2836</span>
                                </div>
                                <div className="voucher-contact-item">
                                    <Mail size={16} />
                                    <span>info@wanderwavetravelandtours.com</span>
                                </div>
                                <div className="voucher-contact-item">
                                    <MapPin size={16} />
                                    <span>Guimba, Nueva Ecija</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherPreviewModal;