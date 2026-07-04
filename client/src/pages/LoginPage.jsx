import {Link, useNavigate} from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import {Button, TextInput} from '../components/UI'

export default function LoginPage() {
    const navigate = useNavigate()
    const submit = (event) => {
        event.preventDefault();
        navigate('/dashboard')
    }
    return (
        <AuthLayout>
            <div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h1>Log in to CipherChat</h1>
                <p>Enter your details to continue your protected conversations.</p></div>
            <form className="auth-form" onSubmit={submit}>
                <TextInput label="Email address" type="email" placeholder="you@example.com" autoComplete="email"/>
                <TextInput label="Password" type="password" placeholder="Enter your password"
                           autoComplete="current-password"/>
                <div className="form-row"><label className="checkbox-row"><input
                    type="checkbox"/><span>Remember me</span></label>
                    <button type="button" className="inline-link">Forgot password?</button>
                </div>
                <Button type="submit" iconRight="arrowRight" className="auth-submit">Log in</Button>
            </form>
            <p className="auth-switch">New to CipherChat? <Link to="/register">Create an account</Link></p>
        </AuthLayout>
    )
}
