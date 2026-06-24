import React, { useState, useEffect } from 'react';
import Sidebar from '../../sidebar/sidebar';
import api from '../../lib/axiosInstance';
import { 
  Plus, BookOpen, Calendar, CheckCircle, RotateCcw, 
  Edit2, Trash2, Save, X, FileText, List, Settings 
} from 'lucide-react';
//import './PassportAppt.css';

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
                        <div style={{display:'flex', gap:'12px'}}>
                            {!passportData && (
                                <button 
                                    className="passport-btn-add" 
                                    onClick={handleInitialize}
                                    style={{background:'#10b981'}}
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
                        <div className="passport-card" style={{marginBottom:'24px', padding:'24px'}}>
                            <div style={{width:'100%'}}>
                                <h3 style={{margin:'0 0 16px 0', fontSize:'18px', fontWeight:'800', color:'#0f172a'}}>
                                    📋 Current Requirements Configuration
                                </h3>
                                <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px'}}>
                                    <div>
                                        <span style={{fontSize:'12px', color:'#64748b', fontWeight:'600'}}>Primary Requirements</span>
                                        <p style={{fontSize:'24px', fontWeight:'800', color:'#0f172a', margin:'4px 0 0'}}>
                                            {passportData.requirements[0]?.items.length || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{fontSize:'12px', color:'#64748b', fontWeight:'600'}}>Additional Documents</span>
                                        <p style={{fontSize:'24px', fontWeight:'800', color:'#0f172a', margin:'4px 0 0'}}>
                                            {passportData.additionalDocuments[0]?.items.length || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{fontSize:'12px', color:'#64748b', fontWeight:'600'}}>Process Steps</span>
                                        <p style={{fontSize:'24px', fontWeight:'800', color:'#0f172a', margin:'4px 0 0'}}>
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
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{item.id}</td>
                                        <td>{item.client}</td>
                                        <td>{item.type}</td>
                                        <td>{item.site}</td>
                                        <td>{item.date} <br/><span style={{fontSize:'12px', color:'#64748b'}}>{item.time}</span></td>
                                        <td><span style={{background:'#dcfce7', color:'#166534', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:'700', textTransform:'uppercase'}}>{item.status}</span></td>
                                        <td style={{textAlign:'right'}}>
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
                <div className="modal-overlay" onClick={() => setShowEditModal(false)} style={{
                    position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', 
                    display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'20px'
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                        background:'white', borderRadius:'16px', maxWidth:'900px', width:'100%', 
                        maxHeight:'90vh', overflow:'auto', padding:'32px'
                    }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                            <h2 style={{margin:0, fontSize:'24px', fontWeight:'800', color:'#0f172a'}}>
                                Edit Passport Requirements
                            </h2>
                            <button onClick={() => setShowEditModal(false)} style={{
                                background:'none', border:'none', cursor:'pointer', padding:'8px'
                            }}>
                                <X size={24} color="#64748b"/>
                            </button>
                        </div>

                        {/* Basic Info */}
                        <div style={{marginBottom:'24px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>
                                SERVICE NAME
                            </label>
                            <input 
                                type="text" 
                                value={editData.serviceName}
                                onChange={(e) => setEditData(prev => ({...prev, serviceName: e.target.value}))}
                                style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'14px'}}
                            />
                        </div>

                        <div style={{marginBottom:'24px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>
                                DESCRIPTION
                            </label>
                            <input 
                                type="text" 
                                value={editData.description}
                                onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                                style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'14px'}}
                            />
                        </div>

                        <div style={{marginBottom:'24px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>
                                SERVICE FEE (₱)
                            </label>
                            <input 
                                type="number" 
                                value={editData.price}
                                onChange={(e) => setEditData(prev => ({...prev, price: parseFloat(e.target.value)}))}
                                style={{width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'14px'}}
                            />
                        </div>

                        {/* PRIMARY REQUIREMENTS */}
                        <div style={{marginBottom:'24px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                                <label style={{fontSize:'14px', fontWeight:'800', color:'#0f172a'}}>
                                    PRIMARY REQUIREMENTS
                                </label>
                                <button onClick={handleAddRequirement} style={{
                                    background:'#3b82f6', color:'white', border:'none', padding:'6px 12px',
                                    borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer'
                                }}>
                                    + Add Item
                                </button>
                            </div>
                            {editData.requirements[0]?.items.map((item, index) => (
                                <div key={index} style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                                    <input 
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateRequirementItem(index, e.target.value)}
                                        style={{flex:1, padding:'10px', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'13px'}}
                                    />
                                    <button onClick={() => handleRemoveRequirement(index)} style={{
                                        background:'#ef4444', color:'white', border:'none', padding:'8px 12px',
                                        borderRadius:'6px', cursor:'pointer'
                                    }}>
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ADDITIONAL DOCUMENTS */}
                        <div style={{marginBottom:'24px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                                <label style={{fontSize:'14px', fontWeight:'800', color:'#0f172a'}}>
                                    ADDITIONAL DOCUMENTS (SPECIAL CASES)
                                </label>
                                <button onClick={handleAddAdditionalDoc} style={{
                                    background:'#3b82f6', color:'white', border:'none', padding:'6px 12px',
                                    borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer'
                                }}>
                                    + Add Item
                                </button>
                            </div>
                            {editData.additionalDocuments[0]?.items.map((item, index) => (
                                <div key={index} style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                                    <input 
                                        type="text"
                                        value={item}
                                        onChange={(e) => updateAdditionalDocItem(index, e.target.value)}
                                        style={{flex:1, padding:'10px', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'13px'}}
                                    />
                                    <button onClick={() => handleRemoveAdditionalDoc(index)} style={{
                                        background:'#ef4444', color:'white', border:'none', padding:'8px 12px',
                                        borderRadius:'6px', cursor:'pointer'
                                    }}>
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* STEPS PROCESS */}
                        <div style={{marginBottom:'24px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                                <label style={{fontSize:'14px', fontWeight:'800', color:'#0f172a'}}>
                                    STEPS AND PROCESS
                                </label>
                                <button onClick={handleAddStep} style={{
                                    background:'#3b82f6', color:'white', border:'none', padding:'6px 12px',
                                    borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer'
                                }}>
                                    + Add Step
                                </button>
                            </div>
                            {editData.stepsProcess?.map((step, index) => (
                                <div key={index} style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                                    <span style={{padding:'10px', fontWeight:'700', color:'#64748b'}}>{index + 1}.</span>
                                    <input 
                                        type="text"
                                        value={step}
                                        onChange={(e) => updateStepItem(index, e.target.value)}
                                        style={{flex:1, padding:'10px', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'13px'}}
                                    />
                                    <button onClick={() => handleRemoveStep(index)} style={{
                                        background:'#ef4444', color:'white', border:'none', padding:'8px 12px',
                                        borderRadius:'6px', cursor:'pointer'
                                    }}>
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'32px'}}>
                            <button onClick={() => setShowEditModal(false)} style={{
                                background:'white', color:'#64748b', border:'1px solid #e2e8f0', 
                                padding:'12px 24px', borderRadius:'8px', fontWeight:'600', cursor:'pointer'
                            }}>
                                Cancel
                            </button>
                            <button onClick={handleSaveEdit} style={{
                                background:'#3b82f6', color:'white', border:'none', 
                                padding:'12px 24px', borderRadius:'8px', fontWeight:'600', cursor:'pointer',
                                display:'flex', alignItems:'center', gap:'8px'
                            }}>
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