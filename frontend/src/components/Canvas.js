import { useRef, useEffect } from "react";
import socket from "../socket";

export default function Canvas({ isArtist }) {
  const canvasRef = useRef(null);
  const lastPoint = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    socket.on("clearCanvas", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    const handleMouseDown = (e) => {
      if (!isArtist) return;
      isDrawing.current = true;
      lastPoint.current = { x: e.offsetX, y: e.offsetY };
    };

    const handleMouseMove = (e) => {
      if (!isArtist || !isDrawing.current) return;
      const { offsetX, offsetY } = e;
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
        color: "black",
        lineWidth: 2,
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
      socket.off("clearCanvas");
    };
  }, [isArtist]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={350}
      style={{ border: "1px solid black" }}
    />
  );
}
