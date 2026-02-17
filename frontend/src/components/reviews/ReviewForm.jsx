import React, { useState } from 'react';
import { reviewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ReviewForm = ({ productId, onCreated }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId || !comment.trim()) return;

    const userId = user?.id || localStorage.getItem('userId');
    if (!userId) {
      setError('Please log in before submitting a review.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        productId,
        rating,
        comment: comment.trim(),
        userId
      };

      const response = await reviewAPI.create(payload);
      const newReview = response.data?.data || null;

      if (onCreated && newReview) {
        onCreated(newReview);
      }

      setComment('');
      setRating(5);
    } catch (err) {
      console.error('Error creating review:', err);
      const apiMessage = err.response?.data?.message;
      setError(apiMessage || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Your Rating:</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
        >
          {[5,4,3,2,1].map((value) => (
            <option key={value} value={value}>{value} ★</option>
          ))}
        </select>
      </div>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          rows={4}
        />
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-amber-600">
          You are writing as a guest. Login to have your review associated with your account.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !comment.trim()}
        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
