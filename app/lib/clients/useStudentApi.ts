'use client'

import { api } from '@/app/lib/api'
import { GetStudentsListResponse } from '@/application/query/GetStudentsListHandler'

const BASE_URL = '/api/students/list'

export const useStudentApi = () => {
    const getStudentsList = async (): Promise<GetStudentsListResponse> => {
        return api.get<GetStudentsListResponse>(BASE_URL)
    }

    return {
        getStudentsList
    }
}
