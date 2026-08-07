'use client'
import DesignTokenWrapperStep from '@/components/Project/Steps/DesignTokenWrapperStep'
import SimpleAi from '@/components/Project/Steps/SimpleAi'
import ThemeSelectionInterface from '@/components/Project/Steps/ThemeSelectionInterface'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useState, useEffect, Suspense, useRef } from 'react'
import { getTheme, insertTheme } from '@/lib/api'
import { Toast } from '@/components/Elements'

const ThemeContent = () => {
    const [currentStep, setCurrentStep] = useState('custom')
    const [themeData, setThemeData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' })
    const router = useRouter()
    const searchParams = useSearchParams();
    const t = useRef(null)
    const c = useRef(null)
    const [themeId, setThemeId] = useState(null)

    const fetchTheme = useCallback(async (themeIdToFetch) => {
        if (themeIdToFetch) {
            setIsLoading(true)
            try {
                const response = await getTheme(themeIdToFetch)
                if (response.status === 200) {
                    setThemeData(response.data)
                    setCurrentStep('custom')
                } else {
                    setThemeData(null)
                    setThemeId(null)
                }
            } catch (error) {
                setToastMsg({ text: 'Failed to load theme', type: 'error' })
            }
            setIsLoading(false)
        }
    }, [])

    // Use effect just to initialize
    useEffect(() => {
        c.current = searchParams.get('c')
        setThemeId(searchParams.get('t'))
        fetchTheme(searchParams.get('t'))
    }, [fetchTheme, searchParams])

    const handleSaveTheme = async (themeDetails) => {
        setIsLoading(true)
        try {
            const data = {
                ...themeDetails,
                componentId: c.current,
                id: themeId
            }

            const response = await insertTheme(data)

            if (response.status === 201) {
                setToastMsg({ text: themeId ? 'Theme updated successfully' : 'Theme created successfully', type: 'success' })
                await router.push(`/theme?t=${response.data.id}&c=${c.current}`)
                setThemeId(response.data.id)
                await fetchTheme(response.data.id) // Fetch the updated theme directly
            } else {
                setToastMsg({ text: 'Failed to save theme', type: 'error' })
            }
        } catch (error) {
            setToastMsg({ text: 'Failed to save theme', type: 'error' })
        }
        setIsLoading(false)
    }

    const renderStep = (step) => {
        switch (step) {
            //     case 'template':
            //         return <ThemeSelectionInterface
            //             onSelectOption={(step) => setCurrentStep(step)}
            //             initialData={themeData}
            //         />
            case 'custom':
                return <DesignTokenWrapperStep
                    handleNext={(themeDetails) => {
                        handleSaveTheme(themeDetails)
                    }}
                    initialData={themeData}
                />
            // case 'ai':
            //     return <SimpleAi />
            default:
                return null
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-[calc(100vh-128px)]">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    }

    return (
        <div className="flex flex-col items-center justify-between px-4 mt-8 mx-auto w-full max-w-7xl">
            <div className="w-full flex flex-col h-[calc(100vh-128px)] ">
                {renderStep(currentStep)}
            </div>
            {toastMsg.text && <Toast
                message={toastMsg.text}
                type={toastMsg.type}
                onClose={() => setToastMsg({ text: '', type: 'success' })}
            />}
        </div>
    )
}

const Page = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-128px)]">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>}>
            <ThemeContent />
        </Suspense>
    )
}

export default Page