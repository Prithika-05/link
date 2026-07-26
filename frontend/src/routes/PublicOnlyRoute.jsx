import {useSelector} from 'react-redux'
import {Navigate, Outlet} from 'react-router-dom'
import {LoadingScreen} from '../components/common/UI'

export default function PublicOnlyRoute() {
    const {token, user, status} = useSelector((state) => state.auth)

    if (status === 'restoring') return <LoadingScreen/>
    if (token && user) return <Navigate to="/dashboard" replace/>

    return <Outlet/>
}
