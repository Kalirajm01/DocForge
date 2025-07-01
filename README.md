# Confluence Clone - Knowledge Base Platform

A comprehensive, modular, and scalable Confluence-like Knowledge Base platform built with modern web technologies. This application provides document management, collaboration features, and version control in a user-friendly interface.

## 🚀 Features

### ✅ Mandatory Features

#### 1. User Authentication (JWT)
- **Register** - Email-based registration with verification
- **Login** - Secure email/password authentication
- **Forgot Password** - Email-based password reset
- **JWT-based token system** - Secure session management

#### 2. Document Management
- **Listing** - View documents with title, author, status, and last modified
- **Create** - WYSIWYG editor with React-Quill
- **Edit** - Auto-save functionality with real-time status
- **Search** - Full-text search on title and content using MongoDB text index

#### 3. Collaboration
- **@mentions** - Notify and auto-share with users
- **Auto-permission** - Automatic read access for mentioned users
- **Collaborator management** - Add/remove collaborators with permissions

#### 4. Privacy Controls
- **Public** - No login required for viewing
- **Private** - Only shared users can access
- **Share with permissions** - View/edit/admin permissions

### ⭐ Bonus Features

#### Version Control
- **Change history** - Complete version tracking with timestamps
- **Diff view** - Basic diff comparison between versions
- **Audit trail** - Show who did what and when

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + Vite + Material UI | Fast, lightweight, modern UI |
| **Editor** | React-Quill | WYSIWYG rich text editor |
| **Backend** | Node.js + Express | RESTful API server |
| **Authentication** | JWT + bcrypt | Secure user authentication |
| **Database** | MongoDB Atlas | NoSQL database (free cluster) |
| **Search** | MongoDB Text Index | Full-text search capabilities |
| **Email** | Nodemailer | Password reset and verification |
| **Hosting** | Render.com (backend) + Netlify (frontend) | Free hosting solutions |

## 📁 Project Structure

```
project/
├── server/                 # Backend Node.js application
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Authentication & validation
│   ├── utils/             # Helper functions
│   └── env.example        # Environment variables template
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── main.jsx       # App entry point
│   └── package.json
└── package.json           # Root package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account (free)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd confluence-clone
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Environment Setup

#### Backend Configuration
1. Copy the environment template:
```bash
cd server
cp env.example .env
```

2. Update `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/confluence-clone?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@confluence-clone.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### MongoDB Atlas Setup
1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace `your_username`, `your_password`, and `your_cluster` in the MONGODB_URI

#### Email Setup (Optional)
For password reset functionality:
1. Use Gmail SMTP or any other email service
2. For Gmail, create an App Password in your Google Account settings
3. Update the email configuration in `.env`

### 4. Start Development Servers

#### Option 1: Start Both Servers
```bash
# From the root directory
npm run dev
```

#### Option 2: Start Servers Separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:token` - Reset password
- `GET /api/auth/me` - Get current user

### Document Endpoints
- `GET /api/documents` - List documents (with permissions)
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/versions` - Get document versions

### Search Endpoints
- `GET /api/search` - Global search
- `GET /api/search/documents` - Search documents
- `GET /api/search/users` - Search users
- `GET /api/search/suggestions` - Search suggestions

### User Endpoints
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id/documents` - Get user's documents
- `GET /api/users/:id/collaborations` - Get user's collaborations

## 🔧 Key Features Implementation

### Auto-Save Functionality
- Debounced auto-save every 2 seconds
- Real-time save status indicators
- Manual save option available

### @mentions System
- Automatic user detection in content
- Auto-grant read access to mentioned users
- User search for mentions

### Version Control
- Automatic version creation on content changes
- Version history with timestamps
- User attribution for changes

### Privacy & Permissions
- Public/Private document visibility
- Granular permission system (view/edit/admin)
- Automatic permission management

## 🚀 Deployment

### Backend Deployment (Render.com)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`
5. Add environment variables from your `.env` file

### Frontend Deployment (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `cd client && npm run build`
3. Set publish directory: `client/dist`
4. Add environment variables if needed

### Environment Variables for Production
```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.netlify.app
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Rate Limiting** - API rate limiting to prevent abuse
- **CORS Protection** - Configured CORS for security
- **Input Validation** - Server-side validation for all inputs
- **Helmet.js** - Security headers middleware

## 📱 Responsive Design

- Mobile-first approach
- Material UI responsive components
- Touch-friendly interface
- Adaptive navigation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

## 🎯 Future Enhancements

- Real-time collaboration with WebSockets
- Advanced search filters
- Document templates
- Export functionality (PDF, Word)
- Advanced analytics
- Mobile app development
- Integration with third-party services

---

**Built with ❤️ using modern web technologies** 