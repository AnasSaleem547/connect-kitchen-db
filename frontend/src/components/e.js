import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../components/UserContext'; // Import the useUser hook
import './Checkout.css';  // Import the CSS for Checkout component


function Checkout() {
    const { loggedInUser } = useUser(); // Access logged-in user from context
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Fetch cart details for the user
    useEffect(() => {
        const fetchCartDetails = async () => {
            if (!loggedInUser) return;

            try {
                const response = await fetch(`http://localhost:5000/api/get-cart/${loggedInUser.user_id}`);
                const data = await response.json();

                if (data.error) {
                    // Handle empty cart
                    setCartItems([]);
                    setCartTotal(0);
                } else {
                    setCartItems(data);

                    // Calculate total
                    const total = data.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                    setCartTotal(total);
                }
            } catch (err) {
                console.error('Failed to fetch cart details:', err);
            }
        };

        fetchCartDetails();
    }, [loggedInUser]);

    // Handle address change
    const handleAddressChange = (event) => {
        setAddress(event.target.value);
    };

    // Handle checkout submission
    const handleCheckout = async (event) => {
        event.preventDefault();

        if (!address) {
            alert('Please enter a shipping address.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:5000/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: loggedInUser.user_id,
                    address: address,
                }),
            });

            const result = await response.json();
            if (response.ok) {
                alert('Checkout successful!');
                navigate('/order-success'); // Redirect to order success page
            } else {
                alert(result.error || 'Something went wrong during checkout.');
            }
        } catch (err) {
            console.error('Error during checkout:', err);
            alert('Failed to complete checkout. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="checkout">
            <h2>Checkout</h2>
            
            {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div>
                    <div className="cart-summary">
                        <h3>Your Cart</h3>
                        <ul>
                            {cartItems.map((item) => (
                                <li key={item.product_id}>
                                    <strong>{item.name}</strong> - ${item.price} x {item.quantity}
                                </li>
                            ))}
                        </ul>
                        <p><strong>Total: ${cartTotal}</strong></p>
                    </div>

                    <form onSubmit={handleCheckout}>
                        <div className="address-field">
                            <label htmlFor="address">Shipping Address</label>
                            <textarea
                                id="address"
                                value={address}
                                onChange={handleAddressChange}
                                placeholder="Enter your shipping address"
                                required
                            />
                        </div>

                        <div className="checkout-actions">
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : 'Complete Checkout'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Checkout;
