#!/bin/bash

# CodeReview Setup Script for Unix/Mac
echo "🚀 Running CodeReview Setup Script"

# Make setup.js executable
chmod +x setup.js

# Run setup script
node setup.js

# If script was successful, make it executable for future use
if [ $? -eq 0 ]; then
  echo "✅ Setup completed successfully"
  exit 0
else
  echo "❌ Setup failed"
  exit 1
fi 