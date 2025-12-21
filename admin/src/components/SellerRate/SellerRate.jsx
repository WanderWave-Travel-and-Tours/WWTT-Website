import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import { 
  Upload, FileText, Search, Download, Trash2, RefreshCw, 
  DollarSign, Tag, Plus, X, Edit2, Save, CheckCircle, 
  AlertCircle, TrendingUp
} from 'lucide-react';
import { parseFlexibleExcel, previewExcelColumns } from './flexibleExcelParser';
import './SellerRate.css';

const SellerRate = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [rates, setRates] = useState([]);
  const [editingRate, setEditingRate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);

  const [formData, setFormData] = useState({
    destination: '',
    activity: '',
    supplierName: '',
    supplierRate: '',
    markup: '',
    markupType: 'percentage',
    pax: '',
    inclusions: '',
    notes: ''
  });

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch('https://wanderwaveph-backend.onrender.com0/api/seller-rates');
      if (!response.ok) {
        console.error('Failed to fetch rates:', response.status);
        setRates([]); // Set empty array on error
        return;
      }
      const data = await response.json();
      setRates(Array.isArray(data) ? data : []); // Ensure it's always an array
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRates([]); // Set empty array on error
    }
  };

  const calculateSellingPrice = () => {
    const rate = parseFloat(formData.supplierRate) || 0;
    const markup = parseFloat(formData.markup) || 0;

    if (formData.markupType === 'percentage') {
      return rate + (rate * markup / 100);
    } else {
      return rate + markup;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const sellingPrice = calculateSellingPrice();
    const rateData = {
      ...formData,
      supplierRate: parseFloat(formData.supplierRate),
      markup: parseFloat(formData.markup),
      sellingPrice,
      status: 'active',
      dateAdded: new Date()
    };

    try {
      const url = editingRate 
        ? `https://wanderwaveph-backend.onrender.com0/api/seller-rates/${editingRate._id}`
        : 'https://wanderwaveph-backend.onrender.com0/api/seller-rates';
      
      const method = editingRate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData)
      });

      if (response.ok) {
        alert(editingRate ? 'Rate updated!' : 'Rate added successfully!');
        fetchRates();
        resetForm();
        setShowAddModal(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to save rate'}`);
      }
    } catch (error) {
      console.error('Error saving rate:', error);
      alert('Failed to save rate. Please check console for details.');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadStatus({ type: 'loading', message: 'Analyzing Excel file...' });

    try {
      const preview = await previewExcelColumns(file);
      setPreviewData(preview);
      setShowPreviewModal(true);
      setUploadStatus(null);
    } catch (error) {
      console.error('Error previewing file:', error);
      setUploadStatus({ 
        type: 'error', 
        message: `Error reading file: ${error.message || 'Please check file format'}` 
      });
    }
  };

  const handleFlexibleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus({ type: 'loading', message: 'Importing rates...' });
    setShowPreviewModal(false);

    try {
      const { rates: parsedRates, report } = await parseFlexibleExcel(selectedFile);

      console.log('📊 Import Report:', report);
      console.log('✅ Parsed Rates:', parsedRates);

      if (!parsedRates || parsedRates.length === 0) {
        setUploadStatus({
          type: 'error',
          message: 'No valid data found in Excel file. Please check your file format.'
        });
        return;
      }

      const response = await fetch('https://wanderwaveph-backend.onrender.com0/api/seller-rates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRates)
      });

      if (response.ok) {
        setUploadStatus({
          type: 'success',
          message: `Successfully imported ${parsedRates.length} rates! (${report.skippedRows} rows skipped)`
        });
        fetchRates();
        setSelectedFile(null);
        
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatus(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setUploadStatus({
          type: 'error',
          message: `Upload failed: ${errorData.message || 'Server error'}`
        });
      }
    } catch (error) {
      console.error('Error uploading rates:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to import rates'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rate?')) return;

    try {
      const response = await fetch(`https://wanderwaveph-backend.onrender.com0/api/seller-rates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Rate deleted!');
        fetchRates();
      } else {
        alert('Failed to delete rate');
      }
    } catch (error) {
      console.error('Error deleting rate:', error);
      alert('Error deleting rate');
    }
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      destination: rate.destination || '',
      activity: rate.activity || '',
      supplierName: rate.supplierName || '',
      supplierRate: rate.supplierRate || '',
      markup: rate.markup || '',
      markupType: rate.markupType || 'percentage',
      pax: rate.pax || '',
      inclusions: rate.inclusions || '',
      notes: rate.notes || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      destination: '',
      activity: '',
      supplierName: '',
      supplierRate: '',
      markup: '',
      markupType: 'percentage',
      pax: '',
      inclusions: '',
      notes: ''
    });
    setEditingRate(null);
  };

  const filteredRates = Array.isArray(rates) ? rates.filter(rate => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (rate.destination && rate.destination.toLowerCase().includes(query)) ||
      (rate.activity && rate.activity.toLowerCase().includes(query)) ||
      (rate.supplierName && rate.supplierName.toLowerCase().includes(query))
    );
  }) : [];

  // SAFE stats calculation with null checks
  const stats = [
    { 
      label: 'Total Rates', 
      value: rates.length || 0, 
      icon: <FileText size={24}/>, 
      color: '#3b82f6' 
    },
    { 
      label: 'Avg Markup', 
      value: rates.length > 0 
        ? `${(rates.reduce((acc, r) => acc + (r.markup || 0), 0) / rates.length).toFixed(1)}%`
        : '0%', 
      icon: <TrendingUp size={24}/>, 
      color: '#10b981' 
    },
    { 
      label: 'Destinations', 
      value: rates.length > 0 
        ? new Set(rates.map(r => r.destination).filter(Boolean)).size 
        : 0, 
      icon: <Tag size={24}/>, 
      color: '#f59e0b' 
    },
  ];

  return (
    <div className="sr-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className={`sr-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="sr-container">
          
          <div className="sr-header">
            <div className="sr-title">
              <h1>Seller Rates</h1>
              <p>Supplier pricing and markup management</p>
            </div>
            
            <div className="sr-header-actions">
              <button className="sr-btn-secondary" onClick={() => setShowUploadModal(true)}>
                <Upload size={18} /> Upload Excel
              </button>
              <button className="sr-btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={18} /> Add Rate
              </button>
            </div>
          </div>

          <div className="sr-stats-grid">
            {stats.map((s, i) => (
              <div className="sr-card" key={i}>
                <div>
                  <h2>{s.value}</h2>
                  <span>{s.label}</span>
                </div>
                <div className="sr-card-icon" style={{color: s.color, backgroundColor: `${s.color}15`}}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="sr-filter-card">
            <div className="sr-search-box">
              <Search size={20} />
              <input 
                type="text" 
                placeholder="Search by destination, activity, or supplier..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="sr-refresh-btn" onClick={fetchRates}>
              <RefreshCw size={16}/> Refresh
            </button>
          </div>

          <div className="sr-table-container">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Activity/Tour</th>
                  <th>Supplier</th>
                  <th>Supplier Rate</th>
                  <th>Markup</th>
                  <th>Selling Price</th>
                  <th>Pax</th>
                  <th>Status</th>
                  <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                      {rates.length === 0 
                        ? 'No rates found. Add your first rate or upload an Excel file.'
                        : 'No rates match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((rate) => (
                    <tr key={rate._id}>
                      <td style={{fontWeight: '700', color: '#0f172a'}}>
                        {rate.destination || 'N/A'}
                      </td>
                      <td>
                        <div>
                          <strong>{rate.activity || 'N/A'}</strong>
                          {rate.inclusions && (
                            <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '4px'}}>
                              {rate.inclusions.substring(0, 50)}
                              {rate.inclusions.length > 50 && '...'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{rate.supplierName || 'N/A'}</td>
                      <td style={{fontWeight: '600'}}>
                        ₱{(rate.supplierRate || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className="sr-markup-badge">
                          {rate.markupType === 'percentage' 
                            ? `${(rate.markup || 0).toFixed(1)}%` 
                            : `₱${rate.markup || 0}`
                          }
                        </span>
                      </td>
                      <td style={{fontWeight: '700', color: '#10b981', fontSize: '15px'}}>
                        ₱{(rate.sellingPrice || 0).toLocaleString()}
                      </td>
                      <td>{rate.pax || '-'}</td>
                      <td>
                        <span className={`sr-status-badge ${rate.status || 'active'}`}>
                          {(rate.status || 'active').toUpperCase()}
                        </span>
                      </td>
                      <td style={{textAlign: 'right'}}>
                        <button className="sr-action-btn" onClick={() => handleEdit(rate)}>
                          <Edit2 size={14}/> Edit
                        </button>
                        <button className="sr-action-btn danger" onClick={() => handleDelete(rate._id)}>
                          <Trash2 size={14}/> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADD/EDIT MODAL */}
      {showAddModal && (
        <div className="sr-modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h2>{editingRate ? 'Edit Rate' : 'Add New Rate'}</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="sr-form-grid">
                <div className="sr-form-group">
                  <label>Destination *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    placeholder="e.g. Siargao"
                  />
                </div>

                <div className="sr-form-group">
                  <label>Activity/Tour *</label>
                  <input
                    type="text"
                    required
                    value={formData.activity}
                    onChange={(e) => setFormData({...formData, activity: e.target.value})}
                    placeholder="e.g. Island Hopping"
                  />
                </div>

                <div className="sr-form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                    placeholder="e.g. Siargao Tours Inc."
                  />
                </div>

                <div className="sr-form-group">
                  <label>Pax</label>
                  <input
                    type="text"
                    value={formData.pax}
                    onChange={(e) => setFormData({...formData, pax: e.target.value})}
                    placeholder="e.g. 2-4 pax"
                  />
                </div>

                <div className="sr-form-group">
                  <label>Supplier Rate (₱) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.supplierRate}
                    onChange={(e) => setFormData({...formData, supplierRate: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="sr-form-group">
                  <label>Markup Type</label>
                  <select
                    value={formData.markupType}
                    onChange={(e) => setFormData({...formData, markupType: e.target.value})}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>

                <div className="sr-form-group">
                  <label>Markup Amount *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.markup}
                    onChange={(e) => setFormData({...formData, markup: e.target.value})}
                    placeholder={formData.markupType === 'percentage' ? '0%' : '₱0.00'}
                  />
                </div>

                <div className="sr-form-group sr-selling-price">
                  <label>Selling Price</label>
                  <div className="sr-calculated-price">
                    ₱{calculateSellingPrice().toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
              </div>

              <div className="sr-form-group sr-full-width">
                <label>Inclusions</label>
                <textarea
                  value={formData.inclusions}
                  onChange={(e) => setFormData({...formData, inclusions: e.target.value})}
                  placeholder="e.g. Boat rental, snorkeling gear, lunch..."
                  rows="3"
                />
              </div>

              <div className="sr-form-group sr-full-width">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows="2"
                />
              </div>

              <div className="sr-modal-footer">
                <button type="button" className="sr-btn-cancel" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="sr-btn-primary">
                  <Save size={16}/> {editingRate ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="sr-modal-overlay" onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}>
          <div className="sr-modal sr-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h2>Upload Excel Rate Sheet</h2>
              <button onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}>
                <X size={20}/>
              </button>
            </div>

            <div className="sr-upload-content">
              <div className="sr-upload-instructions">
                <h3>📊 Flexible Excel Import</h3>
                <p>The system automatically detects column names:</p>
                <ul>
                  <li><strong>Destination:</strong> destination, dest, location, place, city</li>
                  <li><strong>Activity:</strong> activity, tour, package, service</li>
                  <li><strong>Supplier:</strong> supplier, vendor, provider, hotel</li>
                  <li><strong>Rate:</strong> supplier rate, cost, net rate, base price</li>
                  <li><strong>Markup:</strong> markup, margin, commission, profit</li>
                </ul>
                <p style={{color: '#10b981', fontWeight: '600', marginTop: '12px'}}>
                  ✨ Just upload - we'll detect your columns!
                </p>
              </div>

              <div className="sr-upload-area">
                <label className="sr-file-upload-label">
                  <input 
                    type="file" 
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    hidden 
                  />
                  <Upload size={40} />
                  <h3>Drop Excel file here or click to browse</h3>
                  <p>Supports .xlsx and .xls files</p>
                  {selectedFile && (
                    <div className="sr-selected-file">
                      <FileText size={20}/>
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                </label>
              </div>

              {uploadStatus && (
                <div className={`sr-upload-status ${uploadStatus.type}`}>
                  {uploadStatus.type === 'loading' && <RefreshCw size={18} className="spinning"/>}
                  {uploadStatus.type === 'success' && <CheckCircle size={18}/>}
                  {uploadStatus.type === 'error' && <AlertCircle size={18}/>}
                  <span>{uploadStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreviewModal && previewData && (
        <div className="sr-modal-overlay">
          <div className="sr-modal sr-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-header">
              <h2>Preview Import - {previewData.sheetName}</h2>
              <button onClick={() => setShowPreviewModal(false)}><X size={20}/></button>
            </div>

            <div className="sr-preview-content">
              <div className="sr-preview-stats">
                <div className="sr-stat-item">
                  <FileText size={20}/>
                  <span>{previewData.totalRows} rows</span>
                </div>
                <div className="sr-stat-item">
                  <CheckCircle size={20}/>
                  <span>{Object.keys(previewData.detectedMapping || {}).length} columns detected</span>
                </div>
              </div>

              <h3>Detected Column Mapping:</h3>
              <div className="sr-column-mapping">
                {Object.entries(previewData.detectedMapping || {}).map(([field, column]) => (
                  <div key={field} className="sr-mapping-item">
                    <span className="sr-field-name">{field}</span>
                    <span className="sr-arrow">→</span>
                    <span className="sr-column-name">{column}</span>
                  </div>
                ))}
              </div>

              <div className="sr-preview-actions">
                <button className="sr-btn-cancel" onClick={() => setShowPreviewModal(false)}>
                  Cancel
                </button>
                <button className="sr-btn-primary" onClick={handleFlexibleUpload}>
                  <Upload size={16}/> Confirm Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRate;