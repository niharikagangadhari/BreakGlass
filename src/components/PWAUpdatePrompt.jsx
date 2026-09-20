import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Registers the service worker and shows two small banners:
 *
 *  1. "Ready to work offline"  — first successful precache
 *  2. "New version available"  — an update is waiting
 *
 * The update is NEVER applied automatically. A Break Glass session is
 * time-boxed; reloading the tab under the user mid-incident would be hostile.
 * The user chooses when to reload.
 */
export default function PWAUpdatePrompt() {
    const [online, setOnline] = useState(navigator.onLine)

    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, registration) {
            // Check for a new build every hour while the app stays open.
            if (!registration) return
            setInterval(
                () => {
                    if (navigator.onLine) registration.update()
                },
                60 * 60 * 1000,
            )
        },
        onRegisterError(error) {
            console.error('[pwa] service worker registration failed', error)
        },
    })

    useEffect(() => {
        const up = () => setOnline(true)
        const down = () => setOnline(false)
        window.addEventListener('online', up)
        window.addEventListener('offline', down)
        return () => {
            window.removeEventListener('online', up)
            window.removeEventListener('offline', down)
        }
    }, [])

    // Auto-dismiss the "offline ready" toast.
    useEffect(() => {
        if (!offlineReady) return
        const t = setTimeout(() => setOfflineReady(false), 6000)
        return () => clearTimeout(t)
    }, [offlineReady, setOfflineReady])

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4">
            {!online && (
                <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-security-pending/40 bg-navy-800/95 px-4 py-2 font-mono text-xs text-security-pending shadow-lg backdrop-blur">
                    <span className="inline-block h-2 w-2 rounded-full bg-security-pending" />
                    OFFLINE MODE — local database active
                </div>
            )}

            {offlineReady && (
                <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-security-active/40 bg-navy-800/95 px-4 py-2 font-mono text-xs text-security-active shadow-lg backdrop-blur">
                    <span className="inline-block h-2 w-2 rounded-full bg-security-active" />
                    Application cached — ready to work offline
                </div>
            )}

            {needRefresh && (
                <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-lg border border-navy-600 bg-navy-800/95 px-4 py-3 text-sm text-slate-100 shadow-lg backdrop-blur">
                    <span>A new version of Break Glass is available.</span>
                    <button
                        type="button"
                        onClick={() => updateServiceWorker(true)}
                        className="rounded-md bg-emergency px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emergency-hover"
                    >
                        Reload now
                    </button>
                    <button
                        type="button"
                        onClick={() => setNeedRefresh(false)}
                        className="rounded-md border border-navy-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-navy-700"
                    >
                        Later
                    </button>
                </div>
            )}
        </div>
    )
}
