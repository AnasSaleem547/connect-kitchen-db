import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserForm.css';

function UserForm() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        dob: '',
        gender: '',
        profilePicture: null,
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, profilePicture: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const formDataToSend = new FormData();
        for (const key in formData) {
            formDataToSend.append(key, formData[key]);
        }
    
        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                body: formDataToSend,
            });
    
            const data = await response.json();
    
            if (response.ok) {
                alert('User registered successfully!');
                navigate('/login'); // Redirect to login after registration
            } else {
                // Check if the error is related to the username conflict
                if (data.error && data.error === 'Username already exists!') {
                    alert('This username is already taken. Please choose a different one.');
                } else {
                    alert(data.error || 'Registration failed!');
                }
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    };
    
    

    return (
        <form className="user-form" onSubmit={handleSubmit}>
            <h2>Sign Up</h2>
            <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
            <input type="date" name="dob" onChange={handleChange} required />
            <select name="gender" onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
            <input type="file" name="profilePicture" accept="image/*" onChange={handleFileChange} required />
            <button type="submit">Register</button>
        </form>
    );
}

export default UserForm;
