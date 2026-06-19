import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useToast } from '../toast/ToastManager';
import { Eye, EyeOff } from 'lucide-react'; // ✅ Add this import
import './login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // ✅ Password toggle state
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const recaptchaRef = useRef(null);
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();
    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    
    const destinations = [
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114eb2c3a1eaa1cc1c2ab8.jpg', 
            name: 'Boracay', 
            description: 'White Sand Paradise' 
        },
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114e5dd1ba9573b1e7c604.jpg', 
            name: 'Palawan', 
            description: 'Paradise on Earth' 
        },
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114ddbc3a1eac0761c08f1.jpg', 
            name: 'Siargao', 
            description: 'Surfing Capital' 
        },
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114eedd1ba955b9ee7d600.jpg', 
            name: 'Bohol', 
            description: 'Chocolate Hills & Tarsiers' 
        },
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69118686d1ba952108efbba4.jpg', 
            name: 'Bali, Indonesia', 
            description: 'Island of Gods' 
        },
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69171615ac7fad32f8341f78.jpg', 
            name: 'Thailand', 
            description: 'Land of Smiles' 
        },
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6917166d01e5bcc9cd11a103.jpg', 
            name: 'Japan', 
            description: 'Land of the Rising Sun' 
        },
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911855175ec1e9b374b5977.jpg', 
            name: 'Hanoi, Vietnam', 
            description: 'Timeless Capital City' 
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % destinations.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [destinations.length]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!recaptchaToken) {
            toast.warning('Please complete the reCAPTCHA verification', 'Verification Required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('https://wanderwaveph.onrender.com/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, recaptchaToken }),
            });

            const data = await response.json();

            if (data.status === 'ok') {
                localStorage.setItem('adminToken', data.token); 
                localStorage.setItem('adminData', JSON.stringify(data.data)); 
                
                console.log('🔑 Admin logged in:', {
                    email: data.data.email,
                    isMainAdmin: data.data.isMainAdmin
                });
                
                toast.success('Access Granted! Redirecting to dashboard...', 'Login Successful');
                
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                toast.error(data.message || 'Invalid credentials', 'Login Failed');
            }
        } catch (error) {
            toast.error('Unable to connect to server. Please try again.', 'Connection Error');
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
            if (recaptchaRef.current) recaptchaRef.current.reset();
            setRecaptchaToken(null);
        }
    };

    // ✅ Password toggle function
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
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
                        {destinations.map((_, index) => (
                            <div
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`indicator-dot ${currentSlide === index ? 'active-dot' : ''}`}
                                aria-label={`Go to slide ${index + 1}`}
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
                            <h1 className="admin-title">Admin Portal</h1>
                            <p className="admin-subtitle">Sign in to manage travel experiences</p>
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="input-group">
                                <label htmlFor="email" className="input-label">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="input-field"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            {/* ✅ Password field with toggle */}
                            <div className="input-group">
                                <label htmlFor="password" className="input-label">Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="input-field password-field"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="password-toggle-btn"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* ✅ Centered reCAPTCHA */}
                            <div className="recaptcha-wrapper">
                                <div className="recaptcha-inner">
                                    <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey={RECAPTCHA_SITE_KEY}
                                        onChange={(token) => setRecaptchaToken(token)}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging in...' : 'Log In'}
                            </button>
                        </form>

                        <p className="footer-text">
                            © 2025 WanderWave Travel and Tours
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;