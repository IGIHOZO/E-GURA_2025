import React, { useEffect, useState } from 'react';
import { reviewAPI } from '../../services/api';
import ReviewForm from './ReviewForm';

const ReviewsSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const response = await reviewAPI.getProductReviews(productId);
        const items = response.data?.data || [];
        setReviews(items);
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const handleCreated = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id || review._id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span>{review.userName || 'Customer'}</span>
                    <span className="text-yellow-500">{'★'.repeat(review.rating || 0)}</span>
                  </div>
                  {review.createdAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 whitespace-pre-line">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Write a Review</h3>
        <ReviewForm productId={productId} onCreated={handleCreated} />
      </div>
    </div>
  );
};

export default ReviewsSection;
