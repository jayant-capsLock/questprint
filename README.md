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

Questprint compares quiz results against a game database and generates compatibility scores for hundreds of games.

### User Accounts

Users can:

* Create an account
* Log in securely
* Save their Questprint profile

### Secure Authentication

Authentication is implemented using:

* bcrypt for password hashing
* JWT (JSON Web Tokens) for user authentication
* Protected backend routes

### Persistent Profiles

Saved Questprints are stored in MongoDB and remain available between sessions.

Users can:

* View their personality profile
* View their top game matches
* Access their saved Questprint after logging in

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

* Retake Questprint
* Expanded game database
* Recommendation explanations
* Wishlist functionality
* Public Questprint profiles
* Friend comparison system
* Advanced filtering and search

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

Building Questprint taught me how frontend, backend, authentication, databases, and deployment work together in a real application.
