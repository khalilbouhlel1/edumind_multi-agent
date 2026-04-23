# edumind - AI-Powered Smart Study Helper

EduMind is a sophisticated study assistance platform built on the MERN stack. It leverages a state-of-the-art Multi-Agent AI architecture to provide deep research, structured writing, and interactive learning tools for students and researchers.

## 🚀 Key Features

- **Multi-Agent AI System**: Uses a specialized agentic workflow:
  - **Orchestrator**: Manages the flow between agents.
  - **Planner Agent**: Breaks down complex queries into manageable tasks.
  - **Research Agent**: Deep dives into topics using advanced AI models.
  - **Writer Agent**: Synthesizes research into high-quality, structured notes.
  - **Quiz Agent**: Generates interactive assessments to test knowledge.
- **Real-time Interaction**: Streaming AI responses using Server-Sent Events (SSE) for a responsive UX.
- **Session Management**: Securely save and retrieve your study sessions.
- **PDF Export**: Export your study notes and AI-generated content to PDF for offline use.
- **Authentication**: Secure user accounts with JWT and Bcrypt encryption.
- **Modern UI**: Clean, responsive design built with React and Tailwind CSS.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **PDF Generation**: jsPDF
- **Icons/UI**: Standard React components with custom styling

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **AI Models**: 
  - Groq SDK for high-performance inference
- **Auth**: JWT (JSON Web Tokens) & Bcryptjs
- **Environment**: Dotenv for secure configuration

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB account (Atlas or local instance)
- API Keys:  Groq

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/edumind.git
cd edumind
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add your credentials:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Start the Backend
```bash
cd backend
npm run dev
```
The server will run on `http://localhost:5000`.

### Start the Frontend
```bash
cd frontend
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## 🤖 Multi-Agent Workflow

1.  **Request**: User submits a study topic.
2.  **Planning**: The `PlannerAgent` creates a roadmap for the topic.
3.  **Researching**: The `ResearchAgent` gathers technical details and core concepts.
4.  **Writing**: The `WriterAgent` compiles the information into a readable study guide.
5.  **Testing**: The `QuizAgent` generates questions based on the content.

## 📄 License

This project is licensed under the ISC License.

---
*Created with ❤️ by Khalil Bouhlel.*
