import api from "./axios";

const getMessages = async (conversationId) => {
  try {
    const response = await api.get(
      `/messages/conversations/${conversationId}/messages`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

const createMessage = async ({ conversationId, text }) => {
  try {
    const response = await api.post(
      `/messages/conversations/${conversationId}/messages`,
      { text },
    );
    return response.data;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

export { getMessages, createMessage };
