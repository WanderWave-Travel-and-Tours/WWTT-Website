// Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    // Move destinations outside or use useMemo to prevent re-creation
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

    const totalSlides = 11; // Hardcode para sure

    // Auto-slide effect - Fixed to properly cycle through all destinations
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 4000);
        
        return () => clearInterval(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.status === 'ok') {
                localStorage.setItem('adminToken', 'true'); 
                alert('✅ Access Granted!');
                navigate('/dashboard'); 
            } else {
                alert('❌ Login Failed: ' + data.message);
            }
        } catch (error) {
            alert('Error connecting to server.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                {/* Left Column - Slideshow */}
                <div className="slideshow-panel">
                    {destinations.map((dest, index) => (
                        <div
                            key={index}
                            className={`slide-item ${currentSlide === index ? 'active' : ''}`}
                            style={{ 
                                backgroundImage: `url(${dest.image})` 
                            }}
                        >
                            <div className="slide-content-overlay">
                                <h2 className="slide-title">{dest.name}</h2>
                                <p className="slide-description">{dest.description}</p>
                            </div>
                        </div>
                    ))}
                    
                    <div className="slide-indicators">
                        {destinations.map((_, index) => (
                            <div
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`indicator-dot ${currentSlide === index ? 'active-dot' : ''}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Column - Login Form */}
                <div className="login-panel">
                    <div className="login-form-wrapper">
                        <div className="logo-section">
                            <img 
                                src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                                alt="WanderWave Logo"
                                className="logo-img"
                            />
                            <h1 className="admin-title">Admin Portal</h1>
                            <p className="admin-subtitle">Sign in to manage your travel experiences</p>
                        </div>

                        <div className="login-form">
                            <div className="input-group">
                                <label className="input-label">Username</label>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <button 
                                onClick={handleLogin}
                                className="login-button"
                            >
                                Sign In
                            </button>
                        </div>

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