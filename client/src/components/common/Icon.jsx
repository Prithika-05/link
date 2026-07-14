const paths = {
    lock: <>
        <rect x="5" y="10" width="14" height="10" rx="2"/>
        <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
        <path d="M12 14v2"/>
    </>,
    arrowRight: <>
        <path d="M5 12h14"/>
        <path d="m13 6 6 6-6 6"/>
    </>,
    arrowLeft: <>
        <path d="M19 12H5"/>
        <path d="m11 18-6-6 6-6"/>
    </>,
    check: <path d="m5 12 4 4L19 6"/>,
    shield: <>
        <path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/>
        <path d="m8.5 12 2.2 2.2 4.8-5"/>
    </>,
    key: <>
        <circle cx="8" cy="15" r="3"/>
        <path d="m10.2 12.8 7.3-7.3 2 2-1.5 1.5 1.4 1.4-1.8 1.8-1.4-1.4-3.9 3.9"/>
    </>,
    message: <path
        d="M20 11.5a7.4 7.4 0 0 1-7.7 7.2 8.5 8.5 0 0 1-3.7-.9L4 19l1.2-3.7A6.9 6.9 0 0 1 4.3 12 7.4 7.4 0 0 1 12 4.8a7.4 7.4 0 0 1 8 6.7Z"/>,
    users: <>
        <path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20"/>
        <circle cx="10" cy="7" r="3"/>
        <path d="M16 9.5a3 3 0 1 0-1.3-5.7M20 20v-1.5a4.5 4.5 0 0 0-2.8-4.2"/>
    </>,
    user: <>
        <circle cx="12" cy="8" r="4"/>
        <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>
    </>,
    settings: <>
        <circle cx="12" cy="12" r="3"/>
        <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3.1v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.2-2.2.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3.1h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3.1v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.4 1Z"/>
    </>,
    search: <>
        <circle cx="10.8" cy="10.8" r="6.8"/>
        <path d="m16 16 4 4"/>
    </>,
    send: <>
        <path d="m21 3-7 18-4-8-8-4 19-6Z"/>
        <path d="m10 13 5-5"/>
    </>,
    plus: <>
        <path d="M12 5v14M5 12h14"/>
    </>,
    paperclip: <path
        d="m20.5 11.5-7.7 7.7a5 5 0 0 1-7.1-7.1l7.3-7.3a3.5 3.5 0 0 1 5 5l-7.4 7.4a2 2 0 0 1-2.8-2.8l6.9-6.9"/>,
    smile: <>
        <circle cx="12" cy="12" r="9"/>
        <path d="M8.5 14.5a4.2 4.2 0 0 0 7 0M9 9h.01M15 9h.01"/>
    </>,
    more: <>
        <circle cx="5" cy="12" r="1" fill="currentColor"/>
        <circle cx="12" cy="12" r="1" fill="currentColor"/>
        <circle cx="19" cy="12" r="1" fill="currentColor"/>
    </>,
    logout: <>
        <path d="M10 5H5v14h5"/>
        <path d="m14 8 4 4-4 4M18 12H9"/>
    </>,
    bell: <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
    </>,
    copy: <>
        <rect x="9" y="9" width="11" height="11" rx="2"/>
        <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>
    </>,
    download: <>
        <path d="M12 3v12"/>
        <path d="m7 10 5 5 5-5"/>
        <path d="M5 21h14"/>
    </>,
    device: <>
        <rect x="4" y="3" width="16" height="13" rx="2"/>
        <path d="M8 21h8M12 16v5"/>
    </>,
    eye: <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
        <circle cx="12" cy="12" r="2.5"/>
    </>,
    x: <path d="m6 6 12 12M18 6 6 18"/>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    sparkles: <>
        <path d="m12 3-1 5-5 1 5 1 1 5 1-5 5-1-5-1-1-5ZM19 16l-.5 2.5L16 19l2.5.5L19 22l.5-2.5L22 19l-2.5-.5L19 16Z"/>
    </>,
}

export default function Icon({name, size = 20, strokeWidth = 1.8, className = ''}) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name] || paths.sparkles}
        </svg>
    )
}
