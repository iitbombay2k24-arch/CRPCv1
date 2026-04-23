// Channel Store — manages channels, messages, and active state
import { create } from 'zustand';

const useChannelStore = create((set, get) => ({
  channels: [],
  channelsData: {},     // channelId -> { name, type, description, isLocked }
  activeChannelId: null,
  messages: [],
  isLoading: false,
  activeThreadId: null,
  threadMessages: [],

  setChannels: (fbChannels) => {
    const details = {};
    fbChannels.forEach(ch => {
      details[ch.id] = {
        name: ch.name,
        type: ch.type || 'text',
        description: ch.description,
        isLocked: ch.isLocked,
        isAssignment: ch.isAssignment,
      };
    });
    
    const currentId = get().activeChannelId;
    const firstId = fbChannels[0]?.id || null;
    
    set({
      channels: fbChannels,
      channelsData: details,
      activeChannelId: fbChannels.find(c => c.id === currentId) ? currentId : firstId
    });
  },

  selectChannel: (id) => set({ activeChannelId: id, activeThreadId: null }),
  setMessages: (messages) => set({ messages }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setThreadMessages: (msgs) => set({ threadMessages: msgs }),
  getActiveChannelId: () => get().activeChannelId,
  isCurrentChannelLocked: () => get().channelsData[get().activeChannelId]?.isLocked || false,
}));

export default useChannelStore;
