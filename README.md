# Bookshelf2

A modern web application for active reading, note-taking, and knowledge management.

## Features

### Article Management
- 📚 Organize and manage your reading materials
- 🏷️ Tag-based organization
- 🔍 Full-text search
- 📊 Reading progress tracking

### Active Reading
- ✨ Text highlighting with multiple colors
- 📝 Margin notes and annotations
- 📌 Bookmark important sections
- 📖 Progress tracking

### Smart Notes
- ✍️ Rich markdown editor
- 🔗 Bidirectional linking between articles and notes
- 📑 Wiki-style internal references
- 🎯 Real-time saving
- 📊 Text statistics and analytics

### Knowledge Graph
- 🕸️ Visual representation of connections
- 🔄 Automatic link suggestions
- 📈 Knowledge mapping

## Tech Stack

- ⚛️ React - Frontend framework
- 🔥 Firebase - Backend and database
- 🎨 Tailwind CSS - Styling
- 📝 React Markdown Editor Lite - Note editing
- 🚀 Vite - Build tool

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
cd bookshelf
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
- Create a Firebase project
- Enable Authentication and Firestore
- Copy your Firebase config to `.env`

4. Start the development server
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.