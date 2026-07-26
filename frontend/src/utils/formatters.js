export function formatMessageTime(value) {
    if (!value) return ''

    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

export function formatMessageDate(value) {
    if (!value) return ''

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
    }).format(new Date(value))
}

export function truncateId(value, length = 12) {
    if (!value || value.length <= length) return value
    return `${value.slice(0, length)}…`
}
