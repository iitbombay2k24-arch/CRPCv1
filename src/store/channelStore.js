// Channel Store — manages channels, messages, and active state
import { create } from 'zustand';

const useChannelStore = create((set, get) => ({
  channels: [],
  channelMap: {},       // channelName -> firestoreDocId
  channelsData: {},     // channelName -> { type, description, isLocked }
  activeChannel: null,
  messages: [],
  isLoading: false,
  activeThreadId: null,
  threadMessages: [],

  setChannels: (fbChannels) => {
    const names = fbChannels.map(ch => ch.name);
    const map = {};
    const details = {};
    fbChannels.forEach(ch => {
      map[ch.name] = ch.id;
      details[ch.name] = {
        type: ch.type || 'general',
        description: ch.description,
        isLocked: ch.isLocked,
        isAssignment: ch.isAssignment,
      };
    });
    const current = get().activeChannel;
    set({
      channels: names, channelMap: map, channelsData: details,
      activeChannel: names.includes(current) ? current : names[0] || null,
    });
  },

  setActiveChannel: (name) => set({ activeChannel: name, activeThreadId: null }),
  setMessages: (messages) => set({ messages }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setThreadMessages: (msgs) => set({ threadMessages: msgs }),
  getActiveChannelId: () => get().channelMap[get().activeChannel] || null,
  isCurrentChannelLocked: () => get().channelsData[get().activeChannel]?.isLocked || false,
}));

export default useChannelStore;
