# Questprint 🎮

Questprint is a personality-based game discovery platform that helps players find games that match their preferences and playstyle.

Instead of browsing endless lists of games, users answer a short personality quiz and receive personalized recommendations based on traits such as challenge, exploration, social interaction, creativity, and narrative preference.

## Live Demo

https://questprint-nine.vercel.app/

---

## Features

### Personality Quiz

Users answer a series of slider-based questions that measure:

* Challenge
* Exploration
* Social Preference
* Creativity
* Narrative Preference

### Personalized Recommendations

QuestPrint compares quiz results against a game database and generates compatibility scores for hundreds of games.

### Social Matchmaking

Players can discover other users with similar gaming personalities.

Features include:

* Personality-based player recommendations
* Compatibility percentages
* Friend discovery system
* Match ranking

### Friend System

Users can:

* Send friend requests
* Accept or reject requests
* View pending requests
* Remove friends
* Manage their social network

### User Profiles

Players can:

* View public profiles
* Explore another player's QuestPrint personality
* See recommended games
* Compare interests and compatibility

### Chat System

QuestPrint includes a private messaging system for friends.

Features:

* Friend-to-friend messaging
* Conversation history
* Socket.IO real-time infrastructure
* Online user tracking

### User Accounts

Users can:

* Create an account
* Log in securely
* Save their QuestPrint profile

### Secure Authentication

Authentication is implemented using:

* bcrypt for password hashing
* JWT (JSON Web Tokens)
* Protected backend routes

### Persistent Profiles

Saved QuestPrints are stored in MongoDB and remain available between sessions.

---

## Tech Stack

### Frontend

* React
* Vite
* Axios
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Authentication

* bcryptjs
* JSON Web Tokens (JWT)

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

### Real-Time Communication

* Socket.IO

---

## How It Works

1. User completes the personality quiz.
2. Personality traits are calculated.
3. The recommendation engine compares those traits against game profiles.
4. Matching games are ranked by compatibility score.
5. Users can save their Questprint to their account.
6. Profiles and recommendations are stored in MongoDB.

---

## Project Structure

```text
Questprint
│
├── src/                 Frontend (React)
│
├── server/
│   ├── models/
│   ├── middleware/
│   └── server.js
│
└── MongoDB Atlas
```

---

## Future Improvements

* User avatars and profile customization
* Guilds and gaming communities
* Friend activity feed
* Group messaging
* Enhanced matchmaking algorithms
* Expanded game database
* Recommendation explanations
* Advanced search and filtering

---

## What I Learned

This project was my first full-stack application involving:

* React state management
* Express APIs
* MongoDB integration
* Authentication with JWT
* Password hashing
* Protected routes
* Deployment with Render and Vercel
* RESTful API design
* Mongoose schema design and relationships
* Friend request and social networking systems
* User-to-user relationship modeling
* Real-time communication with Socket.IO
* Event-driven programming
* Building chat system architecture
* API integration with Axios
* Conditional rendering in React
* Component-based application architecture
* State synchronization between frontend and backend
* Asynchronous JavaScript (async/await)
* Database querying and optimization
* Error handling and debugging
* Full-stack application architecture
* UI/UX design iteration and refinement
* Recommendation system development
* Matchmaking algorithms
* Git and GitHub workflow

Building Questprint taught me how frontend, backend, authentication, databases, and deployment work together in a real application.
