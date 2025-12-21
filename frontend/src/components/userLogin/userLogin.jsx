import { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import toast, { Toaster } from 'react-hot-toast'; // Tama na ang import
import './userLogin.css';
// Import icons (assuming you have a dependency like lucide-react or similar)
import { Mail, Key, User, Lock, CheckCircle, XCircle } from 'lucide-react';
// --- Custom Toast Styles (based on your request) ---
const customErrorToastStyle = {
    style: { border: '1px solid #ef4444', color: '#ef4444' },
    iconTheme: { primary: '#ef4444', secondary: '#fff' },
};
// --- END Custom Toast Styles ---
const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com0/api/auth'; 

// --- OTP Verification Form Component (Modal) ---
const OtpVerificationForm = ({ email, onVerify, onCancel, onResend, isLoading, error }) => {
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

                    {error && <p className="error-message otp-error"><XCircle size={16}/> {error}</p>}

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
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // NEW STATES for OTP flow
    const [isOtpFormVisible, setIsOtpFormVisible] = useState(false);
    const [tempEmailForVerification, setTempEmailForVerification] = useState('');
    const [otpError, setOtpError] = useState('');


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
        setRecaptchaToken(null);
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
                    email: tempEmailForVerification, // Use the stored email
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // Success: New OTP sent
                toast.success(data.message || 'New verification code has been sent!', { position: 'top-center' });
            } else {
                // Error during resend request
                const errorMsg = data.message || 'Failed to resend code. Please try again.';
                setOtpError(errorMsg);
                toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
            }

        } catch (error) {
            console.error('Resend OTP fetch error:', error);
            const errorMsg = 'Network error. Could not connect to the server.';
            setOtpError(errorMsg);
            toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
        } finally {
            setIsLoading(false);
        }
    }


    // 1. Initial Signup Request (Send OTP) - Used when isSignup is true
    const handleSignup = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!recaptchaToken) {
            setErrorMessage('Please complete the reCAPTCHA verification');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
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
                // Success: OTP Sent. Show verification form.
                toast.success(data.message || 'Verification code sent to your email!', { position: 'top-center' });
                setTempEmailForVerification(email);
                setIsOtpFormVisible(true);
                // Clear password fields on the main form for security
                setPassword('');
                setConfirmPassword('');

            } else {
                // Error during initial signup/OTP request
                const errorMsg = data.message || 'Signup request failed. Please try again.';
                setErrorMessage(errorMsg);
                toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
            }

        } catch (error) {
            console.error('Signup fetch error:', error);
            const errorMsg = 'Network error. Could not connect to the server.';
            setErrorMessage(errorMsg);
            toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
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
                // Success: Account registered. Reset and switch to login page.
                toast.success(data.message || 'Account successfully created and verified! You may now log in.', { position: 'top-center' });

                // --- FIXED: Added delay before redirect/form reset ---
                setTimeout(() => {
                    setIsSignup(false);
                    setIsOtpFormVisible(false);
                    setTempEmailForVerification('');
                    resetForm(); // Clear all fields
                }, 1500); // 1.5 seconds delay

            } else {
                // Error during OTP verification/registration
                const errorMsg = data.message || 'OTP verification failed. Please try again.';
                setOtpError(errorMsg);
                toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
            }

        } catch (error) {
            console.error('OTP verification fetch error:', error);
            const errorMsg = 'Network error. Could not connect to the server.';
            setOtpError(errorMsg);
            toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP logic - calls the dedicated resend fetch function
    const handleResendOtp = (e) => {
         handleResendOtpFetch();
    }

    // Existing Login Logic (with localStorage.setItem for successful login)
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!recaptchaToken) {
            setErrorMessage('Please complete the reCAPTCHA verification');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`https://wanderwaveph-backend.onrender.com0/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, recaptchaToken }),
            });

            const data = await res.json();

            if (res.ok) {
                // Success Login Toast - Display this first
                toast.success(data.message || 'Welcome back! Login successful.', { position: 'top-center' });

                if (data.user && onLoginSuccess) {
                    // --- FIXED: Added delay before redirect/call onLoginSuccess ---
                    setTimeout(() => {
                        // Corrected localStorage usage and delayed onLoginSuccess call
                        localStorage.setItem('wanderwave_user', JSON.stringify(data.user));
                        onLoginSuccess(data.user);
                    }, 1500); // 1.5 seconds delay
                    // --- END FIXED ---
                }
            } else {
                const errorMsg = data.message || 'Login failed. Please check your credentials.';
                setErrorMessage(errorMsg);
                toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
            }
        } catch (err) {
            const errorMsg = 'Cannot connect to server. Please try again.';
            setErrorMessage(errorMsg);
            toast.error(errorMsg, { position: 'top-center', ...customErrorToastStyle });
        } finally {
            setIsLoading(false);
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
                setRecaptchaToken(null);
            }
        }
    };

    // Replaced original handleSubmit with this branching function
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

            {/* Toaster Component for notifications */}
            <Toaster position="top-center" reverseOrder={false} />

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
                    error={otpError}
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

                        {errorMessage && <p className="error-message general-error"><XCircle size={16}/> {errorMessage}</p>}

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


                            {/* Password */}
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="••••••••"
                                    className="input-field"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Confirm Password */}
                            {isSignup && (
                                <div className="input-group">
                                    <label className="input-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="••••••••"
                                        className="input-field"
                                        required
                                        disabled={isLoading}
                                    />
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