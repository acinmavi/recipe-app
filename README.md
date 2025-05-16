# Recipe Sharing App

A modern web application for sharing, discovering, and saving cooking recipes. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- User authentication (email/password)
- Create and publish recipes with ingredients and steps
- Browse and search recipes
- Like, comment, and save recipes
- User profiles with personal recipes and favorites
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS
- **Authentication & Database**: Supabase
- **Language**: TypeScript
- **State Management**: React Hooks
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd recipe-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project and set up the database:
   - Go to [Supabase](https://supabase.com) and create a new project
   - Run the SQL commands from `supabase/schema.sql` in the Supabase SQL editor
   - Get your project URL and anon key from the project settings

4. Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
recipe-app/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   └── lib/                 # Utility functions and types
├── public/                  # Static assets
├── supabase/               # Database schema and migrations
└── package.json
```

## Database Schema

The application uses the following tables:

- `recipes`: Stores recipe information
- `comments`: Stores recipe comments
- `likes`: Stores recipe likes
- `saved_recipes`: Stores saved recipes

See `supabase/schema.sql` for the complete database schema.

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
