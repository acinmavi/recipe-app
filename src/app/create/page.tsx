'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import toast from 'react-hot-toast';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  id: string;
  description: string;
}

export default function CreateRecipe() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: '', amount: '', unit: '' },
    ]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const addStep = () => {
    setSteps([...steps, { id: Date.now().toString(), description: '' }]);
  };

  const updateStep = (id: string, description: string) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, description } : step)));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to create a recipe');
      }

      const { error } = await supabase.from('recipes').insert({
        title,
        description,
        cooking_time: parseInt(cookingTime),
        difficulty,
        ingredients,
        steps,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success('Recipe created successfully!');
      router.push('/recipes');
    } catch (error) {
      toast.error('Error creating recipe. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Recipe</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700">
                Cooking Time (minutes)
              </label>
              <input
                type="number"
                id="cookingTime"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <select
                id="difficulty"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Ingredients</label>
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
              >
                Add Ingredient
              </button>
            </div>
            <div className="space-y-4">
              {ingredients.map((ingredient) => (
                <div key={ingredient.id} className="flex gap-4 items-start">
                  <input
                    type="text"
                    placeholder="Amount"
                    required
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(ingredient.id, 'amount', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    required
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    required
                    className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(ingredient.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Steps</label>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
              >
                Add Step
              </button>
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex gap-4 items-start">
                  <span className="mt-2 text-gray-500">{index + 1}.</span>
                  <textarea
                    placeholder="Step description"
                    required
                    className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={step.description}
                    onChange={(e) => updateStep(step.id, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 