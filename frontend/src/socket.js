import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:3001";
const socket = io(SOCKET_URL, { transports: ["websocket"] });
window.socket = socket;
export default socket;
