import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../components/UserContext'; // Import the useUser hook
import './viewcart.css';



function ViewCart() {
    const { loggedInUser } = useUser(); // Use the loggedInUser from context
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const navigate = useNavigate();

    // Fetch cart details
    useEffect(() => {
        const fetchCartDetails = async () => {
            if (!loggedInUser) return;

            try {
                const response = await fetch(`http://localhost:5000/api/get-cart/${loggedInUser.user_id}`);
                const data = await response.json();
                setCartItems(data);

                // Calculate total amount
                const total = data.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                setCartTotal(total);
            } catch (err) {
                console.error('Failed to fetch cart details:', err);
            }
        };

        fetchCartDetails();
    }, [loggedInUser]);

    // Update cart quantity and individual item price
    const updateQuantity = async (productId, quantity) => {
        if (quantity <= 0) return; // Prevent quantity from being 0 or negative

        try {
            const response = await fetch(`http://localhost:5000/api/update-cart/${loggedInUser.user_id}/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity }),
            });

            if (response.ok) {
                const updatedItem = await response.json();

                // Update cartItems with new quantity and price from the updated item
                setCartItems((prevItems) => {
                    // Update the specific item with new quantity and price
                    const updatedCart = prevItems.map((item) =>
                        item.product_id === productId
                            ? { ...item, quantity: updatedItem.cartItem.quantity, price: updatedItem.cartItem.price }
                            : item
                    );

                    // Recalculate the total price after updating the cartItems
                    const newTotal = updatedCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    setCartTotal(newTotal);

                    return updatedCart;
                });
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (err) {
            console.error('Failed to update cart quantity:', err);
        }
    };

    // Remove item from cart
    const removeItemFromCart = async (productId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/remove-from-cart/${loggedInUser.user_id}/${productId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setCartItems((prevItems) => {
                    // Filter out the removed item
                    const updatedCart = prevItems.filter((item) => item.product_id !== productId);

                    // Recalculate the total price after the item is removed
                    const newTotal = updatedCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    setCartTotal(newTotal);

                    return updatedCart;
                });
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (err) {
            console.error('Failed to remove item from cart:', err);
        }
    };

    // Proceed to checkout
    const proceedToCheckout = () => {
        navigate('/checkout');
    };

    return (
        <div className="view-cart">
            <h2>Your Cart</h2>
            {cartItems.length > 0 ? (
                <div>
                    <ul>
                        {cartItems.map((item) => (
                            <li key={item.product_id} className="cart-item">
                                <strong>{item.name}</strong>
                                <div>Price: ${item.price}</div>
                                <div>
                                    Quantity: 
                                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                                    {item.quantity}
                                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                                </div>
                                <button onClick={() => removeItemFromCart(item.product_id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                    <p>Total: ${cartTotal}</p>
                    <button onClick={proceedToCheckout}>Proceed to Checkout</button>
                </div>
            ) : (
                <p>Your cart is empty.</p>
            )}
        </div>
    );
}

export default ViewCart;
