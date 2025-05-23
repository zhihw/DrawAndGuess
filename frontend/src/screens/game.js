import { useLocation } from 'react-router-dom';

export default function GameScreen() {
  const location = useLocation();
  const startTime = location.state?.startTime;

  return (
    <div>
      <h1>Game Start</h1>
      <p>Start Time: {startTime}</p>
    </div>
  );
}