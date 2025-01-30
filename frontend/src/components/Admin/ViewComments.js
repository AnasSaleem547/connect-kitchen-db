import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ViewComments.css';  // Make sure this file exists for styling

const ViewComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Fetch comments from the backend
        const result = await axios.get('/admin/comments');
        
        // Handle the response
        if (result.data.error) {
          setError(result.data.error);
        } else {
          setComments(result.data.comments);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to fetch comments');
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  const deleteComment = async (commentId) => {
    // Confirmation before deletion
    const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
    
    if (!confirmDelete) {
      return;
    }

    try {
      // Call the backend to delete the comment
      await axios.delete(`/admin/delete-comment/${commentId}`);
      
      // Remove the deleted comment from the state
      setComments(comments.filter(comment => comment.comment_id !== commentId));

      // Show success message
      setSuccessMessage('Comment deleted successfully!');
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  return (
    <div className="comments-container">
      <h4>Comments</h4>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {comments.length === 0 ? (
        <p>No comments found.</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.comment_id} className="comment-item">
              <p><strong>Comment ID:</strong> {comment.comment_id}</p>
              <p><strong>User ID:</strong> {comment.user_id}</p>
              <p><strong>Recipe ID:</strong> {comment.recipe_id}</p>
              <p><strong>Content:</strong> {comment.content}</p>
              <p><strong>Created At:</strong> {new Date(comment.created_at).toLocaleDateString()}</p>
              <button onClick={() => deleteComment(comment.comment_id)} className="delete-button">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewComments;
