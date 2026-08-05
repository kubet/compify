"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : {};
        }
        return {};
    });

    const isSignedIn = !!user.email;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser, isSignedIn }}>
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
        const { isSignedIn } = useUser();
        const router = useRouter();
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            if (!isSignedIn) {
                router.push('/login');
            } else {
                setIsLoading(false);
            }
        }, [isSignedIn, router]);

        if (isLoading) {
            return null; // or a loading spinner
        }

        return <WrappedComponent {...props} />;
    };
}
