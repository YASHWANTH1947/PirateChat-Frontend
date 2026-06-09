let socket = null;
const listeners = new Map(); // Store custom event handlers

export const connectSocket = (token) => {
  if (socket) return; // Prevent multiple connections

  // socket = new WebSocket(`ws://localhost:8000?token=${token}`);
  // Use the URL from your environment variables
  const backendUrl = import.meta.env.VITE_API_BASE_URL.replace("http", "ws");

  // If your base URL is https://piratechat.onrender.com/api
  // This will correctly become wss://piratechat.onrender.com/api
  socket = new WebSocket(`${backendUrl.replace("http", "ws")}/?token=${token}`);
  socket.addEventListener("open", () => {
    console.log("WebSocket connected");
  });

  socket.addEventListener("message", (event) => {
    try {
      const { type, data } = JSON.parse(event.data);

      // Check if we have a listener for this specific message type
      if (listeners.has(type)) {
        listeners.get(type).forEach((callback) => callback(data));
      }
    } catch (err) {
      console.error("Error parsing WebSocket message:", err);
    }
  });

  socket.addEventListener("close", () => {
    console.log("WebSocket disconnected");
    socket = null; // Reset for potential reconnection
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Ability to subscribe to specific events (e.g., 'NEW_MESSAGE')
// Returns a cleanup/unsubscribe function to prevent leaks in React
export const on = (type, callback) => {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type).push(callback);

  return () => {
    const list = listeners.get(type);
    if (list) {
      const idx = list.indexOf(callback);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }
  };
};

export const sendMessage = (type, payload) => {
  console.log("Sending WebSocket message :", { type, payload });
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
};
