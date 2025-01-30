import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    const [recipes, setRecipes] = useState([]);
    const [likedRecipes, setLikedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ingredients, setIngredients] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [searchTerm, setSearchTerm] = useState(''); // Search bar state
    const [selectedCategory, setSelectedCategory] = useState(''); // Selected category for filtering
    const [categories, setCategories] = useState([]); // List of available categories
    const navigate = useNavigate();

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // Navigate to add recipe page
    const handleAddRecipe = () => {
        navigate('/add-recipe');
    };

    // Navigate to edit profile page
    const handleEditProfile = () => {
        navigate(`/edit-profile/${loggedInUser.user_id}`);
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        navigate('/login');
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all recipes
                const recipesResponse = await fetch('http://localhost:5000/api/all-recipes');
                if (!recipesResponse.ok) {
                    throw new Error('Failed to fetch recipes.');
                }
                const allRecipes = await recipesResponse.json();
                setRecipes(allRecipes);

                // Fetch categories
                const categoriesResponse = await fetch('http://localhost:5000/api/categories');
                if (!categoriesResponse.ok) {
                    throw new Error('Failed to fetch categories.');
                }
                const allCategories = await categoriesResponse.json();
                setCategories(allCategories);

                // Fetch liked recipes for the logged-in user
                if (loggedInUser) {
                    const likesResponse = await fetch(
                        `http://localhost:5000/api/user-liked-recipes/${loggedInUser.user_id}`
                    );
                    if (!likesResponse.ok) {
                        throw new Error('Failed to fetch liked recipes.');
                    }
                    const liked = await likesResponse.json();
                    setLikedRecipes(liked);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [loggedInUser]);

    const filteredRecipes = recipes.filter((recipe) => {
        const matchesSearch = recipe.recipe_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? recipe.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const fetchIngredients = async (recipe_id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/ingredients/${recipe_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ingredients.');
            }
            const data = await response.json();
            setIngredients((prev) => ({
                ...prev,
                [recipe_id]: data, // Store ingredients per recipe
            }));
        } catch (err) {
            console.error('Error fetching ingredients:', err);
        }
    };

    const fetchComments = async (recipe_id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/comments/${recipe_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments.');
            }
            const data = await response.json();
            setComments((prev) => ({
                ...prev,
                [recipe_id]: data,
            }));
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const addComment = async (recipe_id) => {
        if (!loggedInUser) {
            alert('Please log in to add comments.');
            return;
        }

        if (!newComment[recipe_id]) {
            alert('Comment cannot be empty.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/add-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment[recipe_id],
                    user_id: loggedInUser.user_id,
                    recipe_id: recipe_id,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment.');
            }

            const addedComment = await response.json();
            setComments((prev) => ({
                ...prev,
                [recipe_id]: [...(prev[recipe_id] || []), addedComment],
            }));
            setNewComment((prev) => ({ ...prev, [recipe_id]: '' })); // Clear input

            // Update comment count locally
            setRecipes((prevRecipes) =>
                prevRecipes.map((recipe) =>
                    recipe.recipe_id === recipe_id
                        ? { ...recipe, total_comments: recipe.total_comments + 1 }
                        : recipe
                )
            );
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    const handleCommentChange = (recipe_id, content) => {
        setNewComment((prev) => ({ ...prev, [recipe_id]: content }));
    };

    const toggleLike = async (recipe_id) => {
        if (!loggedInUser) {
            alert('Please log in to like recipes.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/like-recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: loggedInUser.user_id, recipe_id }),
            });

            if (!response.ok) {
                throw new Error('Failed to toggle like.');
            }

            const data = await response.json();
            console.log(data.message);

            // Update the local like state
            setLikedRecipes((prevLiked) =>
                prevLiked.includes(recipe_id)
                    ? prevLiked.filter((id) => id !== recipe_id)
                    : [...prevLiked, recipe_id]
            );

            // Update total likes in recipes state
            setRecipes((prevRecipes) =>
                prevRecipes.map((recipe) =>
                    recipe.recipe_id === recipe_id
                        ? {
                              ...recipe,
                              total_likes: likedRecipes.includes(recipe.recipe_id)
                                  ? recipe.total_likes - 1
                                  : recipe.total_likes + 1,
                          }
                        : recipe
                )
            );
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

    const viewCreatorProfileByRecipeId = (recipe_id) => {
        navigate(`/creator-profile/${recipe_id}`);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className='home-container'>

             {/* Navbar */}
            <nav className="navbar">
                {/* Logo placeholder */}
                <div className="navbar-logo">
                    <img src="/uploads/logo.jpeg" alt="Logo" />
                </div>

                <button className="navbar-button" onClick={handleAddRecipe}>Add Recipe</button>
                <button className="navbar-button" onClick={handleEditProfile}>Edit Profile</button>
                <button className="navbar-button" onClick={handleLogout}>Logout</button>
            </nav>

            <h1>All Recipes</h1>
            <input
                type="text"
                className='search-bar'
                placeholder='Search recipes...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
                className='category-dropdown'
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="">All Categories</option>
                {categories.map((category) => (
                    <option key={category} value={category}>
                        {category}
                    </option>
                ))}
            </select>
            <div
                className='recipes-container'
            >
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe) => (
                        <div
                            className='recipe-box'
                            key={recipe.recipe_id}
                        >
                            <h3>{recipe.recipe_name}</h3>
                            <p><strong>Category:</strong> {recipe.category}</p>
                            <p><strong>Created Date:</strong> {new Date(recipe.created_date).toLocaleDateString()}</p>
                            <p><strong>Instructions:</strong> {recipe.instructions}</p>
                            <p><strong>Creator:</strong> {recipe.creator}</p>
                            {recipe.image && (
                                <img
                                    className='recipe-image'
                                    src={`data:image/jpeg;base64,${recipe.image}`}
                                    alt={recipe.recipe_name}
                                />
                            )}
                            <p><strong>Total Likes:</strong> {recipe.total_likes}</p>
                            <p><strong>Total Comments:</strong> {recipe.total_comments}</p>
                            <button
                                className={`button like-button ${
                                    likedRecipes.includes(recipe.recipe_id) ? 'liked' : ''
                                }`}
                                onClick={() => toggleLike(recipe.recipe_id)}
                            >
                                {likedRecipes.includes(recipe.recipe_id) ? 'Unlike' : 'Like'}
                            </button>
                            <button
                                onClick={() => viewCreatorProfileByRecipeId(recipe.recipe_id)}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    backgroundColor: '#4CAF50',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                View Creator Profile
                            </button>
                            <button
                                onClick={() => fetchIngredients(recipe.recipe_id)}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    backgroundColor: '#007BFF',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Show Ingredients
                            </button>
                            {ingredients[recipe.recipe_id] && ingredients[recipe.recipe_id].length > 0 && (
                                <div style={{ marginTop: '10px', textAlign: 'left' }}>
                                    <h4>Ingredients:</h4>
                                    <ul>
                                        {ingredients[recipe.recipe_id].map((ingredient) => (
                                            <li key={ingredient.ingredient_id}>
                                                {ingredient.ingredient_name} - {ingredient.quantity}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <button
                                onClick={() => fetchComments(recipe.recipe_id)}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    backgroundColor: '#6C757D',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Show Comments
                            </button>
                            {comments[recipe.recipe_id] && (
                                <div style={{ marginTop: '10px', textAlign: 'left' }}>
                                    <h4>Comments:</h4>
                                    <ul>
                                        {comments[recipe.recipe_id].map((comment) => (
                                            <li key={comment.comment_id}>
                                                <strong>{comment.user_name}</strong>: {comment.content} (
                                                {new Date(comment.created_at).toLocaleString()})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <textarea
                                value={newComment[recipe.recipe_id] || ''}
                                onChange={(e) => handleCommentChange(recipe.recipe_id, e.target.value)}
                                placeholder="Add a comment..."
                                style={{
                                    marginTop: '10px',
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc',
                                }}
                            />
                            <button
                                onClick={() => addComment(recipe.recipe_id)}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    backgroundColor: '#28A745',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Add Comment
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No recipes available.</p>
                )}
            </div>
        </div>
    );
}

export default Home;