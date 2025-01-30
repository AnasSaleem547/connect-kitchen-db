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
    const [quantity, setQuantity] = useState(1); // Track the quantity selected by the user
    const [cartMessage, setCartMessage] = useState(''); // Confirmation message after adding to cart
    const [address, setAddress] = useState('');
    const [checkoutReady, setCheckoutReady] = useState(false); // Whether the user is ready to proceed to checkout

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

    const addToCart = async () => {
        if (!loggedInUser) {
            alert('Please log in to add to cart.');
            return;
        }
    
        if (quantity <= 0) {
            alert('Quantity must be greater than 0.');
            return;
        }
    
        try {
            // Fetch product_id using recipe_id
            const productResponse = await fetch(`http://localhost:5000/api/get-product-by-recipe/${recipeId}`);
            if (!productResponse.ok) {
                throw new Error('Failed to fetch product information.');
            }
    
            const productData = await productResponse.json();
            const productId = productData.product_id; // Extract product_id from response
    
            if (!productId) {
                throw new Error('Product not found for this recipe.');
            }
    
            // Add the product to the cart
            const response = await fetch('http://localhost:5000/api/add-to-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: loggedInUser.user_id,
                    product_id: productId, // Use the fetched product_id
                    quantity: quantity,
                }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to add to cart.');
            }
    
            setCartMessage('Item added to cart successfully!');
        } catch (err) {
            console.error('Error adding to cart:', err.message || err);
        }
    };
    

    const proceedToCheckout = () => {
        setCheckoutReady(true);
    };

    const handleCheckout = async () => {
        if (!address) {
            alert('Please enter your address.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: loggedInUser.user_id,
                    address: address,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to place order.');
            }

            alert('Order placed successfully!');
            navigate('/orders'); // Navigate to the orders page after successful checkout
        } catch (err) {
            console.error('Error placing order:', err);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="recipe-page-container">
            <h1>{recipe.recipe_name}</h1>
            {/* Image block removed */}
            <p><strong>Category:</strong> {recipe.category}</p>
            <p><strong>Created Date:</strong> {new Date(recipe.created_date).toLocaleDateString()}</p>
            <p>
                <strong>Creator:</strong> 
                <Link to={`/creator-profile/${creator?.user_id}`}>
                    {creator ? creator.username : 'Loading...'}
                </Link>
            </p>
            
            <h3>Instructions:</h3>
            <p>{recipe.instructions}</p>
            <h3>Ingredients:</h3>
            <ul>
                {ingredients.map(ingredient => (
                    <li key={ingredient.ingredient_id}>{ingredient.ingredient_name}</li>
                ))}
            </ul>
            
            {/* Like Button */}
            <button onClick={toggleLike}>
                {isLiked ? 'Unlike' : 'Like'} ({likeCount} Likes)
            </button>
            
            {/* Add to Cart */}
            <div>
                <label>
                    Quantity:
                    <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        min="1" 
                    />
                </label>
                <button onClick={addToCart}>Add to Cart</button>
                {cartMessage && <p>{cartMessage}</p>}
            </div>
            
            {/* Checkout Section */}
            {checkoutReady ? (
                <div>
                    <h3>Checkout</h3>
                    <textarea
                        placeholder="Enter your address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                    <button onClick={handleCheckout}>Place Order</button>
                </div>
            ) : (
                <button onClick={proceedToCheckout}>Proceed to Checkout</button>
            )}

            {/* Comment Section */}
            <h3>Comments:</h3>
            <ul>
                {comments.map((comment, index) => (
                    <li key={index}>
                        <strong>{comment.user_name}</strong>: {comment.content}
                    </li>
                ))}
            </ul>
            <textarea 
                placeholder="Add a comment..." 
                value={newComment} 
                onChange={handleCommentChange} 
            />
            <button onClick={addComment}>Submit</button>
        </div>
    );
}

export default RecipePage;
