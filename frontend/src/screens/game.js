import React, { useEffect, useState } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas";
import "./game.css";
import RankModal from "../components/RankModal";

const Message = React.memo(({ msgpkg }) => {
  const { msg, nickname } = msgpkg;
  return (
    <div>
      {nickname} : {msg}
    </div>
  );
});

const ChatBox = ({ msgList, message, setMessage, handleSendMsg }) => {
  return (
    <div className="chatbox">
      <div className="msg-list">
        {msgList.map((msgpkg) => (
          <Message msgpkg={msgpkg} />
        ))}
      </div>
      <div className="inputArea">
        <input
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="send-btn"
          onClick={() => {
            handleSendMsg(message);
            setMessage("");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default function GameScreen() {
  const [Players, setPlayers] = useState([]);
  const [artist, setArtist] = useState(null);
  const [isArtist, setIsArtist] = useState(false);
  const [word, setWord] = useState("");
  const [guessWord, setGuessWord] = useState("");
  const [roundNo, setRoundNo] = useState(0);
  const [roundEndTs, setRoundEndTs] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showRank, setShowRank] = useState(false);
  const [msgList, setMsgList] = useState([]);
  const [message, setMessage] = useState("");
  const [showWinner, setShowWinner] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFalse, setShowFalse] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    socket.on(
      "gameStarted",
      ({ roundNo, artistIx, word, roundEndTs, players }) => {
        setShowWinner(false);
        setPlayers(players);
        setRoundNo(roundNo);
        setArtist(players[artistIx]);
        if (players[artistIx].socketID === socket.id) {
          setIsArtist(true);
        } else {
          setIsArtist(false);
        }
        setWord(word);
        setRoundEndTs(roundEndTs);
        setWinner(null);
        const diff = Math.max(0, Math.floor((roundEndTs - Date.now()) / 1000));
        setRemainingTime(diff);
        setShowAnswer(false);
        setShowFalse(false);
      }
    );
    socket.on(
      "roundEnded",
      ({ roundNo, winnerIx, artistIx, correctWord, players }) => {
        setPlayers(players);
        setRoundNo(roundNo);
        setArtist(players[artistIx]);
        if (players[artistIx].socketID === socket.id) {
          setIsArtist(true);
        } else {
          setIsArtist(false);
        }
        setWord(correctWord);
        setWinner(players[winnerIx]);
        setRemainingTime(0);
        if (winnerIx !== -1) {
          setShowWinner(true);
        }
        setShowAnswer(true);
      }
    );
    socket.on("gameFinished", ({ players }) => {
      setPlayers(players);
      setShowRank(true);
      setTimeout(() => navigate("/home"), 5_000);
    });
    socket.on("chat", (msgpkg) => {
      setMsgList((prev) => [...prev, msgpkg]);
    });
    socket.on("wrongAnswer", () => {
      setShowFalse(true);
    });
    socket.emit("ready");

    return () => {
      socket.off("gameStarted");
      socket.off("roundEnded");
      socket.off("gameFinished");
      socket.off("draw");
      socket.off("clearCanvas");
      socket.off("chat");
      socket.off("wrongAnswer");
    };
  }, [navigate]);

  useEffect(() => {
    if (!roundEndTs) return;
    const intervalId = setInterval(() => {
      const diff = roundEndTs - Date.now();
      if (diff <= 0 || winner) {
        setRemainingTime(0);
        clearInterval(intervalId);
      } else {
        setRemainingTime(Math.floor(diff / 1000));
      }
    }, 1000);
    return () => clearInterval(intervalId);
    //clear interval when component unmount
  }, [roundEndTs, winner]);

  useEffect(() => {
    setTimeout(() => setShowFalse(false), 3000);
  }, [showFalse]);

  const handleSendMsg = (msg) => {
    if (!msg.trim()) return;
    const player = Players.find((player) => player.socketID === socket.id);
    const msgpkg = { msg: msg, nickname: player.nickname };
    socket.emit("chat", msgpkg);
  };

  const handleSubmitGuess = () => {
    if (!guessWord.trim()) return;
    socket.emit("submitGuess", { guessWord: guessWord.trim() });
    setGuessWord("");
    setShowFalse(false);
  };

  const handleShowRank = () => {
    setShowRank(true);
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <div className="round-info">Round {roundNo} of 5</div>
        <div className="artist-info">Artist: {artist?.nickname}</div>
        <div className="time-info">Time left: {remainingTime}</div>
        <button className="send-btn" onClick={handleShowRank}>
          Scoreboard
        </button>
      </div>

      <div className="mid-container">
        <Canvas isArtist={isArtist} roundNo={roundNo} key={roundNo} />
        <div className="right-part">
          <ChatBox
            msgList={msgList}
            message={message}
            setMessage={setMessage}
            handleSendMsg={handleSendMsg}
          />
          {isArtist && (
            <div className="guess-area">
              <div className="word-info">Word: {word}</div>
            </div>
          )}
          {!isArtist && (
            <div className="guess-area">
              <div className="word-info">Word length: {word.length}</div>
              <input
                type="text"
                placeholder="Type your guess here"
                value={guessWord}
                onChange={(e) => setGuessWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmitGuess();
                  }
                }}
              />
              <button
                className="send-btn"
                style={{ fontSize: "14px" }}
                onClick={handleSubmitGuess}
              >
                Submit Guess
              </button>
            </div>
          )}
          <div className="guess-info">
            <div className="word-info" style={{ alignSelf: "center" }}>
              Feedback
            </div>
            {showFalse && <div className="word-info">Wrong Answer</div>}
            {showWinner && (
              <div className="word-info">{winner?.nickname} wins!</div>
            )}

            {showAnswer && (
              <div className="word-info">The answer was: {word}</div>
            )}
          </div>
        </div>
      </div>

      {showRank && (
        <RankModal
          data={Players}
          myData={Players.find((player) => player.socketID === socket.id)}
          onClose={() => setShowRank(false)}
        />
      )}
    </div>
  );
}
