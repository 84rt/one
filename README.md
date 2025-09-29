# Habit Tracker App

A cross-platform mobile app for habit tracking with offline-first architecture and social accountability features.

## Features

- ✅ **Offline-First**: Works perfectly without internet connection
- ✅ **Real-Time Sync**: Automatic synchronization when online
- ✅ **Habit Tracking**: Create, edit, and track daily habits
- ✅ **Streak Calculation**: Accurate streak tracking with timezone support
- ✅ **Beautiful UI**: Modern, intuitive interface
- ✅ **User Authentication**: Secure login/signup with Supabase
- ✅ **Data Integrity**: Tamper-proof streak calculations

## Tech Stack

- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **WatermelonDB**: Local database with sync capabilities
- **Supabase**: Backend (PostgreSQL + real-time + auth)
- **React Navigation**: Navigation
- **React Native Paper**: UI components

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_NAME=HabitTracker
```

### 3. Set up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL to create the database schema

### 4. Run the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Architecture

### Offline-First Design

The app is built with an offline-first architecture where:

1. **Local Database is Source of Truth**: All operations work locally first
2. **Background Sync**: Changes sync to server when online
3. **Conflict Resolution**: Server wins for shared data, client wins for personal data
4. **Queue System**: Failed syncs are queued and retried

### Data Flow

```mermaid
User Action → Local DB (instant) → UI updates
                   ↓
           Sync Queue (background)
                   ↓
           Server (when online) → Push to other users
```

### Key Components

- **WatermelonDB**: Local SQLite database with reactive queries
- **Sync Service**: Handles bidirectional synchronization
- **Auth Service**: Manages user authentication
- **Habit Service**: CRUD operations for habits and completions

## Project Structure

```text
src/
├── components/          # Reusable UI components
├── config/             # Configuration files
├── database/           # WatermelonDB models and schema
├── screens/            # App screens
└── services/           # Business logic services
```

## Development

### Adding New Features

1. **Models**: Add new WatermelonDB models in `src/database/models/`
2. **Services**: Create service classes in `src/services/`
3. **Screens**: Add new screens in `src/screens/`
4. **Components**: Create reusable components in `src/components/`

### Sync Strategy

- **Incremental Sync**: Only sync changes since last sync
- **Conflict Resolution**:
  - Habit completions: Merge (both are valid)
  - Metadata: Last-write-wins
  - Group membership: Server wins
- **Retry Logic**: Failed syncs are retried with exponential backoff

## Future Features (Phase 2)

- Friend connections and habit groups
- Real-time updates of friends' completions
- Push notifications
- Group streaks and achievements
- Advanced analytics and insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially offline scenarios)
5. Submit a pull request

## License

MIT License - see LICENSE file for details
