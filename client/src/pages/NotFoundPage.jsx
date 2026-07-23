import {Link} from 'react-router-dom'
import Brand from '../components/common/Brand'

export default function NotFoundPage() {
    return <main className="not-found"><Brand/><h1>Page not found</h1><p>The page you are looking for does not exist in
        this demo.</p><Link to="/" className="button button-primary">Back to home</Link></main>
}
