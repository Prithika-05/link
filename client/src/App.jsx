import {useEffect, useRef} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {forceLogout, restoreSession} from '../src/state/features/auth/authSlice'
import {loadContacts, resetContacts} from '../src/state/features/contacts/contactsSlice'
import {resetMessages} from '../src/state/features/messages/messagesSlice'
import {checkBackendHealth} from '../src/state/features/system/systemSlice'
import RealtimeProvider from "./providers/RealtimeProvider.jsx";
import AppRouter from "./routes/AppRouter.jsx";

export default function App() {
    const dispatch = useDispatch()
    const userId = useSelector((state) => state.auth.user?.id)
    const started = useRef(false)

    useEffect(() => {
        if (started.current) return
        started.current = true
        dispatch(restoreSession())
        dispatch(checkBackendHealth())
    }, [dispatch])

    useEffect(() => {
        if (userId) {
            console.log("Loading contacts for:", userId)
            dispatch(loadContacts(userId))
        }
    }, [dispatch, userId])

    useEffect(() => {
        if (userId) {
            console.log("Current logged in user:", userId)
            dispatch(loadContacts(userId))
        }
    }, [dispatch, userId])

    useEffect(() => {
        const handleUnauthorized = () => {
            dispatch(forceLogout())
            dispatch(resetContacts())
            dispatch(resetMessages())
        }

        window.addEventListener('linkchat:unauthorized', handleUnauthorized)
        return () =>
            window.removeEventListener('linkchat:unauthorized', handleUnauthorized)
    }, [dispatch])

    return (
        <RealtimeProvider>
            <AppRouter/>
        </RealtimeProvider>
    )
}
