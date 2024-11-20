# Bookshelf2

A modern web application designed to transform how we read, understand, and retain digital content. Built for researchers, students, and avid readers who need a powerful tool to manage their reading, take notes, and build knowledge networks.

## Why Bookshelf2?

In today's digital age, we're overwhelmed with information but often lack the tools to effectively process and retain it. Bookshelf2 bridges this gap by providing:

- **Active Reading Support**: Transform passive reading into active learning
- **Knowledge Integration**: Connect ideas across different articles and notes
- **Progress Tracking**: Visualize and maintain your reading momentum
- **Focus-Oriented Design**: Clean, distraction-free reading environment
- **Collaborative Features**: Share insights and build knowledge together

## Features

### Enhanced Reading Experience

- Rainbow progress bar with persistent progress tracking
- Real-time reading statistics and analytics
- Responsive, mobile-first design
- Modern, animated tab interface
- Dynamic text scaling and formatting
- Smart content summarization

### Intelligent Dictionary

- Comprehensive dictionary with multiple sources:
  - **Free Dictionary API**: General definitions
  - **Wiktionary API**: Extended meanings
- Smart word detection and lookup
- Support for technical terms and proper nouns
- Draggable dictionary overlay
- Text-to-speech pronunciation

### Article Management

- Organize and manage your reading materials
- Hierarchical tag system
- Advanced full-text search with filters
- Reading progress tracking across devices
- Smart article categorization
- Bulk import/export capabilities

### Active Reading Tools

- Multi-color text highlighting
- Rich margin notes with:
  - Image attachments
  - Hyperlinks
  - Custom categories
- Smart bookmarking system
- Progress persistence
- Reading statistics with sentiment analysis
- Focus mode with customizable layout
- Note organization by categories
- Quick navigation between notes

### Smart Notes

- Rich markdown editor with live preview
- Bidirectional linking system
- Wiki-style internal references
- Real-time auto-saving
- Note statistics and analytics
- Automated tag suggestions

### Knowledge Graph

- Interactive 3D knowledge visualization
- Multiple graph views:
  - **Similarity Graph**: Connect articles based on content similarity
  - **Tags Graph**: Explore articles through shared tags and categories
  - **Timeline Graph**: Visualize articles chronologically
- Enhanced hover cards with article metadata
- Dynamic article search with comma-separated queries
- Interactive node highlighting
- Customizable graph layout
- Real-time graph filtering
- Smooth animations and transitions
- Zoom and pan controls
- Node clustering and grouping

### User Experience

- Clean, modern interface
- Dark/light mode support
- Fast, responsive performance
- Mobile-optimized layout
- Smooth animations
- Intuitive navigation

## Tech Stack

- React 18 - Frontend framework
- Firebase - Backend and database
- Tailwind CSS - Styling
- React Markdown - Note editing
- React App Rewired - Build tool
- Framer Motion - Animations
- Free Dictionary API - Primary dictionary source
- Wiktionary API - Secondary dictionary source

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/Monster0506/Bookshelf2
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

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_HUGGING_FACE_API_KEY=your_hugging_face_api_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
