import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
    const navigate = useNavigate();

    return (

        <div className="landing-container">
            
            <div className="landing-content">
                <h1>Welcome to Connect Kitchen</h1>
                <p>Your one-stop solution for kitchen management and recipes.</p>
                <div className="landing-buttons">
                    <button onClick={() => navigate('/login')} className="btn">Login</button>
                    <button onClick={() => navigate('/signup')} className="btn">Sign Up</button>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;
