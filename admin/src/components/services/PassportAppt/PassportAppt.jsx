import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../sidebar/sidebar';
import { 
    BookOpen, Calendar, CheckCircle, RotateCcw, 
    FileText, Settings, RefreshCw, X, CreditCard, User,
    ChevronDown, Trash2, PlusCircle, Save, ClipboardList, ListPlus
} from 'lucide-react';
import './PassportAppt.css';

const PassportAppt = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('appointments'); 
    
    // Data States
    const [appointments, setAppointments] = useState([]);
    const [passportData, setPassportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // View Modal States
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [documents, setDocuments] = useState([]);

    // Editor Modal States (Para sa Requirements)
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorData, setEditorData] = useState({
        requirements: [],
        additionalDocuments: [],
        stepsProcess: []
    });
    const [accordionState, setAccordionState] = useState({
        requirements: false,
        additionalDocs: false,
        stepsProcess: false
    });

    // --- FETCH DATA ---
    const fetchPassportDetails = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/passports'); 
            if (res.data.success && res.data.data.length > 0) {
                const data = res.data.data[0];
                setPassportData(data);
                
                // Pre-fill Editor Data
                setEditorData({
                    requirements: data.requirements || [],
                    additionalDocuments: data.additionalDocuments || [],
                    stepsProcess: data.stepsProcess || []
                });
            }
        } catch (error) {
            console.error("Error fetching passport details:", error);
        }
    };

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/inquiries');
            if (response.data.success) {
                const passportRequests = response.data.data.filter(inq => 
                    inq.inquiryType === 'PASSPORT' || 
                    (inq.serviceName && inq.serviceName.toUpperCase().includes('PASSPORT'))
                );
                passportRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAppointments(passportRequests);
            }
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPassportDetails();
        fetchInquiries();
    }, []);

    // --- APPOINTMENT ACTIONS ---
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const response = await axios.put(`http://localhost:5000/api/inquiries/${id}/status`, { status: newStatus });
            if (response.data.success) {
                alert(`Status updated to ${newStatus}`);
                fetchInquiries();
                if (selectedAppointment && selectedAppointment._id === id) {
                    setSelectedAppointment({ ...selectedAppointment, status: newStatus });
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    // --- EDITOR HANDLERS (REQUIREMENTS) ---
    const toggleAccordion = (section) => {
        setAccordionState(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // 1. Primary Requirements Handlers
    const handleReqTitleChange = (idx, val) => {
        const newReqs = [...editorData.requirements];
        newReqs[idx].title = val;
        setEditorData({ ...editorData, requirements: newReqs });
    };
    const handleReqItemChange = (catIdx, itemIdx, val) => {
        const newReqs = [...editorData.requirements];
        newReqs[catIdx].items[itemIdx] = val;
        setEditorData({ ...editorData, requirements: newReqs });
    };
    const addReqItem = (catIdx) => {
        const newReqs = [...editorData.requirements];
        newReqs[catIdx].items.push("");
        setEditorData({ ...editorData, requirements: newReqs });
    };
    const removeReqItem = (catIdx, itemIdx) => {
        const newReqs = [...editorData.requirements];
        newReqs[catIdx].items.splice(itemIdx, 1);
        setEditorData({ ...editorData, requirements: newReqs });
    };
    const addReqCategory = () => {
        setEditorData({
            ...editorData,
            requirements: [...editorData.requirements, { title: "New Requirements Section", items: [""] }]
        });
    };
    const removeReqCategory = (idx) => {
        const newReqs = [...editorData.requirements];
        newReqs.splice(idx, 1);
        setEditorData({ ...editorData, requirements: newReqs });
    };

    // 2. Additional Documents Handlers (Special Cases)
    const handleAddDocTitleChange = (idx, val) => {
        const newDocs = [...editorData.additionalDocuments];
        newDocs[idx].title = val;
        setEditorData({ ...editorData, additionalDocuments: newDocs });
    };
    const handleAddDocItemChange = (catIdx, itemIdx, val) => {
        const newDocs = [...editorData.additionalDocuments];
        newDocs[catIdx].items[itemIdx] = val;
        setEditorData({ ...editorData, additionalDocuments: newDocs });
    };
    const addAddDocItem = (catIdx) => {
        const newDocs = [...editorData.additionalDocuments];
        newDocs[catIdx].items.push("");
        setEditorData({ ...editorData, additionalDocuments: newDocs });
    };
    const removeAddDocItem = (catIdx, itemIdx) => {
        const newDocs = [...editorData.additionalDocuments];
        newDocs[catIdx].items.splice(itemIdx, 1);
        setEditorData({ ...editorData, additionalDocuments: newDocs });
    };
    const addAddDocCategory = () => {
        setEditorData({
            ...editorData,
            additionalDocuments: [...editorData.additionalDocuments, { title: "New Special Case", items: [""] }]
        });
    };
    const removeAddDocCategory = (idx) => {
        const newDocs = [...editorData.additionalDocuments];
        newDocs.splice(idx, 1);
        setEditorData({ ...editorData, additionalDocuments: newDocs });
    };

    // 3. Process Steps Handlers
    const handleStepChange = (idx, val) => {
        const newSteps = [...editorData.stepsProcess];
        newSteps[idx] = val;
        setEditorData({ ...editorData, stepsProcess: newSteps });
    };
    const addStep = () => {
        setEditorData({ ...editorData, stepsProcess: [...editorData.stepsProcess, ""] });
    };
    const removeStep = (idx) => {
        const newSteps = [...editorData.stepsProcess];
        newSteps.splice(idx, 1);
        setEditorData({ ...editorData, stepsProcess: newSteps });
    };

    // SAVE CHANGES
    const handleSaveChanges = async () => {
        if (!passportData || !passportData._id) return;
        
        try {
            // Filter out empty items
            const cleanedData = {
                ...passportData,
                requirements: editorData.requirements.map(cat => ({
                    ...cat, items: cat.items.filter(i => i.trim() !== "")
                })),
                additionalDocuments: editorData.additionalDocuments.map(cat => ({
                    ...cat, items: cat.items.filter(i => i.trim() !== "")
                })),
                stepsProcess: editorData.stepsProcess.filter(s => s.trim() !== "")
            };

            const res = await axios.put(`http://localhost:5000/api/passports/${passportData._id}`, cleanedData);
            if (res.data.success) {
                setPassportData(res.data.data);
                alert("Requirements updated successfully!");
                setIsEditorOpen(false);
            }
        } catch (error) {
            console.error("Error saving passport details:", error);
            alert("Failed to save changes.");
        }
    };

    // Stats & Modals
    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'PAID': return 'badge-paid';
            case 'COMPLETED': return 'badge-completed';
            case 'CANCELLED': return 'badge-cancelled';
            case 'CONTACTED': return 'badge-contacted';
            case 'PAYMENT_PENDING': return 'badge-payment-pending';
            default: return 'badge-pending';
        }
    };

    const stats = [
        { label: 'Total Appts', value: appointments.length, icon: <BookOpen size={24}/> },
        { label: 'Pending', value: appointments.filter(a => a.status === 'PENDING').length, icon: <Calendar size={24}/> },
        { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: <CheckCircle size={24}/> },
        { label: 'Cancelled', value: appointments.filter(a => a.status === 'CANCELLED').length, icon: <RotateCcw size={24}/> },
    ];

    return (
        <div className="passport-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`passport-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="passport-container">
                    
                    {/* Header */}
                    <div className="passport-header">
                        <div className="passport-title">
                            <h1>Passport Appointment</h1>
                            <p>DFA Slot Management & Assistance</p>
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button 
                                onClick={() => setActiveTab('appointments')}
                                className={`passport-btn-add ${activeTab !== 'appointments' ? 'secondary' : ''}`}
                                style={{backgroundColor: activeTab === 'appointments' ? '#3b82f6' : 'white', color: activeTab === 'appointments' ? 'white' : '#64748b', border: activeTab !== 'appointments' ? '1px solid #e2e8f0' : 'none'}}
                            >
                                <Calendar size={18} style={{marginRight:'8px'}}/> Appointments
                            </button>
                            <button 
                                onClick={() => setActiveTab('details')}
                                className={`passport-btn-add ${activeTab !== 'details' ? 'secondary' : ''}`}
                                style={{backgroundColor: activeTab === 'details' ? '#3b82f6' : 'white', color: activeTab === 'details' ? 'white' : '#64748b', border: activeTab !== 'details' ? '1px solid #e2e8f0' : 'none'}}
                            >
                                <FileText size={18} style={{marginRight:'8px'}}/> Requirements
                            </button>
                        </div>
                    </div>

                    {/* VIEW: APPOINTMENTS */}
                    {activeTab === 'appointments' && (
                        <>
                            <div className="passport-stats-grid">
                                {stats.map((s, i) => (
                                    <div className="passport-card" key={i}>
                                        <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                        <div className="passport-card-icon">{s.icon}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="passport-table-container">
                                <div style={{padding: '15px', borderBottom: '1px solid #eee', display:'flex', justifyContent:'flex-end'}}>
                                    <button onClick={fetchInquiries} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <RefreshCw size={14}/> Refresh List
                                    </button>
                                </div>
                                {isLoading ? (
                                    <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading appointments...</div>
                                ) : (
                                    <table className="passport-table">
                                        <thead>
                                            <tr>
                                                <th>Ref ID</th>
                                                <th>Applicant</th>
                                                <th>Type</th>
                                                <th>DFA Site</th>
                                                <th>Target Date</th>
                                                <th>Status</th>
                                                <th style={{textAlign:'right'}}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.length > 0 ? appointments.map((item) => (
                                                <tr key={item._id}>
                                                    <td style={{fontWeight:'700', color:'#0f172a'}}>
                                                        #{item._id.substring(item._id.length - 6).toUpperCase()}
                                                    </td>
                                                    <td>
                                                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                            <div style={{background:'#eff6ff', padding:'8px', borderRadius:'50%', color:'#3b82f6'}}><User size={16}/></div>
                                                            <div>{item.fullName}<br/><span style={{fontSize:'11px', color:'#94a3b8'}}>{item.email}</span></div>
                                                        </div>
                                                    </td>
                                                    <td>{item.passportDetails?.applicationType || 'NEW'}<br/><span style={{fontSize:'11px', color:'#64748b'}}>{item.passportDetails?.processingType || 'REGULAR'}</span></td>
                                                    <td>{item.passportDetails?.dfaLocation || 'TBD'}</td>
                                                    <td>{item.passportDetails?.appointmentDate || 'TBD'}</td>
                                                    <td><span className={`visa-badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                                                    <td style={{textAlign:'right'}}>
                                                        <button className="passport-action-btn" onClick={() => { setSelectedAppointment(item); setIsViewModalOpen(true); }}>View</button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#64748b'}}>No Passport appointments found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}

                    {/* VIEW: REQUIREMENTS DETAILS */}
                    {activeTab === 'details' && passportData && (
                        <div className="passport-details-container" style={{background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                                <h2>Service Requirements Configuration</h2>
                                <button className="passport-action-btn" onClick={() => setIsEditorOpen(true)}>
                                    <Settings size={14} style={{marginRight: '5px'}}/> Edit Requirements
                                </button>
                            </div>

                            {/* Show Primary Requirements */}
                            <div style={{marginBottom: '30px'}}>
                                <h3 style={{color: '#0f172a', fontSize: '16px', fontWeight: '800', marginBottom: '15px', textTransform:'uppercase'}}>
                                    Primary Requirements
                                </h3>
                                {passportData.requirements.map((req, idx) => (
                                    <div key={idx} style={{marginBottom:'15px'}}>
                                        <h4 style={{fontSize:'14px', margin:'0 0 5px 0', color:'#334155'}}>{req.title}</h4>
                                        <ul style={{paddingLeft: '20px', color: '#64748b', fontSize:'13px', lineHeight: '1.6'}}>
                                            {req.items.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            {/* Show Additional Docs */}
                            <div style={{marginBottom: '30px'}}>
                                <h3 style={{color: '#0f172a', fontSize: '16px', fontWeight: '800', marginBottom: '15px', textTransform:'uppercase'}}>
                                    Additional Documents (Special Cases)
                                </h3>
                                {passportData.additionalDocuments.map((doc, idx) => (
                                    <div key={idx} style={{marginBottom:'15px'}}>
                                        <h4 style={{fontSize:'14px', margin:'0 0 5px 0', color:'#334155'}}>{doc.title}</h4>
                                        <ul style={{paddingLeft: '20px', color: '#64748b', fontSize:'13px', lineHeight: '1.6'}}>
                                            {doc.items.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* --- EDITOR MODAL (REQUIREMENTS CONFIG) --- */}
            {isEditorOpen && (
                <div className="modal-overlay">
                    <div className="modal-content modal-content-large">
                        <div className="modal-header">
                            <div>
                                <h2 style={{margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a"}}>EDIT PASSPORT REQUIREMENTS</h2>
                                <p style={{margin: "4px 0 0 0", color: "#64748b", fontSize: "13px"}}>Manage the checklist for passport applicants</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsEditorOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body bg-gray">
                            
                            {/* Accordion 1: Primary Requirements */}
                            <div className="accordion-section">
                                <button className={`accordion-header ${accordionState.requirements ? 'active' : ''}`} onClick={() => toggleAccordion('requirements')}>
                                    <span className="accordion-title"><FileText size={18} style={{marginRight:'8px', color:'#f97316'}}/> Primary Requirements</span>
                                    <ChevronDown size={20} className={`accordion-chevron ${accordionState.requirements ? 'rotate' : ''}`}/>
                                </button>
                                {accordionState.requirements && (
                                    <div className="accordion-content">
                                        {editorData.requirements.map((cat, catIdx) => (
                                            <div key={catIdx} className="req-category">
                                                <div className="req-category-header">
                                                    <input type="text" className="req-header-input" value={cat.title} onChange={(e) => handleReqTitleChange(catIdx, e.target.value)} placeholder="SECTION TITLE" />
                                                    <button className="req-header-delete-btn" onClick={() => removeReqCategory(catIdx)}><Trash2 size={16}/></button>
                                                </div>
                                                <div className="req-list">
                                                    {cat.items.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="req-item-editable">
                                                            <input type="text" className="req-input-text" value={item} onChange={(e) => handleReqItemChange(catIdx, itemIdx, e.target.value)} placeholder="Enter requirement..." />
                                                            <button className="req-delete-btn" onClick={() => removeReqItem(catIdx, itemIdx)}><Trash2 size={16}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="req-category-footer">
                                                    <button className="req-add-btn" onClick={() => addReqItem(catIdx)}><PlusCircle size={16}/> Add Item</button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="req-add-group-btn" onClick={addReqCategory}><ListPlus size={20}/> Add New Section</button>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Additional Documents */}
                            <div className="accordion-section">
                                <button className={`accordion-header ${accordionState.additionalDocs ? 'active' : ''}`} onClick={() => toggleAccordion('additionalDocs')}>
                                    <span className="accordion-title"><FileText size={18} style={{marginRight:'8px', color:'#f97316'}}/> Additional Documents (Special Cases)</span>
                                    <ChevronDown size={20} className={`accordion-chevron ${accordionState.additionalDocs ? 'rotate' : ''}`}/>
                                </button>
                                {accordionState.additionalDocs && (
                                    <div className="accordion-content">
                                        {editorData.additionalDocuments.map((cat, catIdx) => (
                                            <div key={catIdx} className="req-category">
                                                <div className="req-category-header">
                                                    <input type="text" className="req-header-input" value={cat.title} onChange={(e) => handleAddDocTitleChange(catIdx, e.target.value)} placeholder="CASE TITLE" />
                                                    <button className="req-header-delete-btn" onClick={() => removeAddDocCategory(catIdx)}><Trash2 size={16}/></button>
                                                </div>
                                                <div className="req-list">
                                                    {cat.items.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="req-item-editable">
                                                            <input type="text" className="req-input-text" value={item} onChange={(e) => handleAddDocItemChange(catIdx, itemIdx, e.target.value)} placeholder="Enter additional doc..." />
                                                            <button className="req-delete-btn" onClick={() => removeAddDocItem(catIdx, itemIdx)}><Trash2 size={16}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="req-category-footer">
                                                    <button className="req-add-btn" onClick={() => addAddDocItem(catIdx)}><PlusCircle size={16}/> Add Item</button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="req-add-group-btn" onClick={addAddDocCategory}><ListPlus size={20}/> Add New Case</button>
                                    </div>
                                )}
                            </div>

                            {/* Accordion 3: Process Steps */}
                            <div className="accordion-section">
                                <button className={`accordion-header ${accordionState.stepsProcess ? 'active' : ''}`} onClick={() => toggleAccordion('stepsProcess')}>
                                    <span className="accordion-title"><ClipboardList size={18} style={{marginRight:'8px', color:'#f97316'}}/> Steps and Process</span>
                                    <ChevronDown size={20} className={`accordion-chevron ${accordionState.stepsProcess ? 'rotate' : ''}`}/>
                                </button>
                                {accordionState.stepsProcess && (
                                    <div className="accordion-content">
                                        <div className="simple-list">
                                            {editorData.stepsProcess.map((step, idx) => (
                                                <div key={idx} className="step-item-editable">
                                                    <span className="step-number-badge">{idx + 1}</span>
                                                    <input type="text" className="req-input-text" value={step} onChange={(e) => handleStepChange(idx, e.target.value)} placeholder="Enter process step..." />
                                                    <button className="req-delete-btn" onClick={() => removeStep(idx)}><Trash2 size={18}/></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="req-add-btn" onClick={addStep} style={{marginTop:'15px'}}><ClipboardList size={16}/> Add Step</button>
                                    </div>
                                )}
                            </div>

                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel-btn" onClick={() => setIsEditorOpen(false)}>Cancel</button>
                            <button className="modal-save-btn" onClick={handleSaveChanges}><Save size={18}/> Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW APPOINTMENT MODAL --- */}
            {isViewModalOpen && selectedAppointment && (
                <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setIsViewModalOpen(false) }}>
                    <div className="modal-content modal-content-large">
                        <div className="modal-header">
                            <div>
                                <h2 style={{margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a"}}>APPOINTMENT DETAILS</h2>
                                <p style={{margin: "4px 0 0 0", color: "#64748b", fontSize: "13px"}}>Ref: {selectedAppointment._id.toUpperCase()}</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsViewModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border:'1px solid #e2e8f0' }}>
                                <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color:'#334155'}}>CLIENT INFORMATION</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div><label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>FULL NAME</label><p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.fullName}</p></div>
                                    <div><label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>EMAIL</label><p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.email}</p></div>
                                    <div><label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>SERVICE FEE</label><p style={{margin:'4px 0 0', fontWeight:'600', color:'#059669'}}>₱{selectedAppointment.estimatedPrice?.toLocaleString()}</p></div>
                                </div>
                            </div>

                            <div style={{marginTop: '20px'}}>
                                <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color:'#334155'}}>UPDATE STATUS</h3>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button className="passport-action-btn" onClick={() => handleUpdateStatus(selectedAppointment._id, 'PENDING')}>Set Pending</button>
                                    <button className="passport-action-btn" onClick={() => handleUpdateStatus(selectedAppointment._id, 'CONTACTED')}>Set Contacted</button>
                                    <button className="passport-action-btn" style={{background:'#dcfce7', color:'#15803d', border:'1px solid #86efac'}} onClick={() => handleUpdateStatus(selectedAppointment._id, 'PAYMENT_PENDING')}>Approve & Payment</button>
                                    <button className="passport-action-btn" style={{background:'#3b82f6', color:'white', border:'none'}} onClick={() => handleUpdateStatus(selectedAppointment._id, 'COMPLETED')}>Mark Completed</button>
                                    <button className="passport-action-btn" style={{background:'#ef4444', color:'white', border:'none'}} onClick={() => handleUpdateStatus(selectedAppointment._id, 'CANCELLED')}>Cancel Appt</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassportAppt;