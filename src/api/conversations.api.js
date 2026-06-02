import api from "./axios";

const getConversations = async () => {
  try {
    const response = await api.get("/conversations");
    return response.data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

const createConversation = async (recipentId) => {
  try {
    const response = await api.post("/conversations", {
      participantId: recipentId,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export { getConversations, createConversation };
