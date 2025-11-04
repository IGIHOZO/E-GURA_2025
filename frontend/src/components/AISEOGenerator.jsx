import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RocketLaunchIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  HashtagIcon,
  LightBulbIcon,
  ChatBubbleBottomCenterTextIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AISEOGenerator = () => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const topics = [
    {
      id: 'product-daily',
      title: 'Daily Product Feature',
      icon: FireIcon,
      description: 'Highlight a product of the day with SEO-optimized content',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'how-to-shop',
      title: 'Shopping Guide',
      icon: LightBulbIcon,
      description: 'Create guides on how to shop on E-Gura',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'trending-products',
      title: 'Trending Products',
      icon: TrophyIcon,
      description: 'Showcase what\'s hot in Kigali',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'best-deals',
      title: 'Best Deals',
      icon: SparklesIcon,
      description: 'Feature top deals and discounts',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'kigali-trends',
      title: 'Kigali E-Commerce Trends',
      icon: GlobeAltIcon,
      description: 'Latest shopping trends in Kigali',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'product-review',
      title: 'Product Reviews',
      icon: ChatBubbleBottomCenterTextIcon,
      description: 'Detailed product reviews and comparisons',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const generateContent = async () => {
    if (!selectedTopic) {
      alert('Please select a topic first!');
      return;
    }

    setGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await axios.post('/api/seo/generate', {
        topic: selectedTopic
      });

      if (response.data.success) {
        setGeneratedContent(response.data.content);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllContent = () => {
    if (!generatedContent) return;

    const fullContent = `
${generatedContent.title}

${generatedContent.metaDescription}

${generatedContent.content}

Keywords: ${generatedContent.keywords.join(', ')}

Hashtags: ${generatedContent.hashtags.join(' ')}

SEO Score: ${generatedContent.seoScore}/100
    `.trim();

    copyToClipboard(fullContent);
  };

  const publishToBlog = async () => {
    if (!generatedContent) return;

    setPublishing(true);
    setPublished(false);

    try {
      const response = await axios.post('/api/blog/posts', {
        title: generatedContent.title,
        content: generatedContent.content,
        metaDescription: generatedContent.metaDescription,
        keywords: generatedContent.keywords,
        hashtags: generatedContent.hashtags,
        category: selectedTopic,
        seoScore: generatedContent.seoScore
      });

      if (response.data.success) {
        setPublished(true);
        alert('✅ Article published to blog successfully!');
        setTimeout(() => setPublished(false), 3000);
      }
    } catch (error) {
      console.error('Error publishing to blog:', error);
      alert('❌ Failed to publish article. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <RocketLaunchIcon className="w-12 h-12 text-purple-600" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI SEO Content Generator
              </h1>
              <p className="text-gray-600 mt-2">
                Generate top-ranked SEO content for E-Gura | Optimized for ChatGPT, Google AI, Bing & All Search Engines
              </p>
            </div>
          </div>
        </motion.div>

        {/* Topic Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            Select Content Topic
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <motion.button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedTopic === topic.id
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${topic.color} rounded-lg flex items-center justify-center mb-4`}>
                  <topic.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{topic.title}</h3>
                <p className="text-sm text-gray-600">{topic.description}</p>
                {selectedTopic === topic.id && (
                  <div className="mt-4 flex items-center gap-2 text-purple-600">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">Selected</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={generateContent}
              disabled={!selectedTopic || generating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {generating ? (
                <>
                  <ArrowPathIcon className="w-6 h-6 animate-spin" />
                  Generating AI Content...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  Generate SEO Content
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Generated Content */}
        <AnimatePresence>
          {generatedContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <SparklesIcon className="w-6 h-6 text-green-600" />
                  Generated Content
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={publishToBlog}
                    disabled={publishing}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {published ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Published!
                      </>
                    ) : publishing ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <RocketLaunchIcon className="w-5 h-5" />
                        Publish to Blog
                      </>
                    )}
                  </button>
                  <button
                    onClick={copyAllContent}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-5 h-5" />
                        Copy All
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SEO Score */}
              <div className="mb-6 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">SEO Score</h3>
                    <p className="text-gray-600">Optimized for all AI search engines</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {generatedContent.seoScore}
                    </div>
                    <div className="text-gray-600 font-semibold">/ 100</div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">📰 Title (H1)</label>
                <div className="relative">
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-purple-200 font-bold text-xl text-gray-900">
                    {generatedContent.title}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedContent.title)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow hover:shadow-lg transition-all"
                    title="Copy title"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Meta Description */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">🔍 Meta Description</label>
                <div className="relative">
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-blue-200 text-gray-700">
                    {generatedContent.metaDescription}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedContent.metaDescription)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow hover:shadow-lg transition-all"
                    title="Copy meta description"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">📝 Article Content</label>
                <div className="relative">
                  <div className="p-6 bg-gray-50 rounded-lg border-2 border-green-200 text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {generatedContent.content}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedContent.content)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow hover:shadow-lg transition-all"
                    title="Copy content"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Keywords */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <HashtagIcon className="w-5 h-5 inline-block mr-2" />
                  SEO Keywords
                </label>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-semibold text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2"># Social Media Hashtags</label>
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-blue-900 font-mono">{generatedContent.hashtags.join(' ')}</p>
                </div>
              </div>

              {/* AI Optimization Note */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  AI Search Engine Optimization
                </h3>
                <ul className="space-y-2 text-green-800">
                  <li>✅ Optimized for ChatGPT, Google Gemini, Claude AI</li>
                  <li>✅ Structured for Bing AI, Perplexity, and all AI search tools</li>
                  <li>✅ Rich semantic keywords for better AI understanding</li>
                  <li>✅ E-commerce specific entities and relationships</li>
                  <li>✅ Location-based SEO for Kigali, Rwanda</li>
                  <li>✅ Mobile-first and voice search optimized</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AISEOGenerator;
