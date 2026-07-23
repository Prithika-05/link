import {useEffect, useState} from 'react'
import {useSelector} from 'react-redux'
import {Navigate, Outlet} from 'react-router-dom'
import {LoadingScreen} from '../components/common/UI'
import {hasStoredKeyPair} from '../services/cryptoService'

export default function KeyProtectedRoute() {
    const userId = useSelector((state) => state.auth.user?.id)
    const [status, setStatus] = useState('checking')

    useEffect(() => {
        let active = true

        hasStoredKeyPair(userId)
            .then((exists) => active && setStatus(exists ? 'ready' : 'missing'))
            .catch(() => active && setStatus('missing'))

        return () => {
            active = false
        }
    }, [userId])

    if (status === 'checking') {
        return <LoadingScreen label="Checking this device’s encryption key…"/>
    }

    if (status === 'missing') return <Navigate to="/setup" replace/>
    return <Outlet/>
}
