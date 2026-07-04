import {BrowserRouter, Route, Routes} from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    )
}
