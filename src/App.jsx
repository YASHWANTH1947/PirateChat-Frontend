import { useEffect, useMemo, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setApiTokenGetter } from "./api/axios";
import { createConversation, getConversations } from "./api/conversations.api";
import { createMessage, getMessages } from "./api/messages.api";
import { getCurrentUser, searchUserByName } from "./api/users.api";
import { connectSocket, disconnectSocket, on } from "./websockets/socket";
import "./App.css";

const getErrorMessage = (error) =>
  error?.response?.data?.error || error?.message || "Something went wrong";

const formatParticipant = (clerkId) =>
  clerkId ? `${clerkId.slice(0, 7)}...${clerkId.slice(-4)}` : "Unknown user";

function SignedOutScreen() {
  return (
    <main className="auth-screen">
      <section className="auth-copy">
        <p className="eyebrow">PirateChat</p>
        <h1>Private chats for your crew</h1>
        <p>
          Sign in to search users, open conversations, and send messages through
          the PirateChat API.
        </p>
        <div className="auth-actions">
          <SignInButton mode="modal">
            <button type="button" className="primary-button">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" className="secondary-button">
              Create account
            </button>
          </SignUpButton>
        </div>
      </section>
    </main>
  );
}

function ChatApp() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    setApiTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    let active = true;
    const initSocket = async () => {
      try {
        const token = await getToken();
        if (token && active) {
          connectSocket(token);
        }
      } catch (err) {
        console.error("Failed to connect websocket:", err);
      }
    };
    initSocket();

    return () => {
      active = false;
      disconnectSocket();
    };
  }, [getToken]);

  useEffect(() => {
    const unsubscribe = on("NEW_MESSAGE", (newMessage) => {
      console.log("WebSocket: Received new message:", newMessage);
      queryClient.invalidateQueries({
        queryKey: ["messages", newMessage.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const searchQuery = useQuery({
    queryKey: ["users", "search", search.trim()],
    queryFn: () => searchUserByName(search.trim()),
    enabled: search.trim().length >= 2,
  });

  const selectedConversation = useMemo(() => {
    return conversationsQuery.data?.find(
      (conversation) => conversation._id === selectedConversationId,
    );
  }, [conversationsQuery.data, selectedConversationId]);

  const messagesQuery = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: () => getMessages(selectedConversationId),
    enabled: Boolean(selectedConversationId),
  });

  const createConversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConversationId(conversation._id);
      setSearch("");
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedConversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const currentClerkId = currentUserQuery.data?.clerkId || clerkUser?.id;
  const searchResults = Array.isArray(searchQuery.data) ? searchQuery.data : [];
  const conversations = conversationsQuery.data || [];

  const handleSendMessage = (event) => {
    event.preventDefault();
    const text = messageText.trim();

    if (!selectedConversationId || !text) {
      return;
    }

    createMessageMutation.mutate({
      conversationId: selectedConversationId,
      text,
    });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PirateChat</p>
          <h1>Messages</h1>
        </div>
        <UserButton />
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="panel-header">
            <div>
              <p className="section-label">Signed in as</p>
              <strong>
                {currentUserQuery.data?.username || clerkUser?.username}
              </strong>
            </div>
            {currentUserQuery.isError && (
              <span className="status-pill error">API offline</span>
            )}
          </div>

          <label className="search-box">
            <span>Find a user</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username"
            />
          </label>

          {search.trim().length >= 2 && (
            <div className="search-results">
              {searchQuery.isLoading && <p>Searching...</p>}
              {searchQuery.isError && (
                <p className="error-text">{getErrorMessage(searchQuery.error)}</p>
              )}
              {searchResults.map((result) => (
                <button
                  type="button"
                  className="user-row"
                  key={result.clerkId}
                  onClick={() => createConversationMutation.mutate(result.clerkId)}
                  disabled={createConversationMutation.isPending}
                >
                  <img
                    src={result.avatarUrl || clerkUser?.imageUrl}
                    alt=""
                    className="avatar"
                  />
                  <span>{result.username}</span>
                </button>
              ))}
              {!searchQuery.isLoading &&
                !searchQuery.isError &&
                searchResults.length === 0 && <p>No users found.</p>}
            </div>
          )}

          <div className="conversation-list">
            <p className="section-label">Conversations</p>
            {conversationsQuery.isLoading && <p>Loading conversations...</p>}
            {conversationsQuery.isError && (
              <p className="error-text">
                {getErrorMessage(conversationsQuery.error)}
              </p>
            )}
            {conversations.map((conversation) => {
              const otherParticipant =
                conversation.participants?.find((id) => id !== currentClerkId) ||
                conversation.participants?.[0];

              return (
                <button
                  type="button"
                  className={
                    selectedConversationId === conversation._id
                      ? "conversation active"
                      : "conversation"
                  }
                  key={conversation._id}
                  onClick={() => setSelectedConversationId(conversation._id)}
                >
                  <span>{formatParticipant(otherParticipant)}</span>
                  <small>{conversation.lastMessage?.text || "No messages yet"}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="chat-panel">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div>
                  <p className="section-label">Conversation</p>
                  <h2>{formatParticipant(selectedConversationId)}</h2>
                </div>
                <span className="status-pill">Live API</span>
              </div>

              <div className="message-list">
                {messagesQuery.isLoading && <p>Loading messages...</p>}
                {messagesQuery.isError && (
                  <p className="error-text">{getErrorMessage(messagesQuery.error)}</p>
                )}
                {(messagesQuery.data || []).map((message) => (
                  <article
                    className={
                      message.senderId === currentClerkId
                        ? "message mine"
                        : "message"
                    }
                    key={message._id}
                  >
                    <p>{message.text}</p>
                  </article>
                ))}
                {!messagesQuery.isLoading &&
                  !messagesQuery.isError &&
                  (messagesQuery.data || []).length === 0 && (
                    <p className="empty-state">Start the conversation.</p>
                  )}
              </div>

              <form className="composer" onSubmit={handleSendMessage}>
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Write a message"
                />
                <button
                  type="submit"
                  className="primary-button"
                  disabled={!messageText.trim() || createMessageMutation.isPending}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat">
              <p className="eyebrow">Ready</p>
              <h2>Select a conversation</h2>
              <p>Search for another user or open an existing chat.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function App() {
  return (
    <>
      <SignedOut>
        <SignedOutScreen />
      </SignedOut>
      <SignedIn>
        <ChatApp />
      </SignedIn>
    </>
  );
}

export default App;
