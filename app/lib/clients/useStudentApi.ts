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

    return {
        getStudentsList,
        searchStudents
    }
}
