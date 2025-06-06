import { useRef, useEffect, useState } from "react";
import socket from "../socket";
import "./Canvas.css";

export default function Canvas({ isArtist, roundNo }) {
  const canvasRef = useRef(null);
  const lastPoint = useRef(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState("black");
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [roundNo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const handleMouseDown = (e) => {
      if (!isArtist) return;
      isDrawing.current = true;
      lastPoint.current = { x: e.offsetX, y: e.offsetY };
    };

    const handleMouseMove = (e) => {
      if (!isArtist || !isDrawing.current) return;
      const { offsetX, offsetY } = e;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      //draw on canvas on artist side
      socket.emit("draw", {
        fromX: lastPoint.current.x,
        fromY: lastPoint.current.y,
        toX: offsetX,
        toY: offsetY,
        color: color,
        lineWidth: lineWidth,
      });
      //then emit to other player
      lastPoint.current = { x: offsetX, y: offsetY };
    };

    const handleMouseUp = () => {
      if (!isArtist) return;
      isDrawing.current = false;
      lastPoint.current = null;
    };

    const handleGuessDraw = (d) => {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.lineWidth;
      ctx.beginPath();
      ctx.moveTo(d.fromX, d.fromY);
      ctx.lineTo(d.toX, d.toY);
      ctx.stroke();
    };
    socket.on("draw", handleGuessDraw);

    if (isArtist) {
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      socket.off("draw", handleGuessDraw);
    };
  }, [isArtist, color, lineWidth, roundNo]);

  const handleErase = () => {
    setColor("white");
    setLineWidth(30);
  };
  const handleBlackPen = () => {
    setColor("black");
    setLineWidth(2);
  };
  const handleRedPen = () => {
    setColor("red");
    setLineWidth(2);
  };
  const handleBluePen = () => {
    setColor("blue");
    setLineWidth(2);
  };
  const handleGreenPen = () => {
    setColor("green");
    setLineWidth(2);
  };
  return (
    <div className="canvas-container">
      <div className="tool-buttons">
        <button onClick={handleErase}>erase</button>
        <button onClick={handleBlackPen}>black</button>
        <button onClick={handleRedPen}>red</button>
        <button onClick={handleBluePen}>blue</button>
        <button onClick={handleGreenPen}>green</button>
      </div>
      <canvas ref={canvasRef} width={800} height={500} />
    </div>
  );
}
