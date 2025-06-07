# DrawAndGuess

## Project Overview

`Draw & Guess` is a real-time, multiplayer drawing and guessing game where players take turns acting as the **Artist** or **Guesser**. During each round, the Artist draws a given word, while the Guessers type their guesses in a chat box. Correct guesses earn points, and the game supports multiple rounds, score tracking, and a leaderboard.

## Key Features

- **Real-Time Drawing**: Canvas-based drawing synchronized across clients via Socket.IO.
- **Multiplayer Interaction**: Players can join a shared room, with one player randomly assigned as the Artist each round.
- **Countdown Timer**: Each round has a fixed duration (default 120 seconds) before automatically advancing.
- **Scoring & Leaderboard**: Both the Artist and the first correct Guesser receive points, with live leaderboard updates.
- **Room Isolation**: Drawing and chat data are scoped to each room to prevent cross-room interference.

## technical stack

- Frontend: React, Canvas API, Socket.io
- Backend: Node.js, Express, Socket.io
- Database: MySQL

## Quick Start (Local Development)

1. **Clone the repository**

```bash
   git clone https://github.com/zhihw/DrawAndGuess.git
   cd draw-and-guess
```

2. **Install dependencies**

```bash
   cd frontend
   npm install
   cd ../backend
   npm install
```

3. **Run the application**

```bash
   cd frontend
   npm start
   cd ../backend
   npm start
```

4. **Access the application**

Open your web browser and navigate to `http://localhost:3000` to access the application.

## Deployment

The backend is deployed on [backend](https://drawandguess-mfo2.onrender.com). The frontend is deployed on [frontend](https://draw-and-guess-nu.vercel.app/).

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
