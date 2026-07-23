import {useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Link, useNavigate} from 'react-router-dom'
import {Alert, Button, TextInput} from '../components/common/UI'
import {clearAuthError, registerAccount} from '../state/features/auth/authSlice'
import AuthLayout from '../layouts/AuthLayout'

export default function RegisterPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const {status, error} = useSelector((state) => state.auth)
    const [validationError, setValidationError] = useState('')
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    })

    const update = (field) => (event) => {
        dispatch(clearAuthError())
        setValidationError('')
        setForm((current) => ({...current, [field]: event.target.value}))
    }

    const submit = async (event) => {
        event.preventDefault()

        if (form.password !== form.confirmPassword) {
            setValidationError('Passwords do not match.')
            return
        }

        const result = await dispatch(
            registerAccount({
                username: form.username,
                email: form.email,
                password: form.password,
            }),
        )

        if (registerAccount.fulfilled.match(result)) {
            navigate('/setup', {replace: true})
        }
    }

    return (
        <AuthLayout>
            <div className="auth-heading">
                <span className="eyebrow">GET STARTED</span>
                <h1>Create your account</h1>
                <p>Register, create a device key, and start encrypted conversations.</p>
            </div>
            <form className="auth-form" onSubmit={submit}>
                {(error || validationError) && (
                    <Alert onDismiss={() => setValidationError('')}>
                        {validationError || error}
                    </Alert>
                )}
                <TextInput
                    label="Username"
                    value={form.username}
                    onChange={update('username')}
                    placeholder="Choose a username"
                    autoComplete="username"
                    minLength={3}
                    maxLength={30}
                    required
                />
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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    helper="Use at least 8 characters."
                    required
                />
                <TextInput
                    label="Confirm password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={update('confirmPassword')}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                />
                <label className="checkbox-row">
                    <input type="checkbox" required/>
                    <span>I understand the private key remains on this browser.</span>
                </label>
                <Button
                    type="submit"
                    iconRight="arrowRight"
                    className="auth-submit"
                    loading={status === 'loading'}
                >
                    Create account
                </Button>
            </form>
            <p className="auth-switch">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </AuthLayout>
    )
}
