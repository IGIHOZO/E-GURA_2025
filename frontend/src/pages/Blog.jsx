import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch blog posts from API
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await axios.get('/api/blog/posts');
        if (response.data.success) {
          setBlogPosts(response.data.posts);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        // Fallback to empty array if API fails
        setBlogPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const defaultBlogPosts = [
    {
      id: 1,
      title: 'Top 10 Fashion Trends in Rwanda 2025',
      excerpt: 'Discover the latest fashion trends taking Rwanda by storm this year. From traditional wear to modern styles, explore what\'s hot in Kigali.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
      author: 'E-Gura Team',
      date: '2025-01-15',
      category: 'Fashion',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'How to Shop Smart Online: A Complete Guide',
      excerpt: 'Learn the best practices for online shopping in Rwanda. Tips on finding deals, ensuring product authenticity, and secure payments.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      author: 'Shopping Expert',
      date: '2025-01-10',
      category: 'Shopping Tips',
      readTime: '7 min read'
    },
    {
      id: 3,
      title: 'The Rise of E-Commerce in Rwanda',
      excerpt: 'Exploring the growth of online shopping in Rwanda and how it\'s transforming the retail landscape across East Africa.',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
      author: 'Market Insights',
      date: '2025-01-05',
      category: 'Business',
      readTime: '6 min read'
    },
    {
      id: 4,
      title: 'Best Electronics Deals This Month',
      excerpt: 'Check out the hottest electronics deals available this month. From smartphones to laptops, find amazing discounts.',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      author: 'Tech Reviewer',
      date: '2025-01-01',
      category: 'Electronics',
      readTime: '4 min read'
    },
    {
      id: 5,
      title: 'Styling Tips for the Modern Professional',
      excerpt: 'Look your best at work with these professional styling tips. Perfect for the office or business meetings.',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800',
      author: 'Style Expert',
      date: '2024-12-28',
      category: 'Fashion',
      readTime: '5 min read'
    },
    {
      id: 6,
      title: 'Home Decor Ideas on a Budget',
      excerpt: 'Transform your living space without breaking the bank. Creative and affordable home decor tips for every room.',
      image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800',
      author: 'Interior Designer',
      date: '2024-12-20',
      category: 'Home & Living',
      readTime: '8 min read'
    }
  ];

  // Combine API posts with defaults, prioritize API posts
  const allPosts = blogPosts.length > 0 ? blogPosts : defaultBlogPosts;

  const categories = ['All', 'Fashion', 'Shopping Tips', 'Electronics', 'Business', 'Home & Living', 'AI Generated'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.metaDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
                           post.category === selectedCategory ||
                           (selectedCategory === 'AI Generated' && post.seoScore);
    return matchesSearch && matchesCategory;
  });

  const featuredPost = allPosts[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">E-Gura Blog</h1>
          <p className="text-xl opacity-90">Stay updated with the latest trends, tips, and news</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-12 py-4 rounded-lg border-2 border-gray-300 focus:border-purple-600 focus:outline-none text-lg"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {selectedCategory === 'All' && !searchTerm && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Article</h2>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2 gap-0">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover"
              />
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(featuredPost.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <TagIcon className="w-4 h-4" />
                    {featuredPost.category}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{featuredPost.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserIcon className="w-5 h-5" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <Link
                    to={`/blog/${featuredPost.id}`}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Read More
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {searchTerm ? `Search Results (${filteredPosts.length})` : 'Latest Articles'}
          </h2>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading articles...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="relative overflow-hidden">
                    <img
                      src={post.image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800'}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {post.category}
                      </span>
                      {post.seoScore && (
                        <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <SparklesIcon className="w-3 h-3" />
                          AI {post.seoScore}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(post.publishedDate || post.date).toLocaleDateString()}
                      </span>
                      <span>{post.readTime || '5 min read'}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.metaDescription || post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <UserIcon className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <Link
                        to={`/blog/${post.id}`}
                        className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-1"
                      >
                        Read <ArrowRightIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <p className="text-gray-600 text-lg">No articles found matching your search.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="mt-4 text-purple-600 font-semibold hover:text-purple-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-xl mb-8 opacity-90">Get the latest articles delivered to your inbox</p>
          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:outline-none"
            />
            <button className="bg-white text-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
