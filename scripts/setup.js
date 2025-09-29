#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Habit Tracker App...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `# Supabase Configuration
# Replace these with your actual Supabase project values
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
EXPO_PUBLIC_APP_NAME=HabitTracker
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created! Please update it with your Supabase credentials.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('Please run: npm install\n');
} else {
  console.log('✅ Dependencies are installed.\n');
}

console.log('🎉 Setup complete! Next steps:');
console.log('1. Update .env file with your Supabase credentials');
console.log('2. Set up your Supabase database using supabase/schema.sql');
console.log('3. Run: npm start');
console.log('4. Open the app on your device/simulator\n');

console.log('📚 For detailed setup instructions, see README.md');
