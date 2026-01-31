# Disedo - Discord-like Chat Application

A full-featured Discord-like chat application built with Next.js, React, TypeScript, and Supabase.

## Features

- **Servers & Channels**: Create and manage servers with text and voice channels
- **Real-time Messaging**: Polling every 3 seconds for new messages (real-time updates)
- **Direct Messages**: Private one-on-one conversations
- **Friends System**: Add friends, send requests, and manage your friend list
- **Roles & Permissions**: Create roles and assign them to server members
- **File Sharing**: Upload and share files/images in messages
- **Voice/Video Chat**: Join voice channels with microphone and camera support
- **User Status**: Online, away, busy, and offline status indicators
- **Message Management**: Edit and delete your own messages
- **Dark Theme**: Beautiful dark UI inspired by Discord

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Real-time**: Polling every 3 seconds
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a storage bucket named `attachments` with public access

### 3. Run Database Migrations

1. Go to your Supabase project SQL Editor
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /(auth)          # Authentication pages (login, register)
  /(main)          # Main application pages
    /servers        # Server management
    /dms            # Direct messages
    /friends        # Friends management
/components
  /servers          # Server sidebar component
  /channels         # Channel sidebar component
  /messages         # Message display and input
  /dms              # DM sidebar component
  /users            # User panel component
/lib
  /supabase         # Supabase client configuration
  types.ts          # TypeScript type definitions
/supabase
  /migrations       # Database migration files
```

## Key Features Implementation

### Polling System

The application uses a 3-second polling interval to fetch new messages, update user statuses, and refresh channel lists. This provides a real-time-like experience without WebSocket connections.

### File Uploads

Files are uploaded to Supabase Storage in the `attachments` bucket. Images are displayed inline, while other files are shown as download links.

### Voice Channels

Voice channels use WebRTC through the browser's MediaStream API. Users can join voice channels, toggle microphone and camera, and leave when done.

## Database Schema

The application uses the following main tables:
- `users` - User profiles
- `servers` - Server information
- `channels` - Text and voice channels
- `messages` - Channel messages
- `dm_messages` - Direct message conversations
- `friendships` - Friend relationships
- `roles` - Server roles
- `server_members` - Server membership

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Security

- Row Level Security (RLS) policies are enabled on all tables
- Users can only access data they're authorized to see
- Server owners have full control over their servers
- Members can only read/write in channels they have access to

## License

This project is open source and available for personal and commercial use.
