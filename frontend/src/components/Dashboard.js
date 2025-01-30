import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const [loggedInUser, setLoggedInUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (user) {
            setLoggedInUser(user);
        } else {
            alert('Please log in first.');
            navigate('/login');
        }
    }, [navigate]);

    const handleProfileClick = () => {
        if (loggedInUser) {
            navigate(`/profile/${loggedInUser.user_id}`);
        }
    };

    const handleAddRecipeClick = () => {
        navigate('/add-recipe');
    };

    const handleHomeClick = () => {
        navigate('/home'); // Navigate to the Home page
    };

    if (!loggedInUser) {
        return <p>Loading...</p>;
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Welcome to the Dashboard, {loggedInUser.username}!</h1>
            <p>This page will be designed further.</p>
            <button
                onClick={handleProfileClick}
                style={{ padding: '10px 20px', fontSize: '16px', marginTop: '20px', cursor: 'pointer' }}
            >
                Go to Profile
            </button>
            <button
                onClick={handleAddRecipeClick}
                style={{ padding: '10px 20px', fontSize: '16px', marginTop: '20px', marginLeft: '10px', cursor: 'pointer' }}
            >
                Add Recipe
            </button>
            <button
                onClick={handleHomeClick}
                style={{ padding: '10px 20px', fontSize: '16px', marginTop: '20px', marginLeft: '10px', cursor: 'pointer' }}
            >
                Home
            </button>
        </div>
    );
}

export default Dashboard;
