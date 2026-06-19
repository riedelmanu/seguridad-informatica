'use client'

import { useCallback } from 'react'
import { api } from '@/app/lib/api'
import { GetStudentsListResponse } from '@/application/query/GetStudentsListHandler'
import { GetStudentsSearchResponse } from '@/application/query/GetStudentsSearchHandler'
import { CreateStudentCommand, CreateStudentResponse } from '@/application/command/CreateStudentHandler'

const BASE_URL = '/api/students/list'
const SEARCH_URL = '/api/students/search'
const STUDENTS_URL = '/api/students'

export const useStudentApi = () => {
    const getStudentsList = useCallback(async (): Promise<GetStudentsListResponse> => {
        return api.get<GetStudentsListResponse>(BASE_URL)
    }, [])

    const searchStudents = useCallback(async (criterio: string): Promise<GetStudentsSearchResponse> => {
        return api.get<GetStudentsSearchResponse>(`${SEARCH_URL}?criterio=${encodeURIComponent(criterio)}`)
    }, [])

    const getStudentDetail = useCallback(async (studentId: number): Promise<{ detail: string | null }> => {
        return api.get<{ detail: string | null }>(`/api/students/${studentId}/detail`)
    }, [])

    const updateStudentDetail = useCallback(async (studentId: number, detail: string): Promise<{ success: boolean }> => {
        return api.patch<{ success: boolean }>(`/api/students/${studentId}/detail`, { detail })
    }, [])

    const createStudent = useCallback(async (input: CreateStudentCommand): Promise<CreateStudentResponse> => {
        return api.post<CreateStudentResponse>(STUDENTS_URL, { ...input })
    }, [])

    return {
        getStudentsList,
        searchStudents,
        getStudentDetail,
        updateStudentDetail,
        createStudent
    }
}
