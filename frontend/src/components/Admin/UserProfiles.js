import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfile.css';  // Ensure this CSS file exists and is correct

const UserProfiles = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch users from the backend without authentication
        const response = await axios.get('/admin/user-profiles');
        
        // Handle the response data
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setUsers(response.data.users);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching user profiles:', err);
        setError('Failed to fetch user profiles');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const deleteUser = async (userId) => {
    // Confirm before deletion
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    
    if (!confirmDelete) {
      return;
    }

    try {
      // Call backend API to delete user
      await axios.delete(`/admin/delete-user/${userId}`);
      
      // Remove the deleted user from the local state
      setUsers(users.filter(user => user.user_id !== userId));

      // Set success message
      setSuccessMessage('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  return (
    <div className="user-profiles-container">
      <h4>User Profiles</h4>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {users.length === 0 ? (
        <p>No user profiles found.</p>
      ) : (
        <div className="user-list">
          <div className="user-list-container">
            {users.map((user) => (
              <div key={user.user_id} className="user-item">
                <p><strong>User ID:</strong> {user.user_id}</p>
                <p><strong>Name:</strong> {user.username}</p>
                <p><strong>Gender:</strong> {user.gender}</p>
                <p><strong>Profile Picture:</strong> 
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                  ) : (
                    <span>No profile picture</span>
                  )}
                </p>
                <p><strong>Created At:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                <button onClick={() => deleteUser(user.user_id)} className="delete-button">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfiles;
