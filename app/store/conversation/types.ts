
export type Message = {
  id: string
  role: UserRole
  text: string
}

export enum UserRole {
  Assistant = 'ai',
  User = 'teacher',
}

export interface ConversationStore {
  conversation: Message[]

  addTeacherMessage: (message: string) => void
  addAiAgentMessage: (message: string) => void
  clearConversation: () => void
}