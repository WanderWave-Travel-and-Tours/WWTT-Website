import { useState, useEffect } from 'react';
import './UserLogin.css';

const UserAuth = ({ setAuthPage }) => {
    const [isSignup, setIsSignup] = useState(false); // Toggle between Login & Signup
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (isSignup) {
                if (!fullName || !email || !password || !confirmPassword) {
                    alert('Please fill in all fields.');
                    return;
                }
                if (password !== confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                }
                alert(`Account created successfully for ${email}!`);
            } else {
                if (!email || !password) {
                    alert('Please enter email and password.');
                    return;
                }
                alert(`Welcome back, ${email}!`);
            }

            // Back to main app
            if (setAuthPage) setAuthPage('main');
        } catch (err) {
            alert('Something went wrong. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) handleSubmit(e);
    };

    return (
        <div className="user-login-wrapper">
            <div className="user-login-container">
                {/* Left: Slideshow */}
                <div className="slideshow-panel">
                    <div className="slideshow-container">
                        {destinations.map((dest, index) => (
                            <div
                                key={index}
                                className={`slide-item ${currentSlide === index ? 'active' : ''}`}
                                style={{ backgroundImage: `url(${dest.image})` }}
                            >
                                <div className="slide-content-overlay">
                                    <h2 className="slide-title">{dest.name}</h2>
                                    <p className="slide-description">{dest.description}</p>
                                </div>
                            </div>
                        ))}
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

                {/* Right: Form (Login or Signup) */}
                <div className="login-panel">
                    <div className="login-form-wrapper">
                        <div className="logo-section">
                            <img
                                src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
                                alt="WanderWave Logo"
                                className="logo-img"
                            />
                            <h1 className="admin-title">
                                {isSignup ? 'Create Account' : 'Welcome Back!'} 
                            </h1>
                            <p className="admin-subtitle">
                                {isSignup 
                                    ? 'Join us for amazing travel deals!' 
                                    : 'Sign in to continue your journey'}
                            </p>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
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
                                    />
                                </div>
                            )}

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
                                />
                            </div>

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
                                />
                            </div>

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
                                    />
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Log In')}
                            </button>
                        </form>

                        <p className="switch-page-text">
                            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <span 
                                className="switch-page-link"
                                onClick={() => {
                                    setIsSignup(!isSignup);
                                    // Clear form when switching
                                    setFullName(''); setEmail(''); setPassword(''); setConfirmPassword('');
                                }}
                                style={{ cursor: 'pointer', fontWeight: '600' }}
                            >
                                {isSignup ? 'Log In' : 'Sign Up'}
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

export default UserAuth;