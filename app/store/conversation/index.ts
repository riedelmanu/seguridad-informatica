import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ConversationStore, UserRole, Message } from './types'

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversation: [],

      addTeacherMessage: (message: string) => set({ conversation: [...get().conversation, { id:crypto.randomUUID(), text: message, role: UserRole.User }] }),
      addAiAgentMessage: (message: string) => set({ conversation: [...get().conversation, { id:crypto.randomUUID(), text: message, role: UserRole.Assistant }] }),
      clearConversation: () => set({ conversation: [] }),
      
    }),
    {
      name: 'conversation-store',
    }
  )
)

export { UserRole }
export type { Message }
