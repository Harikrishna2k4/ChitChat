import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled:
    JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  // Toggle notification sound
  toggleSound: () => {
    const newValue = !get().isSoundEnabled;

    localStorage.setItem("isSoundEnabled", JSON.stringify(newValue));

    set({ isSoundEnabled: newValue });
  },

  // Change active tab
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Select a user
  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
      messages: [],
    });
  },

  // Get all contacts
  getAllContacts: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/contacts");

      set({ allContacts: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load contacts"
      );
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Get users with whom the current user has chatted
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/chats");

      set({ chats: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load chats"
      );
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages for a conversation
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      // Ignore a stale response if the user switched conversations.
      if (get().selectedUser?._id?.toString() !== userId.toString()) {
        return;
      }

      set({ messages: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load messages"
      );
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message and immediately display it
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedUser || !authUser) {
      toast.error("Select a conversation first");
      return;
    }

    const receiverId = selectedUser._id.toString();
    const senderId = authUser._id.toString();
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId,
      receiverId,
      text: messageData.text || "",
      image: messageData.image || null,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Display immediately without overwriting other state updates.
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const res = await axiosInstance.post(
        `/messages/send/${receiverId}`,
        messageData
      );

      const savedMessage = res.data;

      // Replace the temporary message with the saved message.
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId ? savedMessage : message
        ),
      }));
    } catch (error) {
      // Remove only the failed optimistic message.
      set((state) => ({
        messages: state.messages.filter(
          (message) => message._id !== tempId
        ),
      }));

      toast.error(
        error.response?.data?.message || "Failed to send message"
      );
    }
  },

  // Listen for messages received through Socket.IO
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      console.error("Socket is not connected");
      return;
    }

    // Prevent duplicate listeners.
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const currentSelectedUser = get().selectedUser;

      if (!currentSelectedUser) return;

      const normalizeId = (value) => {
        if (!value) return null;

        if (typeof value === "object") {
          return (value._id || value.id)?.toString() || null;
        }

        return value.toString();
      };

      const senderId = normalizeId(newMessage.senderId);
      const receiverId = normalizeId(newMessage.receiverId);
      const selectedUserId = normalizeId(currentSelectedUser._id);
      const currentUserId = normalizeId(
        useAuthStore.getState().authUser?._id
      );

      // Only add messages belonging to the open conversation.
      const belongsToCurrentChat =
        (senderId === selectedUserId &&
          receiverId === currentUserId) ||
        (senderId === currentUserId &&
          receiverId === selectedUserId);

      if (!belongsToCurrentChat) return;

      set((state) => {
        // Avoid adding a message that already exists.
        const alreadyExists = state.messages.some(
          (message) =>
            message._id?.toString() === newMessage._id?.toString()
        );

        if (alreadyExists) {
          return state;
        }

        return {
          messages: [...state.messages, newMessage],
        };
      });

      if (get().isSoundEnabled) {
        const notificationSound = new Audio(
          "/sounds/notification.mp3"
        );

        notificationSound.play().catch(() => {});
      }
    });
  },

  // Remove the Socket.IO listener
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (socket) {
      socket.off("newMessage");
    }
  },
}));