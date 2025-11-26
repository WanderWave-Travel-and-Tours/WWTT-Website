import { useState, useEffect } from 'react';
import './UserLogin.css';

const UserLogin = ({ setPage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

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
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691186866f24d9c79e6027a0.jpg', 
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
        // Automatically advances the slideshow every 4.5 seconds
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % destinations.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [destinations.length]);

    const handleLogin = async () => {
        setIsLoading(true);

        try {
            // Simulate network request delay (1.5 seconds)
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (email && password) {
                // Successful dummy login
                alert(`✅ Welcome back! Logged in as ${email}`);
                // Ensure the parent component recognizes 'main'
                if (setPage) { 
                    setPage('main'); // Redirects to the 'main' page on success
                } else {
                    console.error("setPage prop is missing!");
                }
            } else {
                // Failed login
                alert('❌ Login Failed: Please fill in all fields.');
            }
        } catch (error) {
            // Error handling
            alert('Error connecting to server.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        // Allows pressing Enter to trigger login
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="user-login-wrapper">
            <div className="user-login-container">
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
                            <h1 className="admin-title">Welcome Back! ✈️</h1>
                            <p className="admin-subtitle">Sign in to continue your travel journey</p>
                        </div>

                        <div className="login-form">
                            <div className="input-group">
                                <label htmlFor="email" className="input-label">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your email address"
                                    className="input-field"
                                    autoComplete="email"
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="password" className="input-label">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your password"
                                    className="input-field"
                                    autoComplete="current-password"
                                />
                            </div>

                            <button 
                                onClick={handleLogin}
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging in...' : 'Log In'}
                            </button>
                        </div>

                        <p className="switch-page-text">
                            Don't have an account? 
                            <span 
                                className="switch-page-link" 
                                // FIX 1: Ensure the setPage prop is available before calling it
                                // FIX 2: Using 'signup' as the identifier for the UserSignup page.
                                onClick={() => setPage && setPage('signup')} 
                                role="button"
                                tabIndex="0"
                                aria-label="Create a new account"
                            >
                                Sign Up
                            </span>
                        </p>

                        <p className="footer-text">
                            © 2025 WanderWave Travel and Tours
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;