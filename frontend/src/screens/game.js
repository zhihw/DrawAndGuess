import React, { useEffect, useState } from 'react';
import socket from '../socket';
import { Navigate, useNavigate } from 'react-router-dom';
import './game.css';

export default function GameScreen() {
  const [Players,setPlayers]=useState([]);
  const [artist, setArtist] = useState(null);
  const [word, setWord] = useState("");
  const [roundNo, setRoundNo] = useState(0);
  const [roundEndTs, setRoundEndTs] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showRank, setShowRank] = useState(false);
  const [data, setData] = useState([]);
  const [msgList, setMsgList] = useState([]);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(()=>{
    socket.on("gameStarted",({roundNo,artistIx,word,roundEndTs,players})=>{
      setPlayers(players);
      setRoundNo(roundNo);
      setArtist(Players[artistIx]);
      setWord(word);
      setRoundEndTs(roundEndTs);
      setWinner(null);
      setData([]);
    })
    socket.on("roundEnded",({roundNo,winnerIx,artistIx,correctWord,players})=>{
      setPlayers(players);
      setRoundNo(roundNo);
      setArtist(players[artistIx]);
      setWord(correctWord);
      setWinner(players[winnerIx]);
    })
    socket.on("gameFinished",({players})=>{
      setPlayers(players);
      setShowRank(true);
      setTimeout(() => navigate('/home'), 5_000);
    })
    socket.on("draw",(data)=>{
      setData(prev => [...prev, data]);
    })
    socket.on("clearCanvas",()=>{
      setData([]);
    })
    socket.on("chat",(msgpkg)=>{
      setMsgList(prev => [...prev, msgpkg]);
    })
    socket.emit("ready");
    return ()=>{
      socket.off("gameStarted");
      socket.off("roundEnded");
      socket.off("gameFinished");
      socket.off("draw");
      socket.off("clearCanvas");
      socket.off("chat");
    }
  },[navigate]);

  const handleSendMsg =(msg) =>{
    if (!msg.trim()) return;
    const player=Players.find(player=>player.socketID===socket.id);
    const msgpkg = {msg:msg,nickname:player.nickname};
    socket.emit("chat",msgpkg);
  }

  const Message =React.memo(({msgpkg})=>{
    const {msg,nickname}=msgpkg;
    return <div>nickname: {nickname} : {msg}</div>
  });

  const ChatBox =()=>{
    return (
    <div className="chatbox">
      <div className="msg-list">
        {msgList.map(msgpkg=><Message msgpkg={msgpkg}/>)}
      </div>
      <div className="inputArea">
        <input type="text" placeholder="Enter your message" value={message} onChange={(e)=>setMessage(e.target.value)}/>
        <button className="send-btn" 
                onClick={()=>{
                  handleSendMsg(message);
                  setMessage("");
                }}>
                Send
        </button>
      </div>
    </div>
    )
  }
  return (
    <div className="game-container">
      <ChatBox/>
    </div>
  )

}

