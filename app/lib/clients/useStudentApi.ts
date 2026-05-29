'use client'

import { useCallback } from 'react'
import { api } from '@/app/lib/api'
import { GetStudentsListResponse } from '@/application/query/GetStudentsListHandler'
import { GetStudentsSearchResponse } from '@/application/query/GetStudentsSearchHandler'

const BASE_URL = '/api/students/list'
const SEARCH_URL = '/api/students/search'

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

    return {
        getStudentsList,
        searchStudents,
        getStudentDetail,
        updateStudentDetail
    }
}
