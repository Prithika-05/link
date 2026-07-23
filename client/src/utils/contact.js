const COLORS = ['violet', 'blue', 'rose', 'amber', 'emerald']

export function getInitials(name = '') {
    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')

    return initials || 'CC'
}

export function colorFromId(value = '') {
    const score = Array.from(value).reduce(
        (total, character) => total + character.charCodeAt(0),
        0,
    )
    return COLORS[score % COLORS.length]
}

export function fallbackContactName(userId = '') {
    return `User ${userId.slice(0, 8)}`
}
