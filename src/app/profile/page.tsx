'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  created_at: string;
}

interface SavedRecipe {
  recipe: Recipe;
}

interface SavedRecipeResponse {
  recipe: {
    id: string;
    title: string;
    description: string;
    cooking_time: number;
    difficulty: string;
    created_at: string;
  };
}

export default function Profile() {
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-recipes' | 'saved'>('my-recipes');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
    fetchUserRecipes();
    fetchSavedRecipes();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    }
  };

  const fetchUserRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRecipes(data || []);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
    }
  };

  const fetchSavedRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_recipes')
        .select('recipe:recipes(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const recipes = (data || []).map((item: any) => ({
        id: item.recipe.id,
        title: item.recipe.title,
        description: item.recipe.description,
        cooking_time: item.recipe.cooking_time,
        difficulty: item.recipe.difficulty,
        created_at: item.recipe.created_at,
      }));
      
      setSavedRecipes(recipes);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-recipes')}
                className={`${
                  activeTab === 'my-recipes'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                My Recipes
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`${
                  activeTab === 'saved'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Saved Recipes
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'my-recipes' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Recipes</h2>
              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                Create Recipe
              </Link>
            </div>

            {userRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">You haven't created any recipes yet.</p>
                <Link
                  href="/create"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {userRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {recipe.title}
                      </h3>
                      <p className="text-gray-500 mb-4 line-clamp-2">{recipe.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{recipe.cooking_time} minutes</span>
                        <span className="capitalize">{recipe.difficulty}</span>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(recipe.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Saved Recipes</h2>
            {savedRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">You haven't saved any recipes yet.</p>
                <Link
                  href="/recipes"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  Browse Recipes
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {savedRecipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {recipe.title}
                      </h3>
                      <p className="text-gray-500 mb-4 line-clamp-2">{recipe.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{recipe.cooking_time} minutes</span>
                        <span className="capitalize">{recipe.difficulty}</span>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(recipe.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
} 