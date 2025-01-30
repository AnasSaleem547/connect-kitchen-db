


import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './RecipePage.css'; // Create a new CSS file for styling this page

function RecipePage() {
    const { recipeId } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likedRecipes, setLikedRecipes] = useState([]); // Stores liked recipes for the user
    const [likeCount, setLikeCount] = useState(0); // Stores the like count
    const [isLiked, setIsLiked] = useState(false); // Stores whether the user has liked the recipe
    const [creator, setCreator] = useState(null); // Stores the creator's info

    const navigate = useNavigate();
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    useEffect(() => {
        console.log('Recipe ID:', recipeId); // Log to check if the recipeId is correct
        const fetchData = async () => {
            try {
                // Fetch recipe details
                const recipeResponse = await fetch(`http://localhost:5000/api/recipe/${recipeId}`);
                if (!recipeResponse.ok) {
                    throw new Error('Failed to fetch recipe.');
                }
                const recipeData = await recipeResponse.json();
                setRecipe(recipeData);

                // Fetch ingredients for this recipe
                const ingredientsResponse = await fetch(`http://localhost:5000/api/ingredients/${recipeId}`);
                if (!ingredientsResponse.ok) {
                    throw new Error('Failed to fetch ingredients.');
                }
                const ingredientsData = await ingredientsResponse.json();
                setIngredients(ingredientsData);

                // Fetch comments for this recipe
                const commentsResponse = await fetch(`http://localhost:5000/api/comments/${recipeId}`);
                if (!commentsResponse.ok) {
                    throw new Error('Failed to fetch comments.');
                }
                const commentsData = await commentsResponse.json();
                setComments(commentsData);

                // Fetch like count for this recipe
                const likeCountResponse = await fetch(`http://localhost:5000/api/like-count/${recipeId}`);
                if (!likeCountResponse.ok) {
                    throw new Error('Failed to fetch like count.');
                }
                const likeCountData = await likeCountResponse.json();
                setLikeCount(likeCountData.count);

                // Fetch creator's info by recipe ID
                const creatorResponse = await fetch(`http://localhost:5000/api/creator-by-recipe/${recipeId}`);
                if (!creatorResponse.ok) {
                    throw new Error('Failed to fetch creator.');
                }
                const creatorData = await creatorResponse.json();
                setCreator(creatorData); // Store creator's details

                // Check if the logged-in user has liked this recipe
                if (loggedInUser) {
                    const checkLikeResponse = await fetch(`http://localhost:5000/api/check-like-status/${recipeId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: loggedInUser.user_id, recipe_id: recipeId })
                    });
                    if (!checkLikeResponse.ok) {
                        throw new Error('Failed to check like status.');
                    }
                    const checkLikeData = await checkLikeResponse.json();
                    setIsLiked(checkLikeData.isLiked); // Update like status
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [recipeId, loggedInUser]);

    const handleCommentChange = (e) => {
        setNewComment(e.target.value);
    };

    const addComment = async () => {
        if (!loggedInUser) {
            alert('Please log in to add comments.');
            return;
        }

        if (!newComment) {
            alert('Comment cannot be empty.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/add-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    user_id: loggedInUser.user_id,
                    recipe_id: recipeId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment.');
            }

            const addedComment = await response.json();
            setComments((prev) => [...prev, addedComment]);
            setNewComment(''); // Clear input after adding comment
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    const toggleLike = async () => {
        if (!loggedInUser) {
            alert('Please log in to like/unlike.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/like-recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: loggedInUser.user_id,
                    recipe_id: recipeId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to like/unlike the recipe.');
            }

            // Update the UI based on the new like status
            setIsLiked(!isLiked); // Toggle like status
            setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1); // Update like count based on the action
        } catch (err) {
            console.error('Error liking/unliking recipe:', err);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="recipe-page-container">
            <h1>{recipe.recipe_name}</h1>
            {recipe.image ? (
                <img
                    className="recipe-image"
                    src={`data:image/jpeg;base64,${recipe.image}`} 
                    alt={recipe.recipe_name}
                    style={{ width: '300px', height: '300px', objectFit: 'cover' }}
                />
            ) : (
                <p>No image available</p>
            )}
            <p><strong>Category:</strong> {recipe.category}</p>
            <p><strong>Created Date:</strong> {new Date(recipe.created_date).toLocaleDateString()}</p>
            <p>
                <strong>Creator:</strong> 
                {/* Link to creator's profile page */}
                <Link to={`/creator-profile/${creator?.user_id}`}>
                    {creator?.username}
                </Link>
            </p>
            
            <h3>Instructions:</h3>
            <p>{recipe.instructions}</p>
            <h3>Ingredients:</h3>
            <ul>
                {ingredients.map((ingredient) => (
                    <li key={ingredient.ingredient_id}>
                        {ingredient.ingredient_name} - {ingredient.quantity}
                    </li>
                ))}
            </ul>

            
            <button onClick={toggleLike} className="like-button">
                {isLiked ? 'Unlike' : 'Like'}
            </button>
            <p>Likes: {likeCount}</p> {/* Display the like count */}

            <h3>Comments:</h3>
            <ul>
                {comments.map((comment) => (
                    <li key={comment.comment_id}>
                        <strong>{comment.user_name}</strong>: {comment.content} ({new Date(comment.created_at).toLocaleString()})
                    </li>
                ))}
            </ul>

            <textarea
                value={newComment}
                onChange={handleCommentChange}
                placeholder="Add a comment..."
                className="comment-input"
            />
            <button onClick={addComment} className="add-comment-button">Add Comment</button>
        </div>
    );
}

export default RecipePage;
