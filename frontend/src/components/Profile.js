import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Profile() {
    const { user_id } = useParams();
    const [userData, setUserData] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [likedRecipes, setLikedRecipes] = useState([]);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')); // Get logged-in user

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user data
                const userResponse = await fetch(`http://localhost:5000/api/showdata/${user_id}`);
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user data.');
                }
                const user = await userResponse.json();
                setUserData(user);

                // Fetch recipes
                const recipesResponse = await fetch(`http://localhost:5000/api/recipes/${user_id}`);
                if (recipesResponse.ok) {
                    const recipes = await recipesResponse.json();
                    setRecipes(recipes);
                } else {
                    setRecipes([]);
                }

                // Fetch liked recipes for the logged-in user
                if (loggedInUser) {
                    const likesResponse = await fetch(
                        `http://localhost:5000/api/user-liked-recipes/${loggedInUser.user_id}`
                    );
                    if (likesResponse.ok) {
                        const liked = await likesResponse.json();
                        setLikedRecipes(liked);
                    }
                }

                // Fetch follower count
                const followerResponse = await fetch(`http://localhost:5000/api/follower-count/${user_id}`);
                if (!followerResponse.ok) {
                    throw new Error('Failed to fetch follower count.');
                }
                const followerData = await followerResponse.json();
                setFollowerCount(followerData.follower_count);

                // Fetch following count
                const followingResponse = await fetch(`http://localhost:5000/api/following-count/${user_id}`);
                if (!followingResponse.ok) {
                    throw new Error('Failed to fetch following count.');
                }
                const followingData = await followingResponse.json();
                setFollowingCount(followingData.following_count);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [user_id, loggedInUser]);

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
                    ? prevLiked.filter((id) => id !== recipe_id) // Unlike
                    : [...prevLiked, recipe_id] // Like
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div style={{ maxHeight: '100vh', overflowY: 'auto', padding: '20px', backgroundColor: '#f9f9f9' }}>
            <div style={{ margin: '0 auto', maxWidth: '800px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                <h1>User Profile</h1>
                {userData && (
                    <>
                        {userData.profile_picture ? (
                            <img
                                src={`data:image/jpeg;base64,${userData.profile_picture}`}
                                alt={`${userData.username}'s Profile`}
                                style={{ width: '150px', height: '150px', borderRadius: '50%' }}
                            />
                        ) : (
                            <p>No profile picture available.</p>
                        )}
                        <h2>{userData.username}</h2>
                        <p>Email: {userData.email}</p>
                        <p>Date of Birth: {userData.dob}</p>
                        <p>Gender: {userData.gender}</p>
                        <p><strong>Followers:</strong> {followerCount}</p>
                        <p><strong>Following:</strong> {followingCount}</p>
                    </>
                )}

                <div style={{ marginTop: '30px' }}>
                    <h2>Recipes</h2>
                    <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                        {recipes.length > 0 ? (
                            recipes.map((recipe) => (
                                <div
                                    key={recipe.recipe_id}
                                    style={{
                                        border: '1px solid #ccc',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        marginBottom: '10px',
                                        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    <h3 style={{ marginBottom: '10px' }}>{recipe.recipe_name}</h3>
                                    <p><strong>Category:</strong> {recipe.category}</p>
                                    <p>
                                        <strong>Created Date:</strong>{' '}
                                        {new Date(recipe.created_date).toLocaleDateString()}
                                    </p>
                                    <p>
                                        <strong>Instructions:</strong> {recipe.instructions}
                                    </p>
                                    {recipe.image && (
                                        <img
                                            src={`data:image/jpeg;base64,${recipe.image}`}
                                            alt={recipe.recipe_name}
                                            style={{
                                                width: '100%',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                marginBottom: '10px',
                                            }}
                                        />
                                    )}
                                    <p><strong>Total Likes:</strong> {recipe.total_likes}</p>
                                    <button
                                        onClick={() => toggleLike(recipe.recipe_id)}
                                        style={{
                                            marginTop: '10px',
                                            padding: '10px 20px',
                                            backgroundColor: likedRecipes.includes(recipe.recipe_id) ? '#ff4d4d' : '#ccc',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {likedRecipes.includes(recipe.recipe_id) ? 'Unlike' : 'Like'}
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
                                    {ingredients[recipe.recipe_id] && (
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
                            <p>This user has no recipes yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
