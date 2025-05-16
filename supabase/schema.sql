-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Drop existing tables
DROP TABLE IF EXISTS saved_recipes;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS recipes;

-- Create a publication for public schema
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Create users view to access auth.users
CREATE OR REPLACE VIEW users AS
SELECT id, email, raw_user_meta_data
FROM auth.users;

-- Create recipes table
CREATE TABLE recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cooking_time INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ingredients JSONB NOT NULL,
  steps JSONB NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign key after table creation
ALTER TABLE recipes
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign keys for comments
ALTER TABLE comments
  ADD CONSTRAINT fk_recipe
  FOREIGN KEY (recipe_id)
  REFERENCES recipes(id)
  ON DELETE CASCADE;

ALTER TABLE comments
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign keys and constraints for likes
ALTER TABLE likes
  ADD CONSTRAINT fk_recipe
  FOREIGN KEY (recipe_id)
  REFERENCES recipes(id)
  ON DELETE CASCADE;

ALTER TABLE likes
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE likes
  ADD CONSTRAINT unique_like
  UNIQUE(recipe_id, user_id);

-- Create saved_recipes table
CREATE TABLE saved_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign keys and constraints for saved_recipes
ALTER TABLE saved_recipes
  ADD CONSTRAINT fk_recipe
  FOREIGN KEY (recipe_id)
  REFERENCES recipes(id)
  ON DELETE CASCADE;

ALTER TABLE saved_recipes
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE saved_recipes
  ADD CONSTRAINT unique_saved_recipe
  UNIQUE(recipe_id, user_id);

-- Create indexes for better query performance
CREATE INDEX recipes_user_id_idx ON recipes(user_id);
CREATE INDEX comments_recipe_id_idx ON comments(recipe_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX likes_recipe_id_idx ON likes(recipe_id);
CREATE INDEX likes_user_id_idx ON likes(user_id);
CREATE INDEX saved_recipes_recipe_id_idx ON saved_recipes(recipe_id);
CREATE INDEX saved_recipes_user_id_idx ON saved_recipes(user_id);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Recipes are viewable by everyone" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Saved recipes policies
CREATE POLICY "Saved recipes are viewable by the owner" ON saved_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert saved recipes" ON saved_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recipes" ON saved_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE saved_recipes;

