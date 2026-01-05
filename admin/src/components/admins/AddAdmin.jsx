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
  Check,
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
        'http://localhost:5000/api/admin/create', 
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
        navigate('/admin/manage-admins');
      }
    } else {
      navigate('/admins');
    }
  };

  return (
    <div className="add-admin-wrapper">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <div className={`add-admin-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="add-admin-container">
          <div className="add-admin-header">
            <button className="back-btn" onClick={() => navigate('/admin/manage-admins')}>
              <ArrowLeft size={20} />
              Back to Admin Management
            </button>
            
            <div className="header-content">
              <div className="header-icon">
                <UserPlus size={24} />
              </div>
              <div>
                <h1 className="page-title">Add New Admin</h1>
                <p className="page-subtitle">Create a new administrator account</p>
              </div>
            </div>
          </div>

          <form className="add-admin-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>
              
              <div className="form-group">
                <label className="form-label">
                  <User size={18} />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.firstName && (
                  <span className="error-message">{errors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={18} />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.lastName && (
                  <span className="error-message">{errors.lastName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={18} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Account Credentials</h2>
              
              <div className="form-group">
                <label className="form-label">
                  <Lock size={18} />
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter password (min. 8 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={18} />
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                <X size={18} />
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Create Admin Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAdmin;