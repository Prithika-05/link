import Icon from './Icon'

export function Button({
                           children,
                           variant = 'primary',
                           icon,
                           iconRight,
                           className = '',
                           loading = false,
                           disabled,
                           ...props
                       }) {
    return (
        <button
            className={`button button-${variant} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="button-spinner" aria-hidden="true"/>
            ) : (
                icon && <Icon name={icon} size={18}/>
            )}
            <span>{children}</span>
            {!loading && iconRight && <Icon name={iconRight} size={18}/>}
        </button>
    )
}

export function TextInput({
                              label,
                              icon,
                              helper,
                              error,
                              className = '',
                              ...props
                          }) {
    return (
        <label className={`field ${className}`}>
            {label && <span className="field-label">{label}</span>}
            <span className={`input-wrap ${error ? 'input-error' : ''}`}>
        {icon && <Icon name={icon} size={18}/>}
                <input {...props} />
      </span>
            {error ? (
                <span className="field-error">{error}</span>
            ) : (
                helper && <span className="field-helper">{helper}</span>
            )}
        </label>
    )
}

export function Avatar({
                           initials,
                           color = 'violet',
                           size = 'md',
                           online = false,
                       }) {
    return (
        <span className={`avatar avatar-${color} avatar-${size}`}>
      {initials}
            {online && <i className="online-dot"/>}
    </span>
    )
}

export function Toggle({checked, onChange, label, description, disabled}) {
    return (
        <label className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <span>
        <strong>{label}</strong>
          {description && <small>{description}</small>}
      </span>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
            />
            <span className="toggle-track" aria-hidden="true">
        <i/>
      </span>
        </label>
    )
}

export function Alert({children, type = 'error', onDismiss}) {
    return (
        <div className={`app-alert app-alert-${type}`} role="alert">
            <span>{children}</span>
            {onDismiss && (
                <button type="button" onClick={onDismiss} aria-label="Dismiss alert">
                    <Icon name="x" size={16}/>
                </button>
            )}
        </div>
    )
}

export function LoadingScreen({label = 'Loading LinkChat…'}) {
    return (
        <main className="loading-screen">
      <span className="loading-mark">
        <Icon name="lock" size={24}/>
      </span>
            <span className="loading-spinner"/>
            <p>{label}</p>
        </main>
    )
}

export function EmptyState({icon = 'message', title, description, action}) {
    return (
        <div className="empty-state">
            <span><Icon name={icon} size={26}/></span>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            {action}
        </div>
    )
}

export function Modal({title, children, onClose}) {
    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header>
                    <h2>{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close dialog">
                        <Icon name="x" size={19}/>
                    </button>
                </header>
                {children}
            </section>
        </div>
    )
}
