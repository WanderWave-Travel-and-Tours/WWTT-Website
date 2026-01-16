import { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import './UserLogin.css';
// Import icons (Added Eye and EyeOff)
import { Mail, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'; 
// Import Toast Hook
import { useToast } from '../toast/ToastManager';

const API_BASE_URL = 'http://localhost:5000/api/auth'; 

// --- OTP Verification Form Component (Modal) ---
const OtpVerificationForm = ({ email, onVerify, onCancel, onResend, isLoading }) => {
    const [otpCode, setOtpCode] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (otpCode.length === 6) {
            onVerify(otpCode);
        }
    };

    return (
        <div className="otp-modal-overlay">
            <div className="otp-modal">
                <div className="otp-modal-header">
                    <Mail size={24} color="#f57c00" />
                    <h2>Verify Email</h2>
                </div>
                <p className="otp-modal-text">
                    A 6-digit verification code has been sent to <strong>{email}</strong>.
                    Please enter the code to complete registration.
                </p>
                <form onSubmit={handleSubmit} className="otp-form">
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                        <label className="input-label">OTP Code</label>
                        <input
                            type="text"
                            placeholder="6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            maxLength="6"
                            className="input-field"
                            required
                            disabled={isLoading}
                            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
                        />
                    </div>
                    
                    <div className="otp-actions">
                        <button
                            type="submit"
                            className="login-button"
                            disabled={isLoading || otpCode.length !== 6}
                        >
                            {isLoading ? 'Verifying...' : 'Verify Account'}
                        </button>
                        <button
                            type="button"
                            className="switch-page-link"
                            onClick={onResend}
                            disabled={isLoading}
                            style={{marginTop: '10px', width: '100%', border: 'none', background: 'none', textDecoration: 'underline'}}
                        >
                            Resend OTP
                        </button>
                        <button
                            type="button"
                            className="login-button"
                            onClick={() => onCancel()}
                            disabled={isLoading}
                            style={{marginTop: '10px', background: '#e0e0e0', color: '#333', boxShadow: 'none'}}
                        >
                            Cancel Signup
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// --- END OTP Verification Form Component ---


const UserLogin = ({ setAuthPage, onLoginSuccess }) => {
    // Toast Hook
    const toast = useToast();

    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // NEW STATES for Password Visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    
    // We keep these state variables for logic, but we won't render them in UI anymore
    const [errorMessage, setErrorMessage] = useState(''); 
    const [otpError, setOtpError] = useState('');
    
    // NEW STATES for OTP flow
    const [isOtpFormVisible, setIsOtpFormVisible] = useState(false);
    const [tempEmailForVerification, setTempEmailForVerification] = useState('');

    const recaptchaRef = useRef(null);
    const RECAPTCHA_SITE_KEY = "6Le-qx0sAAAAAJX4nGcaXMjdL6gMU2GdmD9NJi0J";

    const destinations = [
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114eb2c3a1eaa1cc1c2ab8.jpg', name: 'Boracay', description: 'White Sand Paradise' },
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114e5dd1ba9573b1e7c604.jpg', name: 'Palawan', description: 'Paradise on Earth' },
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114ddbc3a1eac0761c08f1.jpg', name: 'Siargao', description: 'Surfing Capital' },
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114eedd1ba955b9ee7d600.jpg', name: 'Bohol', description: 'Chocolate Hills & Tarsiers' },
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691186866f24d9c79e6027a0.jpg', name: 'Bali, Indonesia', description: 'Island of Gods' },
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69171615ac7fad32f8341f78.jpg', name: 'Thailand', description: 'Land of Smiles' },
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6917166d01e5bcc9cd11a103.jpg', name: 'Japan', description: 'Land of the Rising Sun' },
        { image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911855175ec1e9b374b5977.jpg', name: 'Hanoi, Vietnam', description: 'Timeless Capital City' }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % destinations.length);
        }, 4500);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const savedUser = localStorage.getItem('wanderwave_user');
        if (savedUser && onLoginSuccess) {
            try {
                const userData = JSON.parse(savedUser);
                onLoginSuccess(userData);
            } catch (error) {
                localStorage.removeItem('wanderwave_user');
            }
        }
    }, [onLoginSuccess]);


    const resetForm = () => {
        setFullName('');
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        setOtpError('');
        setRecaptchaToken(null);
        setShowPassword(false); // Reset visibility
        setShowConfirmPassword(false); // Reset visibility
        if (recaptchaRef.current) {
            recaptchaRef.current.reset();
        }
    }


    const handleRecaptchaChange = (token) => {
        setRecaptchaToken(token);
    };
    
    // New function for Resend OTP API call
    const handleResendOtpFetch = async () => {
        setIsLoading(true);
        setOtpError('');
        
        try {
            const res = await fetch(`${API_BASE_URL}/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: tempEmailForVerification,
                }),
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success(data.message || 'New verification code has been sent!', 'OTP Resent');
            } else {
                const msg = data.message || 'Failed to resend code. Please try again.';
                setOtpError(msg);
                toast.error(msg, 'Resend Failed');
            }

        } catch (error) {
            console.error('Resend OTP fetch error:', error);
            const msg = 'Network error. Could not connect to the server.';
            setOtpError(msg);
            toast.error(msg, 'Connection Error');
        } finally {
            setIsLoading(false);
        }
    }


    // 1. Initial Signup Request (Send OTP)
    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!recaptchaToken) {
            const msg = 'Please complete the reCAPTCHA verification';
            setErrorMessage(msg);
            toast.warning(msg, 'Verification Required');
            return;
        }
        
        if (password !== confirmPassword) {
            const msg = 'Passwords do not match';
            setErrorMessage(msg);
            toast.error(msg, 'Validation Error');
            return;
        }

        setIsLoading(true);
        
        try {
            const res = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    username, 
                    password,
                    confirmPassword,
                    recaptchaToken,
                }),
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success(data.message, 'Step 1 Complete');
                setTempEmailForVerification(email);
                setIsOtpFormVisible(true);
                setPassword(''); 
                setConfirmPassword('');

            } else {
                const msg = data.message || 'Signup request failed. Please try again.';
                setErrorMessage(msg);
                toast.error(msg, 'Signup Failed');
            }

        } catch (error) {
            console.error('Signup fetch error:', error);
            const msg = 'Network error. Could not connect to the server.';
            setErrorMessage(msg);
            toast.error(msg, 'Network Error');
        } finally {
            setIsLoading(false);
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
                setRecaptchaToken(null);
            }
        }
    };
    
    // 2. OTP Verification and Final Registration
    const handleOtpVerification = async (otpCode) => {
        setIsLoading(true);
        setOtpError('');
        
        try {
            const res = await fetch(`${API_BASE_URL}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: tempEmailForVerification,
                    otp: otpCode,
                }),
            });

            const data = await res.json();
            
            if (res.ok) {
                toast.success(data.message || 'Account successfully created and verified!', 'Welcome!');
                setIsSignup(false); 
                setIsOtpFormVisible(false);
                setTempEmailForVerification('');
                resetForm();

            } else {
                const msg = data.message || 'OTP verification failed. Please try again.';
                setOtpError(msg);
                toast.error(msg, 'Verification Failed');
            }

        } catch (error) {
            console.error('OTP verification fetch error:', error);
            const msg = 'Network error. Could not connect to the server.';
            setOtpError(msg);
            toast.error(msg, 'Connection Error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = (e) => {
         handleResendOtpFetch();
    }
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (!recaptchaToken) {
            const msg = 'Please complete the reCAPTCHA verification';
            setErrorMessage(msg);
            toast.warning(msg, 'Verification Required');
            return;
        }

        setIsLoading(true);
        
        try {
            const res = await fetch(`http://localhost:5000/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, recaptchaToken }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Welcome back!', 'Login Successful');
                
                if (data.user && onLoginSuccess) {
                    localStorage.setItem('wanderwave_user', JSON.stringify(data.user));
                    onLoginSuccess(data.user);
                }
            } else {
                const msg = data.message || 'Login failed. Please check your credentials.';
                setErrorMessage(msg);
                toast.error(msg, 'Login Failed');
            }
        } catch (err) {
            const msg = 'Cannot connect to server. Please try again.';
            setErrorMessage(msg);
            toast.error(msg, 'Network Error');
        } finally {
            setIsLoading(false);
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
                setRecaptchaToken(null);
            }
        }
    };

    const handleSubmit = (e) => {
        if (isSignup) {
            handleSignup(e);
        } else {
            handleLogin(e);
        }
    };


    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) handleSubmit(e);
    };

    return (
        <div className="user-login-wrapper">
            
            {/* Conditional OTP Modal/Popup */}
            {isOtpFormVisible && (
                <OtpVerificationForm 
                    email={tempEmailForVerification}
                    onVerify={handleOtpVerification}
                    onCancel={() => {
                        setIsOtpFormVisible(false);
                        setIsLoading(false);
                        setOtpError('');
                        resetForm(); 
                    }}
                    onResend={handleResendOtp}
                    isLoading={isLoading}
                />
            )}
            
            <div className={`user-login-container ${isOtpFormVisible ? 'blur-background' : ''}`}>
                <div className="slideshow-panel">
                    <div className="slideshow-container">
                        {destinations.map((dest, index) => {
                            const isActive = index === currentSlide;
                            return (
                                <div
                                    key={index}
                                    className={`slide-item ${isActive ? 'active' : ''}`}
                                    style={{ backgroundImage: `url(${dest.image})` }}
                                >
                                    <div className="slide-content-overlay">
                                        <h2 className="slide-title">{dest.name}</h2>
                                        <p className="slide-description">{dest.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="slide-indicators">
                        {destinations.map((_, i) => (
                            <div
                                key={i}
                                className={`indicator-dot ${currentSlide === i ? 'active-dot' : ''}`}
                                onClick={() => setCurrentSlide(i)}
                            />
                        ))}
                    </div>
                </div>

                <div className="login-panel">
                    <div className="login-form-wrapper">
                        <div className="logo-section">
                            <img
                                src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                                alt="WanderWave Logo"
                                className="logo-img"
                            />
                            
                            <div className="header-text-col title-col">
                                <span className="title-line">{isSignup ? 'Create' : 'Welcome'}</span>
                                <span className="title-line">{isSignup ? 'Account' : 'Back'}</span>
                            </div>

                            <div className="header-text-col subtitle-col">
                                <span className="subtitle-line">{isSignup ? 'Join us for' : 'Sign in to'}</span>
                                <span className="subtitle-line">{isSignup ? 'amazing' : 'continue your'}</span>
                                <span className="subtitle-line">{isSignup ? 'travel deals' : 'journey'}</span>
                            </div>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            {/* Full Name */}
                            {isSignup && (
                                <div className="input-group">
                                    <label className="input-label">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Juan dela Cruz"
                                        className="input-field"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            )}

                            {/* Email */}
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="you@example.com"
                                    className="input-field"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            
                            {/* Username */}
                            {isSignup && (
                                <div className="input-group">
                                    <label className="input-label">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="juandelacruz123"
                                        className="input-field"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            )}

                            {/* Password - With Toggle */}
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="••••••••"
                                        className="input-field"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password - With Toggle */}
                            {isSignup && (
                                <div className="input-group">
                                    <label className="input-label">Confirm Password</label>
                                    <div className="password-wrapper">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="••••••••"
                                            className="input-field"
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="recaptcha-wrapper">
                                <ReCAPTCHA
                                    ref={recaptchaRef}
                                    sitekey={RECAPTCHA_SITE_KEY}
                                    onChange={handleRecaptchaChange}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="login-button"
                                disabled={isLoading || !recaptchaToken}
                            >
                                {isLoading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Log In')}
                            </button>
                        </form>

                        <p className="switch-page-text">
                            {isSignup ? 'Already have an account?' : "Don't have an account?"}
                            <span 
                                className="switch-page-link"
                                onClick={() => {
                                    setIsSignup(!isSignup);
                                    resetForm();
                                }}
                            >
                                {isSignup ? 'Log In' : 'Sign Up'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;