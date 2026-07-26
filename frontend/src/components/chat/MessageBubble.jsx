import {Avatar} from '../common/UI'
import Icon from '../common/Icon'
import {formatMessageTime} from '../../utils/formatters'

export default function MessageBubble({message, contact, outgoing}) {
    return (
        <article className={`message-row ${outgoing ? 'outgoing' : 'incoming'}`}>
            {!outgoing && (
                <Avatar
                    initials={contact.initials}
                    color={contact.color}
                    size="xs"
                />
            )}
            <div className={`message-bubble ${message.decryptionFailed ? 'message-failed' : ''}`}>
                {message.text}
                <small>
                    {formatMessageTime(message.createdAt)}
                    {outgoing && <Icon name="check" size={13}/>}
                </small>
            </div>
        </article>
    )
}
