import React, { useState, useRef } from 'react';
import { 
    X, Edit2, Download, Printer, Save, Phone, Mail, MapPin, Globe
} from 'lucide-react';
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
            const pages = voucherRef.current.querySelectorAll('.voucher-page');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = 210;
            const pdfHeight = 297; 

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], {
                    scale: 2, 
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 1200
                });
                
                const imgData = canvas.toDataURL('image/png');
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }
            
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
                            <Globe size={20} color="#1e3a8a" />
                            {isEditing ? 'Editing Voucher Details' : 'Travel Voucher Preview'}
                        </h2>
                    </div>
                    <div className="voucher-action-buttons">
                        {!isEditing ? (
                            <>
                                <button className="voucher-btn voucher-btn-edit" onClick={handleEdit}>
                                    <Edit2 size={16} /> Edit Details
                                </button>
                                <button 
                                    className="voucher-btn voucher-btn-download" 
                                    onClick={handleDownloadPDF}
                                    disabled={isGenerating}
                                >
                                    <Download size={16} /> 
                                    {isGenerating ? 'Generating...' : 'Download PDF'}
                                </button>
                                <button className="voucher-btn voucher-btn-print" onClick={handlePrint}>
                                    <Printer size={16} /> Print
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="voucher-btn voucher-btn-save" onClick={handleSave}>
                                    <Save size={16} /> Save Changes
                                </button>
                                <button className="voucher-btn voucher-btn-cancel" onClick={handleCancel}>
                                    <X size={16} /> Cancel
                                </button>
                            </>
                        )}
                        <button className="voucher-btn voucher-btn-close" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Voucher Content */}
                <div className="voucher-content-wrapper">
                    <div className="voucher-document" ref={voucherRef}>
                        
                        {/* ==================== PAGE 1: DETAILS ==================== */}
                        <div className="voucher-page">
                            {/* Header Image */}
                            <div className="voucher-header-compact">
                                <img 
                                    src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/693901f6169a42de3b07d6c6.jpeg" 
                                    alt="Destinations" 
                                    className="voucher-header-img"
                                    crossOrigin="anonymous"
                                />
                                <div className="voucher-header-overlay"></div>
                            </div>

                            <div className="voucher-body-content">
                                {/* Header Details */}
                                <div className="simple-header-container">
                                    <div className="header-left">
                                        <span className="header-label">Issued To:</span>
                                        {isEditing ? (
                                            <>
                                                <input type="text" className="voucher-edit-input" style={{marginBottom: '5px', fontWeight: 'bold'}} value={editedData.clientName} onChange={(e) => handleInputChange('clientName', e.target.value)} placeholder="Client Name" />
                                                <input type="email" className="voucher-edit-input" style={{marginBottom: '5px'}} value={editedData.clientEmail} onChange={(e) => handleInputChange('clientEmail', e.target.value)} placeholder="Email" />
                                                <input type="text" className="voucher-edit-input" value={editedData.clientPhone} onChange={(e) => handleInputChange('clientPhone', e.target.value)} placeholder="Phone" />
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="header-client-name">{editedData.clientName}</h2>
                                                <p className="header-text">{editedData.clientEmail}</p>
                                                <p className="header-text">{editedData.clientPhone || 'N/A'}</p>
                                                <p className="header-invoice">Invoice No.: {editedData.referenceNumber || 'Pending'}</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="header-right">
                                        <h1 className="header-brand">TRAVEL</h1>
                                        <div className="header-sub-brand">VOUCHER</div>
                                        
                                        <div className="header-date-box">
                                            <span className="header-date-label">Travel Date</span>
                                            {isEditing ? (
                                                <input type="text" className="voucher-edit-input" style={{textAlign: 'right'}} value={editedData.travelDate} onChange={(e) => handleInputChange('travelDate', e.target.value)} />
                                            ) : (
                                                <h2 className="header-date-value">{editedData.travelDate}</h2>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Package Details */}
                                <div className="voucher-section">
                                    <div className="table-responsive">
                                        <table className="voucher-table">
                                            <thead>
                                                <tr>
                                                    <th style={{width: '40%'}}>NAME OF THE PACKAGE</th>
                                                    <th>PACKAGE RATE</th>
                                                    <th>NO. OF GUESTS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>{isEditing ? <input type="text" className="voucher-edit-input" value={editedData.packageName} onChange={(e) => handleInputChange('packageName', e.target.value)} /> : <strong>{editedData.packageName}</strong>}</td>
                                                    <td>{isEditing ? <input type="number" className="voucher-edit-input" value={editedData.packageRate} onChange={(e) => handleInputChange('packageRate', parseFloat(e.target.value))} /> : `₱ ${editedData.packageRate.toLocaleString()} / pax`}</td>
                                                    <td>{isEditing ? <input type="number" className="voucher-edit-input" value={editedData.numberOfGuests} onChange={(e) => handleInputChange('numberOfGuests', parseInt(e.target.value))} /> : `${editedData.numberOfGuests} adult(s)`}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="voucher-table">
                                            <thead>
                                                <tr>
                                                    <th style={{width: '60%'}}>NAME OF GUESTS</th>
                                                    <th>AGE</th>
                                                    <th>NATIONALITY</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {editedData.guestList.map((guest, index) => (
                                                    <tr key={index}>
                                                        <td>{isEditing ? <input type="text" className="voucher-edit-input" value={guest.name} onChange={(e) => handleGuestChange(index, 'name', e.target.value)} /> : guest.name}</td>
                                                        <td>{isEditing ? <input type="number" className="voucher-edit-input" value={guest.age} onChange={(e) => handleGuestChange(index, 'age', parseInt(e.target.value))} /> : guest.age}</td>
                                                        <td>{isEditing ? <input type="text" className="voucher-edit-input" value={guest.nationality} onChange={(e) => handleGuestChange(index, 'nationality', e.target.value)} /> : guest.nationality}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="voucher-table voucher-table-payment">
                                            <thead>
                                                <tr>
                                                    <th>TOTAL AMOUNT</th>
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
                                </div>

                                {editedData.amountDue > 0 && (
                                    <div className="voucher-section">
                                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                                            <div style={{height: '2px', flex: 1, background: '#e2e8f0'}}></div>
                                            <h3 style={{color: '#1e3a8a', fontFamily: 'Brush Script MT, cursive', fontSize: '26px', margin: 0}}>Payment Schedule</h3>
                                            <div style={{height: '2px', flex: 1, background: '#e2e8f0'}}></div>
                                        </div>
                                        
                                        <div className="table-responsive">
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
                                                        <td style={{fontWeight: 'bold', color: '#dc2626'}}>₱ {editedData.amountDue.toLocaleString()}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="voucher-page-footer">
                                <div className="voucher-footer-bar">
                                    <div className="voucher-footer-contacts">
                                        <span><Phone size={14} /> +63 966 820 0292</span>
                                        <span><Mail size={14} /> info@wanderwavetravelandtours.com</span>
                                        <span><MapPin size={14} /> Nueva Ecija, Philippines</span>
                                    </div>
                                </div>
                                <div className="voucher-footer-bottom">
                                    <span>© 2026 Wanderwave Travel and Tours</span>
                                    <span className="voucher-page-number">Page 1</span>
                                </div>
                            </div>
                        </div>

                        {/* ==================== PAGE 2: SCOPE & AMENITIES ==================== */}
                        <div className="voucher-page">
                            <div className="voucher-body-content">
                                <div className="voucher-section">
                                    <div className="voucher-section-header">
                                        <h2 className="voucher-section-title">Scope & Boundaries</h2>
                                        <div className="voucher-section-brand">WANDERWAVE</div>
                                    </div>

                                    <div className="voucher-box">
                                        <h3 className="voucher-box-title">INCLUSIONS</h3>
                                        <ul className="voucher-list">
                                            {editedData.inclusions.map((item, index) => (
                                                <li key={index}><span className="icon-check">✓</span> {item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="voucher-box">
                                        <h3 className="voucher-box-title">EXCLUSIONS</h3>
                                        <ul className="voucher-list">
                                            {editedData.exclusions.map((item, index) => (
                                                <li key={index}><span className="icon-cross">✗</span> {item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="voucher-note">
                                        <p><strong>⚠️ Important Note:</strong> Please be aware that the destinations listed for Island Hopping are not guaranteed, and some may be excluded based on the actual weather and ocean currents. Safety remains our foremost concern.</p>
                                    </div>

                                    {/* Amenities Section */}
                                    <div className="voucher-section-header" style={{marginTop: '30px'}}>
                                        <h2 className="voucher-section-title">Amenities & Facilities</h2>
                                    </div>

                                    <div className="voucher-box">
                                        <div className="voucher-two-col">
                                            <div>
                                                <p className="voucher-col-title">AMENITIES:</p>
                                                <ul className="voucher-list" style={{padding: 0}}>
                                                    {editedData.amenities.amenities.map((item, index) => (
                                                        <li key={index}><span className="icon-check">✓</span> {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="voucher-col-title">FACILITIES:</p>
                                                <ul className="voucher-list" style={{padding: 0}}>
                                                    {editedData.amenities.facilities.map((item, index) => (
                                                        <li key={index}><span className="icon-check">✓</span> {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="voucher-page-footer">
                                <div className="voucher-footer-bar">
                                    <div className="voucher-footer-contacts">
                                        <span><Phone size={14} /> +63 966 820 0292</span>
                                        <span><Mail size={14} /> info@wanderwavetravelandtours.com</span>
                                        <span><MapPin size={14} /> Nueva Ecija, Philippines</span>
                                    </div>
                                </div>
                                <div className="voucher-footer-bottom">
                                    <span>© 2026 Wanderwave Travel and Tours</span>
                                    <span className="voucher-page-number">Page 2</span>
                                </div>
                            </div>
                        </div>

                        {/* ==================== PAGE 3: ITINERARY ==================== */}
                        <div className="voucher-page">
                            <div className="voucher-body-content">
                                <div className="voucher-section">
                                    <div className="voucher-section-header">
                                        <h2 className="voucher-section-title">Itinerary</h2>
                                        <div className="voucher-section-brand">WANDERWAVE</div>
                                    </div>

                                    <div className="voucher-alert">
                                        <ul style={{margin: 0, paddingLeft: '20px'}}>
                                            <li>This itinerary is just an estimate. It might change without prior notice.</li>
                                            <li>For Joiner/Sharing Tours, please anticipate possible delays and adjustments to waiting times.</li>
                                        </ul>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="voucher-table">
                                            <thead>
                                                <tr>
                                                    <th style={{width: '20%'}}>DATE</th>
                                                    <th style={{width: '15%'}}>TIME</th>
                                                    <th>ACTIVITY</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {editedData.itinerary.map((day, index) => (
                                                    <tr key={index}>
                                                        <td style={{fontWeight: 'bold'}}>{day.date}</td>
                                                        <td>—</td>
                                                        <td>
                                                            <div style={{fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px'}}>DAY {day.day}</div>
                                                            {day.activity}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr><td colSpan="3" style={{textAlign: 'center', fontStyle: 'italic', color: '#94a3b8', padding: '20px'}}>— End of Service —</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="voucher-info-note">
                                        <p style={{margin: '0 0 5px 0'}}>🔄 City Tour may be moved to Day 1 or 3 depending on guests' flight details.</p>
                                        <p style={{margin: 0}}>🌅 AM City Tour is NOT always available.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="voucher-page-footer">
                                <div className="voucher-footer-bar">
                                    <div className="voucher-footer-contacts">
                                        <span><Phone size={14} /> +63 966 820 0292</span>
                                        <span><Mail size={14} /> info@wanderwavetravelandtours.com</span>
                                        <span><MapPin size={14} /> Nueva Ecija, Philippines</span>
                                    </div>
                                </div>
                                <div className="voucher-footer-bottom">
                                    <span>© 2026 Wanderwave Travel and Tours</span>
                                    <span className="voucher-page-number">Page 3</span>
                                </div>
                            </div>
                        </div>

                        {/* ==================== PAGE 4: TERMS ==================== */}
                        <div className="voucher-page">
                            <div className="voucher-body-content">
                                <div className="voucher-section">
                                    <div className="voucher-section-header">
                                        <h2 className="voucher-section-title">Terms and Conditions</h2>
                                        <div className="voucher-section-brand">WANDERWAVE</div>
                                    </div>

                                    <div className="voucher-box">
                                        <h3 className="voucher-box-title">CANCELLATION & REFUNDS POLICY</h3>
                                        <p style={{padding: '20px', margin: 0, lineHeight: 1.6, color: '#475569'}}>
                                            Please note that <strong style={{color: '#ef4444'}}>NO</strong> cancellations or modifications are allowed once your booking is confirmed.
                                            <strong style={{color: '#ef4444'}}> NO</strong> refunds will be provided if the tour has commenced or in cases of no-show or on-the-spot cancellations.
                                        </p>
                                    </div>

                                    <div className="voucher-box">
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
                            </div>

                            <div className="voucher-page-footer">
                                <div className="voucher-footer-bar">
                                    <div className="voucher-footer-contacts">
                                        <span><Phone size={14} /> +63 966 820 0292</span>
                                        <span><Mail size={14} /> info@wanderwavetravelandtours.com</span>
                                        <span><MapPin size={14} /> Nueva Ecija, Philippines</span>
                                    </div>
                                </div>
                                <div className="voucher-footer-bottom">
                                    <span>© 2026 Wanderwave Travel and Tours</span>
                                    <span className="voucher-page-number">Page 4</span>
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