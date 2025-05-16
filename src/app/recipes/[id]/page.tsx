'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  ingredients: Array<{
    id: string;
    name: string;
    amount: string;
    unit: string;
  }>;
  steps: Array<{
    id: string;
    description: string;
  }>;
  created_at: string;
  user: {
    id: string;
    email: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    email: string;
  };
}

export default function RecipeDetail() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRecipe();
    fetchComments();
    checkUserInteractions();
  }, [params.id]);

  const fetchRecipe = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, user:users(id, email)')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setRecipe(data);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Error loading recipe');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:users(email)')
        .eq('recipe_id', params.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkUserInteractions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('recipe_id', params.id)
        .eq('user_id', user.id)
        .single();

      const { data: saved } = await supabase
        .from('saved_recipes')
        .select('id')
        .eq('recipe_id', params.id)
        .eq('user_id', user.id)
        .single();

      setIsLiked(!!like);
      setIsSaved(!!saved);

      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('recipe_id', params.id);

      setLikesCount(count || 0);
    } catch (error) {
      console.error('Error checking user interactions:', error);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to like recipes');
        return;
      }

      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('recipe_id', params.id)
          .eq('user_id', user.id);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase.from('likes').insert({
          recipe_id: params.id,
          user_id: user.id,
        });
        setLikesCount((prev) => prev + 1);
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Error updating like status');
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save recipes');
        return;
      }

      if (isSaved) {
        await supabase
          .from('saved_recipes')
          .delete()
          .eq('recipe_id', params.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('saved_recipes').insert({
          recipe_id: params.id,
          user_id: user.id,
        });
      }

      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Recipe removed from saved' : 'Recipe saved');
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Error updating save status');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to comment');
        return;
      }

      const { error } = await supabase.from('comments').insert({
        recipe_id: params.id,
        user_id: user.id,
        content: newComment,
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error adding comment');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!recipe) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Recipe not found</h1>
            <p className="mt-2 text-gray-500">The recipe you're looking for doesn't exist.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
                <p className="mt-2 text-gray-500">By {recipe.user.email}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md ${
                    isLiked
                      ? 'text-red-600 bg-red-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill={isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{likesCount}</span>
                </button>
                <button
                  onClick={handleSave}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md ${
                    isSaved
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill={isSaved ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
              <span>{recipe.cooking_time} minutes</span>
              <span className="capitalize">{recipe.difficulty}</span>
              <span>{formatDistanceToNow(new Date(recipe.created_at), { addSuffix: true })}</span>
            </div>

            <p className="mt-4 text-gray-600">{recipe.description}</p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
              <ul className="mt-4 space-y-2">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex items-center space-x-2">
                    <span className="text-gray-600">
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Instructions</h2>
              <ol className="mt-4 space-y-4">
                {recipe.steps.map((step, index) => (
                  <li key={step.id} className="flex">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-medium">
                      {index + 1}
                    </span>
                    <span className="ml-4 text-gray-600">{step.description}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
              <form onSubmit={handleComment} className="mt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Post Comment
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {comment.user.email}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <p className="mt-1 text-gray-600">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 