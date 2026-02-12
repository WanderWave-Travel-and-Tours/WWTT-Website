import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import './AddAdmin.css';
import Sidebar from "../sidebar/sidebar";

const AddAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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
        'https://wanderwaveph.onrender.com/api/admin/create', 
        adminData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      alert('✅ Admin account created successfully!');
      
      navigate('/admins');

    } catch (error) {
      console.error('❌ Error creating admin:', error);
      
      if (error.response) {
        if (error.response.status === 409) {
          setErrors({ email: 'Email already exists' });
        } else if (error.response.data?.message) {
          alert(`❌ Error: ${error.response.data.message}`);
        } else {
          alert('❌ Failed to create admin account. Please try again.');
        }
      } else if (error.request) {
        alert('❌ Network error. Please check your connection and try again.');
      } else {
        alert('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (Object.values(formData).some(value => value.trim() !== '')) {
      const confirm = window.confirm('Are you sure you want to cancel? All changes will be lost.');
      if (confirm) {
        navigate('/admins');
      }
    } else {
      navigate('/admins');
    }
  };

  return (
    <div className="add-admin-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`add-admin-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="add-admin-container">
          
          {/* Header */}
          <header className="add-admin-header">
            <div className="add-admin-header-content">
              <button className="add-admin-back-btn" onClick={() => navigate('/admins')}>
                <ArrowLeft size={18} />
                Back to Admin Management
              </button>
              <h1 className="add-admin-title">ADD NEW ADMIN</h1>
              <p className="add-admin-subtitle">Create a new administrator account</p>
            </div>
          </header>

          {/* Form */}
          <form className="add-admin-form" onSubmit={handleSubmit}>
            
            {/* Section 1: Personal Information */}
            <div className="add-admin-section">
              <h2 className="add-admin-section-title">Personal Information</h2>
              
              <div className="add-admin-form-grid">
                {/* First Name */}
                <div className="add-admin-form-group">
                  <label className="add-admin-label">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className={`add-admin-input ${errors.firstName ? 'error' : ''}`}
                    placeholder="e.g. John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <span className="add-admin-error">{errors.firstName}</span>
                  )}
                </div>

                {/* Last Name */}
                <div className="add-admin-form-group">
                  <label className="add-admin-label">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className={`add-admin-input ${errors.lastName ? 'error' : ''}`}
                    placeholder="e.g. Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <span className="add-admin-error">{errors.lastName}</span>
                  )}
                </div>

                {/* Email */}
                <div className="add-admin-form-group full-width">
                  <label className="add-admin-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`add-admin-input ${errors.email ? 'error' : ''}`}
                    placeholder="e.g. john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.email && (
                    <span className="add-admin-error">{errors.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Account Credentials */}
            <div className="add-admin-section">
              <h2 className="add-admin-section-title">Account Credentials</h2>
              
              <div className="add-admin-form-grid">
                {/* Password */}
                <div className="add-admin-form-group">
                  <label className="add-admin-label">
                    Password *
                  </label>
                  <div className="add-admin-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`add-admin-input ${errors.password ? 'error' : ''}`}
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="add-admin-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="add-admin-error">{errors.password}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="add-admin-form-group">
                  <label className="add-admin-label">
                    Confirm Password *
                  </label>
                  <div className="add-admin-password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className={`add-admin-input ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="add-admin-toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="add-admin-error">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="add-admin-actions">
              <button
                type="button"
                className="add-admin-btn cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                <X size={18} />
                Cancel
              </button>
              <button
                type="submit"
                className="add-admin-btn submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="add-admin-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Admin Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddAdmin;