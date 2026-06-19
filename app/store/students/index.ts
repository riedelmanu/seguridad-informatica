import { create } from 'zustand'
import { Student, StudentsStore } from './types'

export const useStudentsStore = create<StudentsStore>()(
  (set) => ({
    students: [],
    setStudents: (students: Student[]) => set({ students }),
    addStudent: (student: Student) => set((state) => ({ students: [student, ...state.students] })),
  }),
)

export type { Student }
