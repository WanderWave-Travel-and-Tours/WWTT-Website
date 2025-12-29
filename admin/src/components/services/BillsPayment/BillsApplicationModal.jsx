import React, { useState } from "react";
import { X, CheckCircle, Receipt, Calendar, DollarSign, CreditCard } from "lucide-react";
import "./BillsModals.css";

export const BillsApplicationModal = ({ isOpen, onClose, onAddBill }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    client: "",
    biller: "",
    acctNo: "",
    dueDate: "",
    amount: ""
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    if (!formData.client || !formData.biller || !formData.amount) return alert("Please fill required fields");
    
    const newBill = {
        id: `BP-${Math.floor(Math.random() * 10000)}`,
        client: formData.client,
        biller: formData.biller,
        acctNo: formData.acctNo,
        amount: parseFloat(formData.amount) || 0,
        dueDate: formData.dueDate || new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
        status: 'Pending'
    };

    onAddBill(newBill);
    setStep(2);
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({ client: "", biller: "", acctNo: "", dueDate: "", amount: "" });
    onClose();
  };

  return (
    <div className="bpm-overlay" onClick={(e) => e.target.className === "bpm-overlay" && onClose()}>
      <div className={`bpm-modal ${step === 1 ? "bpm-modal-lg" : "bpm-modal-sm"}`}>
        
        {step === 1 && (
          <>
            <div className="bpm-header">
              <div className="bpm-title-group">
                <h2 className="bpm-title">Pay Bill</h2>
                <span className="bpm-subtitle">Create new bill transaction</span>
              </div>
              <button className="bpm-close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="bpm-body">
              <div className="bpm-form-section">
                <h3 className="bpm-section-title">Payer Details</h3>
                <div className="bpm-form-group">
                  <label className="bpm-form-label">Client Name / Reference</label>
                  <input type="text" name="client" className="bpm-input" placeholder="e.g. Juan Dela Cruz" value={formData.client} onChange={handleInputChange} />
                </div>
              </div>

              <div className="bpm-form-section">
                <h3 className="bpm-section-title">Payment Details</h3>
                <div className="bpm-form-row">
                    <div className="bpm-form-group">
                        <label className="bpm-form-label">Biller</label>
                        <select name="biller" className="bpm-input" value={formData.biller} onChange={handleInputChange}>
                            <option value="">Select Biller...</option>
                            <option value="Meralco">Meralco</option>
                            <option value="Maynilad">Maynilad</option>
                            <option value="PLDT">PLDT</option>
                            <option value="Globe">Globe</option>
                            <option value="Converge">Converge</option>
                            <option value="SSS">SSS</option>
                            <option value="Pag-IBIG">Pag-IBIG</option>
                        </select>
                    </div>
                    <div className="bpm-form-group">
                        <label className="bpm-form-label">Account Number</label>
                        <div style={{position: 'relative'}}>
                            <input type="text" name="acctNo" className="bpm-input" placeholder="Account No." value={formData.acctNo} onChange={handleInputChange} />
                            <CreditCard size={16} style={{position: 'absolute', right: '12px', top: '14px', color: '#64748b', pointerEvents: 'none'}}/>
                        </div>
                    </div>
                </div>
                <div className="bpm-form-row">
                    <div className="bpm-form-group">
                        <label className="bpm-form-label">Amount (₱)</label>
                        <input type="number" name="amount" className="bpm-input" placeholder="0.00" value={formData.amount} onChange={handleInputChange} />
                    </div>
                    <div className="bpm-form-group">
                        <label className="bpm-form-label">Due Date</label>
                        <input type="date" name="dueDate" className="bpm-input" value={formData.dueDate} onChange={handleInputChange} />
                    </div>
                </div>
              </div>
            </div>

            <div className="bpm-footer">
              <button className="bpm-btn bpm-btn-ghost" onClick={resetAndClose}>Cancel</button>
              <button className="bpm-btn bpm-btn-primary" onClick={handleSubmit}>
                <Receipt size={18} style={{marginRight: '8px'}}/> Process Payment
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="bpm-body" style={{textAlign: 'center', padding: '40px'}}>
             <CheckCircle size={60} color="#16a34a" style={{margin: '0 auto 20px'}} />
             <h2 className="bpm-title">Success!</h2>
             <p className="bpm-subtitle">Transaction for {formData.biller} has been recorded.</p>
             <button className="bpm-btn bpm-btn-primary bpm-btn-block" style={{marginTop: '20px'}} onClick={resetAndClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};