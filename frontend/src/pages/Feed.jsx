import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  Send,
  Image,
  Link,
  Smile,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Avatar } from '../components/UI';
import { useAuthStore } from '../utils/store';
import { profileAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Feed = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);

  useEffect(() => {
    fetchFeedData();
  }, []);

  const fetchFeedData = async () => {
    try {
      // Fetch suggested users for the sidebar
      const suggestionsRes = await profileAPI.getSuggestions({ limit: 5 });
      setSuggestedUsers(suggestionsRes.data.suggestedUsers || []);
      
      // Mock posts data (in a real app, this would come from a posts API)
      const mockPosts = [
        {
          id: 1,
          user: {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            skills: ['React', 'Node.js', 'MongoDB']
          },
          content: 'Just finished building a full-stack application with React and Node.js! The learning journey has been incredible. What tech stack are you currently working with?',
          image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
          likes: 24,
          comments: 8,
          shares: 3,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isLiked: false
        },
        {
          id: 2,
          user: {
            _id: '2',
            firstName: 'Sarah',
            lastName: 'Wilson',
            username: 'sarahdev',
            photoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            skills: ['Python', 'Django', 'PostgreSQL']
          },
          content: 'Excited to share that I\'ve been selected as a speaker at the upcoming Python Developers Conference! Looking forward to connecting with fellow developers.',
          likes: 45,
          comments: 12,
          shares: 7,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          isLiked: true
        },
        {
          id: 3,
          user: {
            _id: '3',
            firstName: 'Mike',
            lastName: 'Chen',
            username: 'mikechen',
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            skills: ['JavaScript', 'TypeScript', 'Next.js']
          },
          content: 'TypeScript has completely changed how I approach JavaScript development. The type safety and better IDE support are game-changers. Anyone else making the switch?',
          likes: 18,
          comments: 15,
          shares: 4,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          isLiked: false
        }
      ];
      
      setPosts(mockPosts);
    } catch (error) {
      toast.error('Failed to load feed data');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      // In a real app, this would be an API call
      const newPostObj = {
        id: Date.now(),
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          photoUrl: user.photoUrl,
          skills: user.skills
        },
        content: newPost,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date(),
        isLiked: false
      };
      
      setPosts([newPostObj, ...posts]);
      setNewPost('');
      setShowPostForm(false);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const PostCard = ({ post }) => (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar
              src={post.user.photoUrl}
              alt={`${post.user.firstName} ${post.user.lastName}`}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.user.firstName} {post.user.lastName}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>@{post.user.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 mb-3">{post.content}</p>
          {post.image && (
            <img 
              src={post.image} 
              alt="Post" 
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Post Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span>{post.likes} likes</span>
            <span>{post.comments} comments</span>
            <span>{post.shares} shares</span>
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button 
            onClick={() => handleLike(post.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              post.isLiked 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
            <span>Like</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            <Share className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const CreatePostCard = () => (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <Avatar
            src={user?.photoUrl}
            alt={`${user?.firstName} ${user?.lastName}`}
            size="md"
          />
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind? Share your thoughts, projects, or achievements..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <Image className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <Link className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <Smile className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPostForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SuggestedUserCard = ({ suggestedUser }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <Avatar
        src={suggestedUser.photoUrl}
        alt={`${suggestedUser.firstName} ${suggestedUser.lastName}`}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {suggestedUser.firstName} {suggestedUser.lastName}
        </h4>
        <p className="text-xs text-gray-500 truncate">
          {suggestedUser.skills?.slice(0, 2).join(', ')}
        </p>
      </div>
      <Button size="sm" variant="outline">
        Connect
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
          <p className="text-gray-600">Stay updated with your network's activities</p>
        </div>
        <Button onClick={() => setShowPostForm(true)}>
          Create Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-3">
          {showPostForm && <CreatePostCard />}
          
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Suggested Connections */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedUsers.map(user => (
                <SuggestedUserCard key={user._id} suggestedUser={user} />
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Posts this week</span>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New connections</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile views</span>
                <span className="font-semibold">45</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Feed; 