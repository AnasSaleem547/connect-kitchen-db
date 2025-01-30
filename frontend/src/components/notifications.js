
import React, { useEffect, useState } from 'react'; 
import { useUser } from '../components/UserContext';
import './Notifications.css';  // CSS for styling notifications

const Notifications = () => {
  const { loggedInUser } = useUser();  // Access logged-in user from context
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications for the logged-in creator
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!loggedInUser) return;

      try {
        const response = await fetch(`http://localhost:5000/api/notifications/${loggedInUser.user_id}`);
        const data = await response.json();

        if (data.error) {
          console.error('Error fetching notifications:', data.error);
        } else {
          setNotifications(data.notifications);  // Update with fetched data
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, [loggedInUser]);

  // Handle accept/reject action
  const handleAction = async (orderId, action) => {
    try {
      const response = await fetch('http://localhost:5000/api/notification-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });

      const data = await response.json();
      if (data.success) {
        // Remove the notification from the list after action
        setNotifications(prev => prev.filter(notif => notif.order_id !== orderId));
        alert(`${action === 'accept' ? 'Order Accepted' : 'Order Rejected'}`);
      } else {
        alert('Something went wrong.');
      }
    } catch (err) {
      console.error('Error processing action:', err);
    }
  };

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No new orders to review.</p>
      ) : (
        <ul>
          {notifications.map((notif) => (
            <li key={notif.order_id}>
              <div className="order-details">
                <p><strong>Order ID:</strong> {notif.order_id}</p>
                <p><strong>Address:</strong> {notif.address}</p>
                <p><strong>Total Price:</strong> ${notif.total_price}</p>
                <p><strong>Status:</strong> {notif.order_status}</p>
                <p><strong>Created At:</strong> {new Date(notif.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => handleAction(notif.order_id, 'accept')}>Accept</button>
              <button onClick={() => handleAction(notif.order_id, 'reject')}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
