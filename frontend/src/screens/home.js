import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import RankModal from '../components/RankModal';
import './home.css';

export default function HomeScreen(){
    const [lobbyPlayers,setLobbyPlayers] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [playerInfo, setPlayerInfo] = useState({});
    const [showHistory, setShowHistory] = useState(false);
    const [historyAll, setHistoryAll] = useState([]);
    const [historyMe, setHistoryMe] = useState(null);
    const [gameState, setGameState] = useState(false);
    const navigate = useNavigate();

    useEffect(()=>{
        socket.on('lobbyPlayers', setLobbyPlayers);
        socket.on('allPlayers', setAllPlayers);
        socket.on('yourData', setPlayerInfo);
        socket.on('allPlayersData', data => setHistoryAll(data));
        socket.on('yourDbData', data => setHistoryMe(data[0]));
        socket.on('startGame', ({gameState})=>{
          setGameState(gameState);
        });
        socket.on('finishGame', ({gameState})=>{
          setGameState(gameState);
        });
        socket.emit('requestInit');

        //register listener when component mount 
        return()=>{
            socket.off('lobbyPlayers', setLobbyPlayers);
            socket.off('allPlayers', setAllPlayers);
            socket.off('yourData', setPlayerInfo);
            socket.off('allPlayersData');
            socket.off('yourDbData');
            socket.off('startGame');
            socket.off('finishGame');
        };
        //clean listener when component unmount
    },[navigate]);


    const handleNickname=()=>{
        socket.emit('nickname',playerInfo.nickname.trim());
    };

    const handleStart=()=>{
        socket.emit("start");
        navigate('/ready');
    };

    const handleHistory=()=>{
        socket.emit("historyScore");
        setShowHistory(true);
    }; 
    const closeHistory=()=>{
        setShowHistory(false);
    };
    
    return (
      <div className="home-container">
        <h1 className="title">Draw and Guess</h1>
        <section className="welcome-box">
          <h2 className="welcome-title">Welcome!</h2>
          <p className="welcome-text">
            Draw the word, guess the word, score the points—may the best artist (or mind-reader) win!
          </p>
          <ol className="rules-list">
            <li>10 rounds per game. Each round, one <strong>Artist</strong>, others are <strong>Guessers</strong>.</li>
            <li>Artist has 60 s to sketch the secret word—no letters or numbers.</li>
            <li>Guessers type guesses live; faster guesses = more points.</li>
            <li>Artist earns points for every correct guesser.</li>
            <li>Leaderboard appears after the final round—top scorer gets the ⭐ crown!</li>
          </ol>
        </section>

        <div className="players">
          <h2 className="welcome-title">Online Players</h2>
          <ul className="allPlayer">
            {allPlayers.map((player,index)=>(
              <li key={index}>{player.nickname}</li>
            ))}
          </ul>
        </div>
        <div className="nickname-row">
           <label htmlFor="nickname-input">Nickname:</label>
            <input
                id="nickname-input"
                className="nickname-input"
                type="text"
                value={playerInfo.nickname || ''}
                onChange={(e) => setPlayerInfo({ ...playerInfo, nickname: e.target.value })}
            />
            <button onClick={handleNickname}>
                Save
            </button>
        </div>
        {!gameState &&(
        <button className="start-button" onClick={handleStart}>
          ▶
        </button>
        )}
        <div className="footer">
          <div className="scoreboard-wrapper">
            <span className="scoreboard-icon">⭐⭐⭐</span>
            <button className="scoreboard-button" onClick={handleHistory}>
              Score Board
            </button>
          </div>
        </div>

        {showHistory && (
          <RankModal
            data={historyAll}
            myData={historyMe}
            onClose={closeHistory}
          />
        )}
      </div>
    );
}