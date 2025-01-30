import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../components/UserContext'; // Import the useUser hook


function CreatorProfile() {
    const { recipe_id } = useParams(); // Get the recipe_id from the URL
    const navigate = useNavigate();
    const [creatorData, setCreatorData] = useState(null);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false); // Track follow status
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Logged-in user data

    useEffect(() => {
        const fetchCreatorData = async () => {
            try {
                // Fetch creator data by recipe_id
                const response = await fetch(`http://localhost:5000/api/creator-by-recipe/${recipe_id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch creator data.');
                }

                const data = await response.json();
                setCreatorData(data);

                // Fetch follower count
                const followerResponse = await fetch(
                    `http://localhost:5000/api/follower-count/${data.user_id}`
                );
                if (!followerResponse.ok) {
                    throw new Error('Failed to fetch follower count.');
                }
                const followerData = await followerResponse.json();
                setFollowerCount(followerData.follower_count);

                // Fetch following count
                const followingResponse = await fetch(
                    `http://localhost:5000/api/following-count/${data.user_id}`
                );
                if (!followingResponse.ok) {
                    throw new Error('Failed to fetch following count.');
                }
                const followingData = await followingResponse.json();
                setFollowingCount(followingData.following_count);

                // Check if the logged-in user is following the creator
                if (loggedInUser) {
                    const followResponse = await fetch(
                        `http://localhost:5000/api/is-following/${loggedInUser.user_id}/${data.user_id}`
                    );
                    if (!followResponse.ok) {
                        throw new Error('Failed to check follow status.');
                    }
                    const followData = await followResponse.json();
                    setIsFollowing(followData.isFollowing);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching creator data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchCreatorData();
    }, [recipe_id, loggedInUser]);

    const toggleFollow = async () => {
        if (!loggedInUser) {
            alert('Please log in to follow users.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    follower_id: loggedInUser.user_id,
                    followed_id: creatorData.user_id,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to toggle follow status.');
            }

            const data = await response.json();
            console.log(data.message);

            // Update follow status
            setIsFollowing((prevState) => !prevState);

            // Update follower count
            setFollowerCount((prevCount) => (isFollowing ? prevCount - 1 : prevCount + 1));
        } catch (err) {
            console.error('Error toggling follow status:', err);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
            <h1>Creator Profile</h1>
            {creatorData.profile_picture ? (
                <img
                    src={`data:image/jpeg;base64,${creatorData.profile_picture}`}
                    alt={`${creatorData.username}'s Profile`}
                    style={{ width: '150px', height: '150px', borderRadius: '50%' }}
                />
            ) : (
                <p>No profile picture available.</p>
            )}
            <h2>{creatorData.username}</h2>
            <p>Email: {creatorData.email}</p>
            <p>Date of Birth: {new Date(creatorData.dob).toLocaleDateString()}</p>
            <p>Gender: {creatorData.gender}</p>
            <p><strong>Followers:</strong> {followerCount}</p>
            <p><strong>Following:</strong> {followingCount}</p>

            <button
                onClick={toggleFollow}
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: isFollowing ? '#ff4d4d' : '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                {isFollowing ? 'Unfollow' : 'Follow'}
            </button>

            <button
                onClick={() => navigate('/home')}
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#007BFF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                Back to Home
            </button>
        </div>
    );
}

export default CreatorProfile;
