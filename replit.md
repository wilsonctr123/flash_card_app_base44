# MemoryAce - Spaced Repetition Flashcard Application

## Overview

MemoryAce is a modern web application for spaced repetition learning using flashcards. It implements the SM-2 algorithm for optimal review scheduling and provides a comprehensive learning experience with analytics, topic management, and multimedia support.

## User Preferences

Preferred communication style: Simple, everyday language.
Project Priority: Functionality over aesthetics - user emphasized making features actually usable.
UI: Clean, modern design with consistent color scheme and proper button styling.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript and Vite
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter (lightweight client-side routing)

### Project Structure
The application follows a monorepo structure with clear separation of concerns:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript types and database schemas
- Root configuration files for build tools and dependencies

## Key Components

### Frontend Architecture
- **Component-based UI**: Built with React functional components and hooks
- **Design System**: Consistent UI using shadcn/ui components with Radix UI primitives
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **State Management**: Server state managed by React Query, local state with React hooks
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **RESTful API**: Express.js routes handling CRUD operations
- **Type Safety**: Full TypeScript implementation with shared schemas
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Middleware**: Express middleware for logging, error handling, and request processing

### Database Design
The application uses a relational database with the following main entities:
- **Users**: User account information
- **Topics**: Categorization system for flashcards
- **Flashcards**: Core content with multimedia support and spaced repetition metadata
- **Study Sessions**: Learning activity tracking
- **User Stats**: Performance analytics and progress tracking

### Spaced Repetition Algorithm
Implements a modified SM-2 algorithm with:
- Difficulty ratings (1-4: Again, Hard, Good, Easy)
- Dynamic interval calculation based on performance
- Ease factor adjustments for long-term retention optimization

## Data Flow

### Study Session Flow
1. User initiates study session
2. System fetches due flashcards based on spaced repetition schedule
3. User reviews cards and provides difficulty ratings
4. Algorithm calculates next review dates and updates card metadata
5. Session statistics are recorded for analytics

### Content Management Flow
1. Users create and organize flashcards into topics
2. Multimedia content (images, videos) can be attached to cards
3. Topics provide categorization with custom colors and icons
4. Bulk operations allow efficient content management

### Analytics Flow
1. Study sessions generate performance data
2. System aggregates statistics for dashboard display
3. Progress tracking shows learning trends over time
4. Performance metrics help optimize study schedules

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight routing
- **zod**: Runtime type validation
- **react-hook-form**: Form state management

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast bundling for production

### Multimedia Support
- Support for images and videos in flashcards
- File upload and management capabilities
- Responsive media display in study interface

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Express server with TypeScript compilation via tsx
- Database migrations managed through Drizzle Kit
- Replit-specific optimizations for cloud development

### Production Build
- Frontend assets built and optimized by Vite
- Backend compiled to ESM modules using ESBuild
- Static file serving through Express in production
- Database schema management through migration system

### Database Management
- Drizzle migrations for schema versioning
- PostgreSQL connection through environment variables
- Serverless-ready database driver for cloud deployment
- Connection pooling and error handling

The application is designed for cloud deployment with minimal configuration, using modern serverless-compatible patterns throughout the stack.

## Recent Changes (January 2025)

### January 14, 2025 - Major Functionality Fixes
- Fixed Create Flashcard form validation and submission
- Corrected topic selection with proper number coercion
- Updated all button text colors from white to foreground for consistency
- Fixed sidebar navigation warnings by removing nested anchor tags
- Improved form validation with better error messages
- Made all primary buttons use consistent styling
- Fixed study card rating functionality
- Added proper API integration for topic and flashcard creation
- Enhanced user feedback with toast notifications

### Key Fixes Applied
- Form submissions now work properly across all pages
- Topic creation includes proper validation and API calls
- Study session buttons and ratings are functional
- Consistent button styling throughout the application
- Better form validation with meaningful error messages