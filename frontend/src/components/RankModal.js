import React from "react";

export default function RankModal({ data = [], myData = null, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          width: "80%",
          maxHeight: "80%",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            border: "none",
            background: "transparent",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          &times;
        </button>

        <h3>History Scoreboard</h3>
        <ol style={{ listStyle: "none" }}>
          {data.map((player, index) => (
            <li key={player.userID} style={{ marginBottom: "8px" }}>
              {index + 1}. {player.nickname} - {player.score}
            </li>
          ))}
        </ol>

        <h4>Your Score</h4>
        {myData ? (
          <p>
            {myData.nickname} - {myData.score}
          </p>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
