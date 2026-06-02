let socket = null;
const listeners = new Map(); // Store custom event handlers

export const connectSocket = (token) => {
  if (socket) return; // Prevent multiple connections

  socket = new WebSocket(`ws://localhost:8000?token=${token}`);

  socket.addEventListener("open", () => {
    console.log("WebSocket connected");
  });

  socket.addEventListener("message", (event) => {
    const { type, data } = JSON.parse(event.data);

    // Check if we have a listener for this specific message type
    if (listeners.has(type)) {
      listeners.get(type).forEach((callback) => callback(data));
    }
  });

  socket.addEventListener("close", () => {
    console.log("WebSocket disconnected");
    socket = null; // Reset for potential reconnection
  });
};

// Ability to subscribe to specific events (e.g., 'NEW_MESSAGE', 'USER_TYPING')
export const on = (type, callback) => {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type).push(callback);
};

export const sendMessage = (type, payload) => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
};
