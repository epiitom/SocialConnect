
# SocialConnect

A modern, full-featured social media platform built with Next.js 14, TypeScript, Supabase, and Tailwind CSS. Features real-time notifications, comprehensive privacy controls, and a clean, responsive design.
<img width="1380" height="684" alt="image" src="https://github.com/user-attachments/assets/c97e0a86-ab5b-4c8b-ab85-44c02c304464" />
## Features

### Core Functionality
- **JWT Authentication** - Secure registration, login, and session management
- **User Profiles** - Customizable profiles with avatar upload and bio
- **Post System** - Create posts with text and images (up to 2MB)
- **Social Interactions** - Like, comment, and share posts
- **Follow System** - Follow/unfollow users with real-time updates
- **Personalized Feed** - Chronological feed from followed users

### Advanced Features
- **Privacy Controls** - Public, private, and followers-only visibility settings
- **Real-time Notifications** - Live updates for likes, comments, and follows
- **Admin Dashboard** - User management and content moderation tools
- **Image Upload** - Supabase Storage integration with validation
- **Infinite Scroll** - Optimized feed loading with pagination
- **Search & Discovery** - Find users and content easily

### Technical Highlights
- **Type-Safe** - Full TypeScript implementation with strict typing
- **Real-time** - Supabase Realtime for live notifications and updates
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Security** - Row Level Security (RLS) policies and input validation
- **Performance** - Optimized with Next.js 14 and Server Components

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage for images
- **Real-time**: Supabase Realtime subscriptions
- **Validation**: Zod schemas
- **UI Components**: Radix UI primitives via shadcn/ui

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/socialconnect.git
cd socialconnect
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database
- Create a new Supabase project
- Run the SQL schema from `docs/database-schema.sql`
- Enable Row Level Security on all tables
- Configure authentication settings

5. Start the development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    bio TEXT CHECK (char_length(bio) <= 160),
    avatar_url TEXT,
    website TEXT,
    location VARCHAR(100),
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'followers_only')),
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Additional tables and policies available in docs/database-schema.sql
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (email or username)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users (with search)
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/me` - Update own profile
- `POST /api/users/{id}/follow` - Follow user
- `DELETE /api/users/{id}/follow` - Unfollow user

### Posts
- `GET /api/posts` - List posts (with filters)
- `POST /api/posts` - Create post
- `GET /api/posts/{id}` - Get specific post
- `PUT /api/posts/{id}` - Update own post
- `DELETE /api/posts/{id}` - Delete own post
- `POST /api/posts/{id}/like` - Like post
- `DELETE /api/posts/{id}/like` - Unlike post

### Feed & Notifications
- `GET /api/feed` - Personalized feed
- `GET /api/notifications` - User notifications
- `POST /api/notifications/mark-all-read` - Mark all as read

### Admin
- `GET /api/admin/users` - Manage users (admin only)
- `GET /api/admin/stats` - System statistics (admin only)

## Project Structure

```
socialconnect/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Main app pages
│   └── admin/            # Admin dashboard
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth components
│   ├── posts/            # Post components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
└── types/                # TypeScript type definitions
```

## Key Components

### Custom Hooks
```typescript
// Authentication state
const { user, loading, isAuthenticated } = useAuth()

// Posts with infinite scroll
const { posts, loading, hasMore, loadMore } = useFeed()

// Real-time notifications
const { notifications, unreadCount, markAsRead } = useNotifications()
```

### Privacy System
```typescript
// Check user privacy permissions
const { canViewProfile, canViewPosts } = usePrivacyCheck(userId)

// Set privacy level
await updatePrivacy('followers_only')
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript checking

### Code Style
- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Prettier for code formatting
- Husky for pre-commit hooks

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy automatically

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use provided custom hooks for data fetching
- Implement proper error handling
- Add loading states for all async operations
- Maintain responsive design principles

## Security

- All API routes protected with authentication middleware
- Input validation using Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with proper data sanitization
- File upload validation (type, size, content)
- Rate limiting considerations

## Performance

- Server-side rendering with Next.js
- Optimized images with Next.js Image component
- Infinite scroll to reduce initial load time
- Database query optimization
- Real-time subscriptions only for necessary data
- Caching strategies for static content

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced search filters
- [ ] Story/temporary posts feature
- [ ] Video upload support
- [ ] Group/community features
- [ ] Analytics dashboard
- [ ] API rate limiting
- [ ] Content recommendation engine

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives

---

Built with ❤️ using modern web technologies
