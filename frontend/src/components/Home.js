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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
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
                const recipesResponse = await fetch('http://localhost:5000/api/all-recipes');
                if (!recipesResponse.ok) {
                    throw new Error('Failed to fetch recipes.');
                }
                const allRecipes = await recipesResponse.json();
                setRecipes(allRecipes);

                const categoriesResponse = await fetch('http://localhost:5000/api/categories');
                if (!categoriesResponse.ok) {
                    throw new Error('Failed to fetch categories.');
                }
                const allCategories = await categoriesResponse.json();
                setCategories(allCategories);

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
                [recipe_id]: data,
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
            setNewComment((prev) => ({ ...prev, [recipe_id]: '' }));

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

            setLikedRecipes((prevLiked) =>
                prevLiked.includes(recipe_id)
                    ? prevLiked.filter((id) => id !== recipe_id)
                    : [...prevLiked, recipe_id]
            );

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
        <div className="home-page"> {/* Added unique class here */}
            

            <h1>All Recipes</h1>
            <input
                type="text"
                className="search-bar"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
                className="category-dropdown"
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

            <div className="recipes-container">
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe) => (
                        <div className="recipe-box" key={recipe.recipe_id}>
                            <Link to={`/recipe/${recipe.recipe_id}`}>
                                <h3>{recipe.recipe_name}</h3>
                                <p><strong>Category:</strong> {recipe.category}</p>
                                <p><strong>Created Date:</strong> {new Date(recipe.created_date).toLocaleDateString()}</p>
                                {recipe.image && (
                                    <img
                                        className="recipe-image"
                                        src={`data:image/jpeg;base64,${recipe.image}`}
                                        alt={recipe.recipe_name}
                                    />
                                )}
                            </Link>
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