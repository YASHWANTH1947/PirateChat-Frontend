# Frontend Edits Report

This document records the changes made to the frontend folder and explains the reasoning behind each modification.

---

## 1. Updated and Standardized WebSocket Helper Module
- **File Edited**: [socket.js](file:///C:/PortfolioProjects/PirateChat/frontend/src/websockets/socket.js)
- **Change**: 
  - Added a `disconnectSocket` function to allow closing the WebSocket connection cleanly when users log out or unmount.
  - Modified the `on` function to return an unsubscribe cleanup callback which removes the registered handler from the shared event listeners Map.
- **Why**: React component lifecycles cause effects to run multiple times during hot-reloads and transitions. Returning an unsubscribe function from `on()` avoids event listener duplication and memory leaks. The disconnect function ensures we clean up network resources on logout.

---

## 2. Integrated WebSockets with React UI States
- **File Edited**: [App.jsx](file:///C:/PortfolioProjects/PirateChat/frontend/src/App.jsx)
- **Change**: 
  - Imported `connectSocket`, `disconnectSocket`, and `on` from `socket.js`.
  - Added a `useEffect` hook to asynchronously request a Clerk session JWT token and initialize the WebSocket connection upon ChatApp mount, cleaning up the socket upon unmount.
  - Added a `useEffect` subscription listener for the `NEW_MESSAGE` WebSocket event. Upon receipt of a new message, it automatically invalidates React Query's `["messages", selectedConversationId]` and `["conversations"]` caches.
- **Why**: Prior to this change, the frontend was completely disconnected from the WebSocket server and did not have real-time messaging support. Invalidating React Query queries on new WebSocket events forces the browser to fetch the new messages and updated conversation states instantly, enabling true real-time chat sync across multiple clients.
