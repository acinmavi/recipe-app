'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
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
  user: {
    email: string;
  };
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      let query = supabase
        .from('recipes')
        .select('*, user:users(email)')
        .order('created_at', { ascending: false });

      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty', difficultyFilter);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes();
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficultyFilter(e.target.value);
    fetchRecipes();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
          <Link
            href="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            Create Recipe
          </Link>
        </div>

        <div className="mb-8 space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-orange-600 hover:bg-orange-700"
              >
                Search
              </button>
            </div>
          </form>

          <select
            value={difficultyFilter}
            onChange={handleDifficultyChange}
            className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No recipes found.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{recipe.title}</h2>
                  <p className="text-gray-500 mb-4 line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{recipe.cooking_time} minutes</span>
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-500">By {recipe.user.email}</span>
                    <span className="text-gray-500">
                      {formatDistanceToNow(new Date(recipe.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 