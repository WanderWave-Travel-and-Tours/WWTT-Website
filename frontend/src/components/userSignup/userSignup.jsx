import { useState, useEffect } from 'react';
import './userSignup.css';  // Create a CSS file or reuse UserLogin.css

const UserSignup = ({ setAuthPage }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const destinations = [  // Same as login for consistency
        { 
            image: 'https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/69114eb2c3a1eaa1cc1c2ab8.jpg', 
            name: 'Boracay', 
            description: 'White Sand Paradise' 
        },
        // ... (add all other destinations from your login code)
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % destinations.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [destinations.length]);

    const handleSignup = async () => {
        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (fullName && email && password && confirmPassword) {
                if (password !== confirmPassword) {
                    alert('❌ Passwords do not match!');
                    return;
                }
                alert(`✅ Account created for ${email}!`);
                setAuthPage('main');  // Redirect to main after success
            } else {
                alert('❌ Please fill in all fields.');
            }
        } catch (error) {
            alert('Error connecting to server.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSignup();
        }
    };

    return (
        <div className="user-signup-wrapper">  // Use similar class names or adjust CSS
            <div className="user-signup-container">
                <div className="slideshow-panel">
                    <div className="slideshow-container">
                        {destinations.map((dest, index) => {
                            const isActive = index === currentSlide;
                            return (
                                <div 
                                    key={index} 
                                    className={`slideshow-slide ${isActive ? 'active' : ''}`}
                                    style={{ backgroundImage: `url(${dest.image})` }}
                                >
                                    <div className="slide-overlay">
                                        <h2 className="slide-title">{dest.name}</h2>
                                        <p className="slide-desc">{dest.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="signup-form-wrapper">
                    <div className="logo-section">
                        <img
                            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                            alt="WanderWave Logo"
                            className="logo-img"
                        />
                        <h1 className="admin-title">Create Account ✈️</h1>
                        <p className="admin-subtitle">Join us for amazing travel experiences</p>
                    </div>

                    <div className="signup-form">
                        <div className="input-group">
                            <label htmlFor="fullName" className="input-label">Full Name</label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter your full name"
                                className="input-field"
                                autoComplete="name"
                            />
                        </div>
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
                                placeholder="Create a password"
                                className="input-field"
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Confirm your password"
                                className="input-field"
                                autoComplete="new-password"
                            />
                        </div>

                        <button 
                            onClick={handleSignup}
                            className="signup-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </div>

                    <p className="switch-page-text">
                        Already have an account? 
                        <span 
                            className="switch-page-link" 
                            onClick={() => setAuthPage('login')}
                            role="button"
                            tabIndex="0"
                            aria-label="Go to login"
                        >
                            Log In
                        </span>
                    </p>

                    <p className="footer-text">
                        © 2025 WanderWave Travel and Tours
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserSignup;