import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ShareIcon,
  HeartIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/blog/posts/${id}`);
        if (response.data.success) {
          setPost(response.data.post);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.metaDescription,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
          <Link to="/blog" className="text-purple-600 hover:text-purple-700 font-semibold">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Blog
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <img
            src={post.image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=600&fit=crop'}
            alt={post.title}
            className="w-full h-96 object-cover rounded-xl shadow-lg my-8"
          />
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          {/* Category & SEO Badge */}
          <div className="flex gap-3 mb-6">
            <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
              {post.category}
            </span>
            {post.seoScore && (
              <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                AI SEO Score: {post.seoScore}/100
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Description */}
          {post.metaDescription && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed italic border-l-4 border-purple-600 pl-4">
              {post.metaDescription}
            </p>
          )}

          {/* Post Meta */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              <span>{new Date(post.publishedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5" />
              <span>{post.views || 0} views</span>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-8">
            {post.content.split('\n').map((paragraph, index) => {
              if (paragraph.trim() === '') return null;
              
              // Handle headings
              if (paragraph.startsWith('# ')) {
                return <h2 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{paragraph.substring(2)}</h2>;
              }
              if (paragraph.startsWith('## ')) {
                return <h3 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{paragraph.substring(3)}</h3>;
              }
              if (paragraph.startsWith('### ')) {
                return <h4 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-2">{paragraph.substring(4)}</h4>;
              }
              
              // Handle bullet points
              if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                return (
                  <li key={index} className="ml-6 mb-2 text-gray-700 leading-relaxed">
                    {paragraph.substring(2)}
                  </li>
                );
              }
              
              // Regular paragraphs
              return (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Keywords */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Keywords:</h3>
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword, index) => (
                  <span key={index} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-purple-200">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Hashtags:</h3>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((hashtag, index) => (
                  <span key={index} className="text-blue-600 font-medium">
                    {hashtag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-8 border-t">
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all"
            >
              {liked ? (
                <HeartIconSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-600" />
              )}
              <span className="font-semibold">{liked ? 'Liked' : 'Like'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all"
            >
              <ShareIcon className="w-6 h-6" />
              <span className="font-semibold">Share</span>
            </button>
          </div>
        </article>

        {/* Related Articles Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Continue Reading</h2>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            View All Articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
