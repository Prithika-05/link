import {useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Link, useLocation, useNavigate} from 'react-router-dom'
import {Alert, Button, TextInput} from '../components/common/UI'
import {clearAuthError, loginAccount} from '../state/features/auth/authSlice'
import AuthLayout from '../layouts/AuthLayout'
import {hasStoredKeyPair} from '../services/cryptoService'

export default function LoginPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const {status, error} = useSelector((state) => state.auth)
    const [form, setForm] = useState({
        email: '',
        password: '',
        remember: true,
    })

    const update = (field) => (event) => {
        dispatch(clearAuthError())
        const value = field === 'remember' ? event.target.checked : event.target.value
        setForm((current) => ({...current, [field]: value}))
    }

    const submit = async (event) => {
        event.preventDefault()
        const result = await dispatch(loginAccount(form))

        if (!loginAccount.fulfilled.match(result)) return

        const hasKey = await hasStoredKeyPair(result.payload.user.id)
        const requestedPath = location.state?.from?.pathname
        navigate(hasKey ? requestedPath || '/dashboard' : '/setup', {replace: true})
    }

    return (
        <AuthLayout>
            <div className="auth-heading">
                <span className="eyebrow">WELCOME BACK</span>
                <h1>Log in to CipherChat</h1>
                <p>Enter your details to continue your protected conversations.</p>
            </div>
            <form className="auth-form" onSubmit={submit}>
                {error && <Alert onDismiss={() => dispatch(clearAuthError())}>{error}</Alert>}
                <TextInput
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                />
                <TextInput
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={update('password')}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                />
                <div className="form-row">
                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={form.remember}
                            onChange={update('remember')}
                        />
                        <span>Remember me</span>
                    </label>
                    <span className="unsupported-note">Password reset API not available</span>
                </div>
                <Button
                    type="submit"
                    iconRight="arrowRight"
                    className="auth-submit"
                    loading={status === 'loading'}
                >
                    Log in
                </Button>
            </form>
            <p className="auth-switch">
                New to CipherChat? <Link to="/register">Create an account</Link>
            </p>
        </AuthLayout>
    )
}
