import {useSelector} from 'react-redux'
import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {LoadingScreen} from '../components/common/UI'

export default function ProtectedRoute() {
    const {token, user, status} = useSelector((state) => state.auth)
    const location = useLocation()

    if (status === 'restoring') {
        return <LoadingScreen label="Restoring your secure session…"/>
    }

    if (!token || !user) {
        return <Navigate to="/login" state={{from: location}} replace/>
    }

    return <Outlet/>
}
