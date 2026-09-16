# ClassPulse

**ClassPulse** is a real-time classroom Q&A system that helps teachers manage repeated student questions during online or offline classes.

Students can join a classroom session using a session code, submit questions from their devices, and view their questions in real time. The system uses semantic similarity to group questions with the same meaning, helping teachers avoid answering the same question repeatedly.

## Features

* Create classroom sessions with a unique session code
* Students join sessions using the session code
* Students submit questions using their name
* Real-time question updates
* Semantic similarity-based question grouping
* Displays grouped questions for teachers
* Teacher controls for managing and resolving question groups
* Persistent storage using MongoDB
* QR code-based session joining
* Responsive web interface

## How It Works

```text
Teacher creates session
        ↓
Unique session code generated
        ↓
Students join using session code / QR code
        ↓
Students submit questions
        ↓
Question sent to server
        ↓
Semantic similarity analysis
        ↓
Similar questions are grouped
        ↓
Teacher sees grouped questions in real time
        ↓
Teacher answers / resolves the group
```

## Technology Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js
* Socket.IO

### Database

* MongoDB
* Mongoose

### AI / NLP

* Ollama
* Semantic similarity-based question grouping

### Other Tools

* QR Code generation
* dotenv
* Nodemon

## Installation

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd ClassPulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file and add the required configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

If Ollama is used for semantic grouping, install Ollama and make sure the required model is available.

### 4. Start the application

```bash
npm run dev
```

Or:

```bash
node server/server.js
```

The application will run on:

```text
http://localhost:5000
```

## Usage

### Teacher

1. Open the teacher interface.
2. Create a classroom session.
3. Share the generated session code or QR code.
4. View student questions in real time.
5. Similar questions are automatically grouped.
6. Answer or resolve question groups.

### Student

1. Open the student interface.
2. Enter the session code or scan the QR code.
3. Enter your name.
4. Submit questions.
5. Continue asking questions during the session.

## Example

Students may ask:

```text
What is an array?
Can you explain arrays?
What exactly is an array?
```

ClassPulse identifies their semantic similarity and can place them into the same question group.

This allows the teacher to answer the concept once instead of repeatedly answering similar questions.

## Key Benefits

* Reduces repeated questions
* Saves classroom time
* Improves teacher response efficiency
* Provides real-time communication
* Organizes questions automatically
* Supports online and offline classroom environments

## Future Enhancements

* Student authentication
* Question voting/upvoting
* Improved semantic clustering
* Question priority detection
* Teacher analytics dashboard
* Attendance integration
* Answer history

## License

This project is developed as an academic and portfolio project.
