# Frontend Bugs Report

This document details the issues identified in the frontend folder of **PirateChat** and explains the concepts you should study to avoid these architecture and development gaps.

---

## 1. Dead Code / Unintegrated WebSocket Module

### The Bug
Although the frontend has a fully written [socket.js](file:///C:/PortfolioProjects/PirateChat/frontend/src/websockets/socket.js) file defining event triggers and standard client handlers (`connectSocket`, `on`, `sendMessage`), it was never imported or referenced in [App.jsx](file:///C:/PortfolioProjects/PirateChat/frontend/src/App.jsx) or [main.jsx](file:///C:/PortfolioProjects/PirateChat/frontend/src/main.jsx). 

As a result:
- The chat application could not receive real-time notifications when another user sent a message.
- A user had to perform a manual mutation (like sending a message themselves) or reload the page to trigger React Query refetches to see new messages.
- The UI status pill showed "Live API" but was not connected to any real-time WebSocket connection.

### Concept to Study: React State Synchronization and Real-time WebSockets
- In modern chat applications, REST APIs are excellent for initial data load and batch mutations, but WebSockets are necessary to push instant updates from the server to the client.
- To integrate WebSockets in React:
  1. **Lifecycle Hooks**: Use `useEffect` to establish the connection once when the user authenticates, and clean it up (close the socket) when the user logs out or the component unmounts.
  2. **Event Listeners**: Listen for events (like `NEW_MESSAGE` or `USER_STATUS_CHANGE`) and hook them up to dispatch actions that update local React state or invalidate cache managers like React Query.
  3. **React Query Invalidation**: Calling `queryClient.invalidateQueries({ queryKey })` inside a socket listener forces React Query to fetch the fresh database state instantly, linking socket pushes directly to React UI states.
- **Resources**: Learn about "React useEffect hooks", "WebSocket events handling", and "@tanstack/react-query cache invalidation".

---

## 2. API Error Handling Fallback Layouts

### The Bug
While the app uses React Query query boundaries, if the backend server is completely offline, some queries fail and show standard error panels, but there is no global toast or automatic retry/fallback mechanism to notify the user of disconnection status dynamically, or gracefully reconnect.

### Concept to Study: Resilient UX and Connectivity Feedback
- Always implement clear status indicator indicators (like connection pills or toast overlays) indicating whether the WebSocket or HTTP API is currently connected.
- Configure retry policies and offline-first caches using React Query options (`retry`, `refetchOnReconnect`).
