'use client'
import { createContext, useContext } from 'react'

export interface Business { id: string; name: string; email: string; plan: string }
export const BizContext = createContext<Business | null>(null)
export const useBusiness = () => useContext(BizContext)
