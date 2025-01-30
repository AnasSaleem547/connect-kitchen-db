import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddRecipe.css'; // Import the CSS file

function AddRecipe() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        recipe_name: '',
        image: null,
        created_date: '',
        instructions: '',
        category: '',
        ingredients: [],
        price: ''
    });
    const [newIngredient, setNewIngredient] = useState({ ingredient_name: '', quantity: '' });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    const handleIngredientChange = (e) => {
        const { name, value } = e.target;
        setNewIngredient({ ...newIngredient, [name]: value });
    };

    const addIngredient = () => {
        if (newIngredient.ingredient_name && newIngredient.quantity) {
            setFormData({
                ...formData,
                ingredients: [...formData.ingredients, newIngredient],
            });
            setNewIngredient({ ingredient_name: '', quantity: '' });
        } else {
            alert('Please fill out both ingredient name and quantity.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!loggedInUser) {
            alert('Please log in first.');
            navigate('/login');
            return;
        }

        const recipeData = new FormData();
        recipeData.append('recipe_name', formData.recipe_name);
        recipeData.append('image', formData.image);
        recipeData.append('created_date', formData.created_date);
        recipeData.append('instructions', formData.instructions);
        recipeData.append('category', formData.category);
        recipeData.append('user_id', loggedInUser.user_id);
        recipeData.append('price', formData.price);
        recipeData.append('ingredients', JSON.stringify(formData.ingredients));

        try {
            const response = await fetch('http://localhost:5000/api/add-recipe', {
                method: 'POST',
                body: recipeData,
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Recipe and ingredients added successfully!');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setError(data.error || 'Failed to add recipe.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="add-recipe-container">
            <div className="add-recipe-box">
                <h1>Add Recipe</h1>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Recipe Name:</label>
                        <input
                            type="text"
                            name="recipe_name"
                            value={formData.recipe_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label>Image:</label>
                        <input type="file" name="image" onChange={handleFileChange} required />
                    </div>
                    <div>
                        <label>Created Date:</label>
                        <input
                            type="date"
                            name="created_date"
                            value={formData.created_date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label>Instructions:</label>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label>Category:</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="" disabled>Select Category</option>
                            <option value="Desi">Desi</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Fast Food">Fast Food</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Italian">Italian</option>
                        </select>
                    </div>
                    <div>
                        <label>Price:</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="ingredients-container">
                        <h3>Ingredients</h3>
                        <div>
                            <input
                                type="text"
                                name="ingredient_name"
                                placeholder="Ingredient Name"
                                value={newIngredient.ingredient_name}
                                onChange={handleIngredientChange}
                            />
                            <input
                                type="text"
                                name="quantity"
                                placeholder="Quantity"
                                value={newIngredient.quantity}
                                onChange={handleIngredientChange}
                            />
                            <button type="button" onClick={addIngredient}>
                                Add Ingredient
                            </button>
                        </div>
                        <ul>
                            {formData.ingredients.map((ingredient, index) => (
                                <li key={index}>
                                    {ingredient.ingredient_name} - {ingredient.quantity}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>
    );
}

export default AddRecipe;
