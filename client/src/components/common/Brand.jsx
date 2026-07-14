import {Link} from 'react-router-dom'
import Icon from './Icon'

export default function Brand({compact = false}) {
    return (
        <Link to="/" className="brand" aria-label="CipherChat home">
      <span className="brand-mark">
        <Icon name="lock" size={19} strokeWidth={2.1}/>
      </span>
            {!compact && <span>CipherChat</span>}
        </Link>
    )
}
