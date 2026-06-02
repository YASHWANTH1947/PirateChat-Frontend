import api from "./axios";

const getCurrentUser = async () => {
  try {
    const response = await api.get("/user/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
};

const searchUserByName = async (query) => {
  try {
    const response = await api.get("/user/search", {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching user by name:", error);
    throw error;
  }
};

const getUserByClerkId = async (clerkId) => {
  try {
    const response = await api.get(`/user/${clerkId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user by Clerk id:", error);
    throw error;
  }
};

export { getCurrentUser, searchUserByName, getUserByClerkId };
