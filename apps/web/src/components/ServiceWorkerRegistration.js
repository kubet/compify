'use client';

import { useEffect } from 'react';
import { cdnUrl } from '@/constains';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
            navigator.serviceWorker.register(`/service-worker.js?cdn=${encodeURIComponent(cdnUrl)}`)
                .catch(error => console.error('Service Worker registration failed:', error));
        }
    }, []);

    return null;
} 