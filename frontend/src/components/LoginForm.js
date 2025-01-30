import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
    
        // Check for missing email or password
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
    
        try {
            console.log('Sending login request:', { email }); // Log email (not password for security)
    
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await response.json();
    
            // Handle response
            if (response.ok) {
                // Save logged-in user data in localStorage
                localStorage.setItem('loggedInUser', JSON.stringify(data.user));
    
                // Notify the user and redirect to the dashboard
                alert('Login successful!');
                navigate('/home');
            } else {
                // Handle invalid credentials or other errors
                console.error('Login failed:', data.error || 'Invalid credentials');
                alert(data.error || 'Invalid email or password. Please try again.');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('A network error occurred. Please check your connection and try again.');
        }
    };
    

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <h2>Login</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Login</button>
        </form>
    );
}

export default LoginForm;
