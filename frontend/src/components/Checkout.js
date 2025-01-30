import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../components/UserContext';
import './Checkout.css';

const Checkout = () => {
  const { loggedInUser } = useUser();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [address, setAddress] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
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
          setCartItems([]);
          setCartTotal(0);
        } else {
          setCartItems(data);
          const total = data.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          setCartTotal(total);
          setNewPrice(total); // Set initial price as the total price
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

  // Handle voucher code change
  const handleVoucherChange = (event) => {
    setVoucherCode(event.target.value);
  };

  // Apply the voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode) return;

    try {
      const response = await fetch('http://localhost:5000/api/apply-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_code: voucherCode,
          total_price: cartTotal,
        }),
      });
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setVoucherDiscount(data.discount);  // Update the discount applied
        setNewPrice(cartTotal - (cartTotal * data.discount / 100));  // Update the new price
        alert(`Voucher applied! Discount: ${data.discount}%`);
      }
    } catch (err) {
      console.error('Failed to apply voucher:', err);
    }
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: loggedInUser.user_id,
                address,
                total_price: newPrice,  // Send the updated price after voucher discount
            }),
        });

        const result = await response.json();
        if (response.ok) {
            alert('Checkout successful!');
            navigate('/home');
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

  // Handle cancel action
  const handleCancel = () => {
    navigate('/viewcart'); // Navigate back to the cart page or previous page
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
            <p><strong>Discount: {voucherDiscount}%</strong></p>
            <p><strong>New Price: ${newPrice}</strong></p>
          </div>

          <div className="voucher-field">
            <label htmlFor="voucher">Voucher Code</label>
            <input
              type="text"
              id="voucher"
              value={voucherCode}
              onChange={handleVoucherChange}
              placeholder="Enter voucher code"
            />
            <button onClick={handleApplyVoucher}>Apply</button>
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
              <button type="button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Checkout;
