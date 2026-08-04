import { useState, useEffect } from 'react';
import './userSignup.css';

const UserSignup = ({ setAuthPage }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // States para sa Show/Hide Password
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

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
    }, [destinations.length]);

    const handleSignup = async () => {
        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (fullName && email && password && confirmPassword) {
                if (password !== confirmPassword) {
                    alert('❌ Passwords do not match!');
                    setIsLoading(false);
                    return;
                }
                alert(`✅ Account created for ${email}!`);
                setAuthPage('main');  
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

    // Icons for Eye (Show) and Eye Slash (Hide)
    const EyeIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    const EyeOffIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );

    return (
        <div className="signup-wrapper">
            <div className="signup-container">
                <div className="slideshow-panel">
                    <div className="slideshow-container">
                        {destinations.map((dest, index) => {
                            const isActive = index === currentSlide;
                            return (
                                <div 
                                    key={index}
                                    className={`slide-item slide-bg-${index} ${isActive ? 'active' : ''}`}
                                >
                                    <div className="slide-content-overlay">
                                        <h2 className="slide-title">{dest.name}</h2>
                                        <p className="slide-desc">{dest.description}</p>
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

                <div className="signup-form-wrapper">
                    <div className="form-content">
                        {/* Horizontal Header */}
                        <div className="logo-section">
                            <img
                                src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                                alt="WanderWave Logo"
                                className="logo-img"
                            />
                            
                            <div className="header-text-col title-col">
                                <span className="title-line">Create</span>
                                <span className="title-line">Account</span>
                            </div>

                            <div className="header-text-col subtitle-col">
                                <span className="subtitle-line">Join us for</span>
                                <span className="subtitle-line">amazing travel</span>
                                <span className="subtitle-line">experiences</span>
                            </div>
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

                            {/* Password Field */}
                            <div className="input-group">
                                <label htmlFor="password" className="input-label">Password</label>
                                <div className="password-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Create a password"
                                        className="input-field password-input"
                                        autoComplete="new-password"
                                    />
                                    <button 
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        tabIndex="-1"
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            {/* STRICT LOGIC: Confirm Password Only Shows If Password has content */}
                            {password.length > 0 && (
                                <div className="input-group fade-in-up">
                                    <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                                    <div className="password-wrapper">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Confirm your password"
                                            className="input-field password-input"
                                            autoComplete="new-password"
                                        />
                                        <button 
                                            type="button"
                                            className="toggle-password-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            tabIndex="-1"
                                        >
                                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>
                            )}

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
                            >
                                Log In
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSignup;