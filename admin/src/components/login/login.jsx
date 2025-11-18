import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import './Login.css'; // Dito natin in-import yung CSS

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // 2. Initialize hook

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
                // 3. I-save ang "token" sa localStorage (parang ID pass)
                localStorage.setItem('adminToken', 'true'); 
                
                alert('✅ Access Granted!');
                
                // 4. Ilipat sa Dashboard
                navigate('/dashboard'); 
            } else {
                alert('❌ Login Failed: ' + data.message);
            }
        } catch (error) {
            alert('Error connecting to server.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Portal 🔒</h2>
                
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="login-input"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="login-button">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;