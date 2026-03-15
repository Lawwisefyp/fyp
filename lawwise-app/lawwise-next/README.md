# Lawwise - Unified Legal Practice Management

This is the unified Lawwise application, migrated from separate MERN stack components to a modern **Next.js App Router** architecture. All portals (Lawyer, Client, Student) and AI features are now integrated here.

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Prerequisites
Ensure you have **Node.js 18+** and **npm** installed.

### 2. Install Dependencies
Navigate to the project root and install the required packages:
```bash
cd lawwise-next
npm install
```

### 3. Environment Setup
The project requires several environment variables for Database, JWT, and AI integrations. These are already configured in `.env.local` for your convenience.

### 4. Run Development Server
Start the unified application:
```bash
npm run dev
```

### 5. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure
- `src/app`: Next.js App Router pages and API routes.
- `src/lib`: Shared services (Mongoose connection, AI logic, API client).
- `src/styles`: Global and component-specific CSS.
- `public/uploads`: Storage for uploaded documents and legal notes.

## 🛠 Features
- **Lawyer Portal**: Case management, AI drafting, and marketplace.
- **Client Portal**: E-filing, lawyer search, and case tracking.
- **Student Portal**: AI-powered LexAcademy (quizzes, note explanations).
- **AI Integration**: Powered by Google Gemini Pro for legal intelligence.

