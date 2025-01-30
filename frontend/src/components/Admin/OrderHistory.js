import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await axios.get('/admin/order-history');
        
        // Handle case where no orders exist
        if (result.data.error) {
          setError(result.data.error);
        } else {
          setOrders(result.data.orders);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="order-history-container">
      <h4>Order History</h4>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.order_id} className="order-item">
              <p><strong>Order ID:</strong> {order.order_id}</p>
              <p><strong>Total Price:</strong> ${order.total_price}</p>
              <p><strong>Address:</strong> {order.address}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>User ID:</strong> {order.user_id}</p>
              <p><strong>User Name:</strong> {order.username}</p>
              <p><strong>Created At:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
