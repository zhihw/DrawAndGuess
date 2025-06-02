import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import './ready.css'

export default function ReadyScreen(){
    const [readyPlayers,setReadyPlayers]=useState([]);
    const navigate = useNavigate();

    useEffect(()=>{
        socket.on('readyPlayers',setReadyPlayers);
        socket.on('startGame',()=>{
            navigate('/game');
        });
        socket.emit('sendReady');
        return()=>{
            socket.off('readyPlayers');
            socket.off('startGame');
        };
    },[navigate]);

    const handleReturn =() =>{
        socket.emit('readyReturn');
        navigate('/home');
    };

    const handleReady =() => {
        socket.emit('ready');
    };

    return(
        <div className="ready-container">
            <button className="returnButton" onClick={handleReturn}>
                ←
            </button>
            <div className="ready-status">
                Player Ready {readyPlayers.filter(p=>p.agree===true).length}/{readyPlayers.length}
            </div>
            <div className="list-container">
                <ul className="player-list">
                    {readyPlayers.map((player,index)=>(
                        <li key={index} className="list-item">
                            <input type="checkbox" checked={player.agree} readOnly/>
                            <span>{player.nickname}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <button className="ready" onClick={handleReady}>
                ready
            </button>


        </div>
    )
}