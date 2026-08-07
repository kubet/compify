"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { whoAmI } from '@/lib/api';

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const hydrateSession = async () => {
            const response = await whoAmI();
            if (cancelled) return;
            setUser(response.status === 200 ? response.data : {});
            setIsAuthLoading(false);
        };
        hydrateSession();
        return () => {
            cancelled = true;
        };
    }, []);

    const isSignedIn = !isAuthLoading && !!user.email;

    return (
        <UserContext.Provider value={{ user, setUser, isSignedIn, isAuthLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export function useUser() {
    const context = useContext(UserContext);

    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }

    return context;
}

export function withAuth(WrappedComponent) {
    return function AuthComponent(props) {
        const { isSignedIn, isAuthLoading } = useUser();
        const router = useRouter();

        useEffect(() => {
            if (!isAuthLoading && !isSignedIn) {
                router.push('/login');
            }
        }, [isAuthLoading, isSignedIn, router]);

        if (isAuthLoading || !isSignedIn) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}
