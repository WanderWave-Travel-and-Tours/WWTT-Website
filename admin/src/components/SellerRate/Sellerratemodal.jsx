import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
// Import Toast and Confirm Modal dependencies
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";
import './Sellerratemodal.css';

const SellerRateModal = ({ 
  show, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  calculateSellingPrice,
  editingRate 
}) => {
  // Initialize Toast
  const toast = useToast();

  // State for Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary'
  });

  if (!show) return null;

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Close helper for confirmation modal
  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Intercept form submission to show confirmation first
  const handlePreSubmit = (e) => {
    e.preventDefault();
    
    setConfirmModal({
      isOpen: true,
      title: editingRate ? 'Confirm Update' : 'Confirm Save',
      message: `Are you sure you want to ${editingRate ? 'update' : 'save'} this rate for ${formData.destination}?`,
      type: 'primary',
      onConfirm: () => executeSubmit()
    });
  };

  // Actual execution of the submit logic
  const executeSubmit = async () => {
    try {
      closeConfirm();
      await onSubmit(); // Execute the original onSubmit prop
      toast.success(
        `Rate ${editingRate ? 'updated' : 'saved'} successfully`, 
        'Success'
      );
    } catch (error) {
      toast.error(
        `Failed to ${editingRate ? 'update' : 'save'} rate. Please try again.`, 
        'Error'
      );
    }
  };

  return (
    <>
      <div className="sr-modal-overlay" onClick={onClose}>
        <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sr-modal-header">
            <h2>{editingRate ? 'Edit Rate' : 'Add New Rate'}</h2>
            <button onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handlePreSubmit}>
            <div className="sr-form-grid">
              
              {/* Destination */}
              <div className="sr-form-group">
                <label>Destination *</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="e.g. Siargao"
                />
              </div>

              {/* Activity */}
              <div className="sr-form-group">
                <label>Activity/Tour *</label>
                <input
                  type="text"
                  required
                  value={formData.activity}
                  onChange={(e) => handleInputChange('activity', e.target.value)}
                  placeholder="e.g. Island Hopping"
                />
              </div>

              {/* Supplier Name */}
              <div className="sr-form-group">
                <label>Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplierName}
                  onChange={(e) => handleInputChange('supplierName', e.target.value)}
                  placeholder="e.g. Siargao Tours Inc."
                />
              </div>

              {/* Pax */}
              <div className="sr-form-group">
                <label>Pax</label>
                <input
                  type="text"
                  value={formData.pax}
                  onChange={(e) => handleInputChange('pax', e.target.value)}
                  placeholder="e.g. 2-4 pax"
                />
              </div>

              {/* Supplier Rate */}
              <div className="sr-form-group">
                <label>Supplier Rate (₱) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.supplierRate}
                  onChange={(e) => handleInputChange('supplierRate', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Markup Type */}
              <div className="sr-form-group">
                <label>Markup Type</label>
                <select
                  value={formData.markupType}
                  onChange={(e) => handleInputChange('markupType', e.target.value)}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₱)</option>
                </select>
              </div>

              {/* Markup Amount */}
              <div className="sr-form-group">
                <label>Markup Amount *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.markup}
                  onChange={(e) => handleInputChange('markup', e.target.value)}
                  placeholder={formData.markupType === 'percentage' ? '0%' : '₱0.00'}
                />
              </div>

              {/* Selling Price Display */}
              <div className="sr-form-group sr-selling-price">
                <label>Selling Price</label>
                <div className="sr-calculated-price">
                  ₱{calculateSellingPrice().toLocaleString('en-US', {
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>

            {/* Inclusions */}
            <div className="sr-form-group sr-full-width">
              <label>Inclusions</label>
              <textarea
                value={formData.inclusions}
                onChange={(e) => handleInputChange('inclusions', e.target.value)}
                placeholder="e.g. Boat rental, snorkeling gear, lunch..."
                rows="3"
              />
            </div>

            {/* Notes */}
            <div className="sr-form-group sr-full-width">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes..."
                rows="2"
              />
            </div>

            {/* Footer Actions */}
            <div className="sr-modal-footer">
              <button 
                type="button" 
                className="sr-btn-cancel" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="sr-btn-primary">
                <Save size={16} /> {editingRate ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal Component */}
      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  );
};

export default SellerRateModal;