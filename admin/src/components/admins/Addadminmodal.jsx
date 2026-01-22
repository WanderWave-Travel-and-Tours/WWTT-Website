import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  Shield,
  UserPlus
} from 'lucide-react';
import './Addadminmodal.css';
import axios from 'axios';
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

const AddAdminModal = ({ isOpen, onClose, onAdminAdded }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  // Helper to trigger custom modal
  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken'); 
      const username = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      
      const adminData = {
        username: username,
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const response = await axios.post(
        'http://localhost:5000/api/admin/create', 
        adminData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'ok' || response.status === 200 || response.status === 201) {
        toast.success('Admin account created successfully');
        
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setErrors({});
        
        onAdminAdded();
        onClose();
      }
    } catch (error) {
      console.error('❌ Error creating admin:', error);
      if (error.response) {
        if (error.response.status === 409) {
          setErrors({ email: 'Email already exists' });
          toast.error('Registration failed: Email already exists');
        } else {
          toast.error(error.response.data?.message || 'Failed to create admin account');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    askConfirmation(
      "Confirm Registration",
      `Are you sure you want to create an admin account for ${formData.email}?`,
      () => performSubmit(),
      "primary"
    );
  };

  const handleClose = () => {
    if (Object.values(formData).some(value => value.trim() !== '')) {
      askConfirmation(
        "Discard Changes",
        "Are you sure you want to close? All progress will be lost.",
        () => {
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
          });
          setErrors({});
          onClose();
        },
        "danger"
      );
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="aam-overlay" onClick={handleClose}>
        <div className="aam-content" onClick={(e) => e.stopPropagation()}>
          
          {/* HEADER SECTION */}
          <div className="aam-header">
            <div className="aam-header-left">
              <div className="aam-header-icon">
                <Shield size={24} />
              </div>
              <div className="aam-header-text">
                <h2 className="aam-main-title">Create New Administrator</h2>
                <div className="aam-ref-tag">
                  REF: #{Date.now().toString(36).toUpperCase()} <span className="aam-dot">•</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
            
            <div className="aam-header-right">
              <div className="aam-status-pill">
                <CheckCircle size={16} />
                <div className="aam-status-text">
                  <span className="aam-status-label">READY</span>
                  <span className="aam-status-subtext">New account</span>
                </div>
              </div>
              <button className="aam-close-x" onClick={handleClose} type="button">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="aam-body">
            <form onSubmit={handleSubmit} id="add-admin-form">
              
              {/* PERSONAL INFORMATION SECTION */}
              <div className="aam-section-card">
                <div className="aam-section-header">
                  <div className="aam-section-header-left">
                    <CheckCircle size={18} className="aam-icon-green" />
                    <h3 className="aam-section-title">Personal Information</h3>
                  </div>
                  <span className="aam-section-badge">Step 1 of 2</span>
                </div>

                <div className="aam-form-grid">
                  <div className="aam-form-field">
                    <label className="aam-field-label">
                      <User size={14} />
                      <span>FIRST NAME</span>
                      <span className="aam-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      className={`aam-field-input ${errors.firstName ? 'error' : ''}`}
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.firstName && (
                      <span className="aam-field-error">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                        </svg>
                        {errors.firstName}
                      </span>
                    )}
                  </div>

                  <div className="aam-form-field">
                    <label className="aam-field-label">
                      <User size={14} />
                      <span>LAST NAME</span>
                      <span className="aam-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      className={`aam-field-input ${errors.lastName ? 'error' : ''}`}
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.lastName && (
                      <span className="aam-field-error">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                        </svg>
                        {errors.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACCOUNT CREDENTIALS SECTION */}
              <div className="aam-section-card">
                <div className="aam-section-header">
                  <div className="aam-section-header-left">
                    <CheckCircle size={18} className="aam-icon-green" />
                    <h3 className="aam-section-title">Account Credentials</h3>
                  </div>
                  <span className="aam-section-badge">Step 2 of 2</span>
                </div>

                <div className="aam-form-grid">
                  <div className="aam-form-field aam-full-width">
                    <label className="aam-field-label">
                      <Mail size={14} />
                      <span>EMAIL ADDRESS</span>
                      <span className="aam-required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`aam-field-input ${errors.email ? 'error' : ''}`}
                      placeholder="admin@wanderwave.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.email && (
                      <span className="aam-field-error">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                        </svg>
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="aam-form-field">
                    <label className="aam-field-label">
                      <Lock size={14} />
                      <span>PASSWORD</span>
                      <span className="aam-required">*</span>
                    </label>
                    <div className="aam-password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className={`aam-field-input ${errors.password ? 'error' : ''}`}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="aam-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="aam-field-error">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                        </svg>
                        {errors.password}
                      </span>
                    )}
                  </div>

                  <div className="aam-form-field">
                    <label className="aam-field-label">
                      <Lock size={14} />
                      <span>CONFIRM PASSWORD</span>
                      <span className="aam-required">*</span>
                    </label>
                    <div className="aam-password-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className={`aam-field-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="aam-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <span className="aam-field-error">
                        <svg viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                        </svg>
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>

                <div className="aam-info-box">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                  <p>Password must be at least 8 characters and contain uppercase, lowercase, and numbers</p>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="aam-footer">
            <button 
              className="aam-btn-cancel" 
              onClick={handleClose}
              type="button"
              disabled={loading}
            >
              <X size={16} />
              Cancel
            </button>
            <button 
              className="aam-btn-submit" 
              onClick={handleSubmit}
              disabled={loading}
              type="submit"
              form="add-admin-form"
            >
              {loading ? (
                <>
                  <div className="aam-btn-spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Administrator
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Component */}
      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default AddAdminModal;