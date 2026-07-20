#!/bin/bash
set -e

# Create Vite React TypeScript app
npm create vite@latest frontend -- --template react-ts

# Navigate to frontend folder
cd frontend

# Install core dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install project specific dependencies
npm install react-router-dom @tanstack/react-query axios @react-oauth/google lucide-react clsx tailwind-merge date-fns

echo "Frontend setup complete."
