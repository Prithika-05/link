import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom'
import ContactsPage from '../pages/ContactsPage'
import DashboardPage from '../pages/DashboardPage'
import KeySetupPage from '../pages/KeySetupPage'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'
import SettingsPage from '../pages/SettingsPage'
import KeyProtectedRoute from './KeyProtectedRoute'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicOnlyRoute/>}>
                    <Route path="/" element={<LandingPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                </Route>

                <Route element={<ProtectedRoute/>}>
                    <Route path="/setup" element={<KeySetupPage/>}/>
                    <Route element={<KeyProtectedRoute/>}>
                        <Route path="/dashboard" element={<DashboardPage/>}/>
                        <Route path="/contacts" element={<ContactsPage/>}/>
                        <Route path="/profile" element={<ProfilePage/>}/>
                        <Route path="/settings" element={<SettingsPage/>}/>
                        <Route path="/home" element={<Navigate to="/dashboard" replace/>}/>
                    </Route>
                </Route>

                <Route path="*" element={<NotFoundPage/>}/>
            </Routes>
        </BrowserRouter>
    )
}
