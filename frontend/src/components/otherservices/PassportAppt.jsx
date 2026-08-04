import React, { useState, useEffect } from 'react';
import Sidebar from '../../sidebar/sidebar';
import api from '../../lib/axiosInstance';
import { 
  Plus, BookOpen, Calendar, CheckCircle, RotateCcw, 
  Edit2, Trash2, Save, X, FileText, List, Settings 
} from 'lucide-react';
import './PassportAppt.css';

const PassportAppt = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [passportData, setPassportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState(null);
    
    // Stats (can be updated to fetch from inquiries with inquiryType: 'PASSPORT')
    const stats = [
        { label: 'Appointments', value: '120', icon: <BookOpen size={24}/> },
        { label: 'This Week', value: '8', icon: <Calendar size={24}/> },
        { label: 'Confirmed', value: '110', icon: <CheckCircle size={24}/> },
        { label: 'Rescheduled', value: '2', icon: <RotateCcw size={24}/> },
    ];

    // Sample appointment data (replace with real inquiries later)
    const [appointments, setAppointments] = useState([
        { id: 'PPT-88', client: 'Bea Alonzo', type: 'Renewal', site: 'DFA Aseana', date: 'Dec 10, 2025', time: '10:00 AM', status: 'Confirmed' },
        { id: 'PPT-89', client: 'John Lloyd', type: 'New', site: 'DFA Megamall', date: 'Dec 12, 2025', time: '02:00 PM', status: 'Pending' },
    ]);

    useEffect(() => {
        fetchPassportData();
    }, []);

    const fetchPassportData = async () => {
        try {
            const res = await api.get('/api/passports');
            if (res.data.success && res.data.data.length > 0) {
                setPassportData(res.data.data[0]);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!window.confirm('Initialize default passport data? This will only work if no data exists.')) return;
        
        try {
            const res = await api.post('/api/passports/initialize');
            if (res.data.success) {
                alert('Passport data initialized successfully!');
                fetchPassportData();
            }
        } catch (error) {
            alert('Error initializing passport data');
        }
    };

    const handleEditClick = () => {
        if (!passportData) {
            alert('No passport data to edit. Initialize first.');
            return;
        }
        setEditData({...passportData});
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editData) return;

        try {
            const res = await api.put(
                `/api/passports/${editData._id}`,
                editData
            );
            if (res.data.success) {
                alert('Passport data updated successfully!');
                setPassportData(res.data.data);
                setShowEditModal(false);
            }
        } catch (error) {
            alert('Error updating passport data');
        }
    };

    const handleAddRequirement = () => {
        setEditData(prev => ({
            ...prev,
            requirements: prev.requirements || [],
        }));
        // Add new requirement item to first section
        if (editData.requirements.length > 0) {
            const newReqs = [...editData.requirements];
            newReqs[0].items.push('New requirement item');
            setEditData(prev => ({...prev, requirements: newReqs}));
        }
    };

    const handleAddAdditionalDoc = () => {
        if (editData.additionalDocuments && editData.additionalDocuments.length > 0) {
            const newDocs = [...editData.additionalDocuments];
            newDocs[0].items.push('New additional document');
            setEditData(prev => ({...prev, additionalDocuments: newDocs}));
        }
    };

    const handleAddStep = () => {
        setEditData(prev => ({
            ...prev,
            stepsProcess: [...(prev.stepsProcess || []), 'New process step']
        }));
    };

    const handleRemoveRequirement = (index) => {
        const newReqs = [...editData.requirements];
        newReqs[0].items.splice(index, 1);
        setEditData(prev => ({...prev, requirements: newReqs}));
    };

    const handleRemoveAdditionalDoc = (index) => {
        const newDocs = [...editData.additionalDocuments];
        newDocs[0].items.splice(index, 1);
        setEditData(prev => ({...prev, additionalDocuments: newDocs}));
    };

    const handleRemoveStep = (index) => {
        const newSteps = [...editData.stepsProcess];
        newSteps.splice(index, 1);
        setEditData(prev => ({...prev, stepsProcess: newSteps}));
    };

    const updateRequirementItem = (index, value) => {
        const newReqs = [...editData.requirements];
        newReqs[0].items[index] = value;
        setEditData(prev => ({...prev, requirements: newReqs}));
    };

    const updateAdditionalDocItem = (index, value) => {
        const newDocs = [...editData.additionalDocuments];
        newDocs[0].items[index] = value;
        setEditData(prev => ({...prev, additionalDocuments: newDocs}));
    };

    const updateStepItem = (index, value) => {
        const newSteps = [...editData.stepsProcess];
        newSteps[index] = value;
        setEditData(prev => ({...prev, stepsProcess: newSteps}));
    };

    return (
        <div className="passport-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`passport-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="passport-container">
                    <div className="passport-header">
                        <div className="passport-title">
                            <h1>Passport Appointment</h1>
                            <p>DFA Slot Management & Requirements</p>
                        </div>
                        <div className="passport-header-actions">
                            {!passportData && (
                                <button
                                    className="passport-btn-add passport-btn-initialize"
                                    onClick={handleInitialize}
                                >
                                    <Plus size={18}/> Initialize Data
                                </button>
                            )}
                            {passportData && (
                                <button 
                                    className="passport-btn-add" 
                                    onClick={handleEditClick}
                                >
                                    <Settings size={18}/> Edit Requirements
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="passport-stats-grid">
                        {stats.map((s, i) => (
                            <div className="passport-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="passport-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    {/* Requirements Summary Card */}
                    {passportData && (
                        <div className="passport-card passport-summary-card">
                            <div className="passport-summary-body">
                                <h3 className="passport-summary-title">
                                    📋 Current Requirements Configuration
                                </h3>
                                <div className="passport-summary-grid">
                                    <div>
                                        <span className="passport-summary-label">Primary Requirements</span>
                                        <p className="passport-summary-value">
                                            {passportData.requirements[0]?.items.length || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="passport-summary-label">Additional Documents</span>
                                        <p className="passport-summary-value">
                                            {passportData.additionalDocuments[0]?.items.length || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="passport-summary-label">Process Steps</span>
                                        <p className="passport-summary-value">
                                            {passportData.stepsProcess?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="passport-table-container">
                        <table className="passport-table">
                            <thead>
                                <tr>
                                    <th>Appt ID</th>
                                    <th>Applicant</th>
                                    <th>Type</th>
                                    <th>DFA Site</th>
                                    <th>Date & Time</th>
                                    <th>Status</th>
                                    <th className="passport-th-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((item) => (
                                    <tr key={item.id}>
                                        <td className="passport-td-bold">{item.id}</td>
                                        <td>{item.client}</td>
                                        <td>{item.type}</td>
                                        <td>{item.site}</td>
                                        <td>{item.date} <br/><span className="passport-td-time">{item.time}</span></td>
                                        <td><span className="passport-status-badge">{item.status}</span></td>
                                        <td className="passport-td-right">
                                            <button className="passport-action-btn">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* EDIT MODAL */}
            {showEditModal && editData && (
                <div className="modal-overlay passport-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content passport-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="passport-modal-header">
                            <h2 className="passport-modal-title">
                                Edit Passport Requirements
                            </h2>
                            <button onClick={() => setShowEditModal(false)} className="passport-modal-close-btn">
                                <X size={24} color="#64748b"/>
                            </button>
                        </div>

                        {/* Basic Info */}
                        <div className="passport-field-group">
                            <label className="passport-field-label">
                                SERVICE NAME
                            </label>
                            <input
                                type="text"
                                value={editData.serviceName}
                                onChange={(e) => setEditData(prev => ({...prev, serviceName: e.target.value}))}
                                className="passport-field-input"
                            />
                        </div>

                        <div className="passport-field-group">
                            <label className="passport-field-label">
                                DESCRIPTION
                            </label>
                            <input
                                type="text"
                                value={editData.description}
                                onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                                className="passport-field-input"
                            />
                        </div>

                        <div className="passport-field-group">
                            <label className="passport-field-label">
                                SERVICE FEE (₱)
                            </label>
                            <input
                                type="number"
                                value={editData.price}
                                onChange={(e) => setEditData(prev => ({...prev, price: parseFloat(e.target.value)}))}
                                className="passport-field-input"
                            />
                        </div>

                        {/* PRIMARY REQUIREMENTS */}
                        <div className="passport-field-group">
                            <div className="passport-section-header">
                                <label className="passport-section-label">
                                    PRIMARY REQUIREMENTS
                                </label>
                                <button onClick={handleAddRequirement} className="passport-add-btn">
                                    + Add Item
                                </button>
                            </div>
                            {editData.requirements[0]?.items.map((item, index) => (
                                <div key={index} className="passport-list-item-row">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateRequirementItem(index, e.target.value)}
                                        className="passport-list-item-input"
                                    />
                                    <button onClick={() => handleRemoveRequirement(index)} className="passport-remove-btn">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ADDITIONAL DOCUMENTS */}
                        <div className="passport-field-group">
                            <div className="passport-section-header">
                                <label className="passport-section-label">
                                    ADDITIONAL DOCUMENTS (SPECIAL CASES)
                                </label>
                                <button onClick={handleAddAdditionalDoc} className="passport-add-btn">
                                    + Add Item
                                </button>
                            </div>
                            {editData.additionalDocuments[0]?.items.map((item, index) => (
                                <div key={index} className="passport-list-item-row">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateAdditionalDocItem(index, e.target.value)}
                                        className="passport-list-item-input"
                                    />
                                    <button onClick={() => handleRemoveAdditionalDoc(index)} className="passport-remove-btn">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* STEPS PROCESS */}
                        <div className="passport-field-group">
                            <div className="passport-section-header">
                                <label className="passport-section-label">
                                    STEPS AND PROCESS
                                </label>
                                <button onClick={handleAddStep} className="passport-add-btn">
                                    + Add Step
                                </button>
                            </div>
                            {editData.stepsProcess?.map((step, index) => (
                                <div key={index} className="passport-list-item-row">
                                    <span className="passport-step-number">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={step}
                                        onChange={(e) => updateStepItem(index, e.target.value)}
                                        className="passport-list-item-input"
                                    />
                                    <button onClick={() => handleRemoveStep(index)} className="passport-remove-btn">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="passport-modal-actions">
                            <button onClick={() => setShowEditModal(false)} className="passport-cancel-btn">
                                Cancel
                            </button>
                            <button onClick={handleSaveEdit} className="passport-save-btn">
                                <Save size={18}/> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PassportAppt;