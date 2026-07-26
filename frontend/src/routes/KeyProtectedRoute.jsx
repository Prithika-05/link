import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../components/common/UI';
import { hasStoredKeyPair } from '../services/cryptoService';

export default function KeyProtectedRoute() {
    const publicId = useSelector((state) => state.auth.user?.publicId);
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        let active = true;

        if (!publicId) {
            console.log("No publicId yet");
            return;
        }

        hasStoredKeyPair(publicId)
            .then((exists) => {
                if (active) {
                    setStatus(exists ? "ready" : "missing");
                }
            })
            .catch(console.error);

        return () => {
            active = false;
        };
    }, [publicId]);

    if (status === 'checking') {
        return <LoadingScreen label="Checking this device’s encryption key…" />;
    }

    if (status === 'missing') {
        return <Navigate to="/setup" replace />;
    }

    return <Outlet />;
}