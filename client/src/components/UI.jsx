import Icon from './Icon'

export function Button({children, variant = 'primary', icon, iconRight, className = '', ...props}) {
    return (
        <button className={`button button-${variant} ${className}`} {...props}>
            {icon && <Icon name={icon} size={18}/>}
            <span>{children}</span>
            {iconRight && <Icon name={iconRight} size={18}/>}
        </button>
    )
}

export function TextInput({label, icon, helper, className = '', ...props}) {
    return (
        <label className={`field ${className}`}>
            {label && <span className="field-label">{label}</span>}
            <span className="input-wrap">
        {icon && <Icon name={icon} size={18}/>}
                <input {...props} />
      </span>
            {helper && <span className="field-helper">{helper}</span>}
        </label>
    )
}

export function Avatar({initials, color = 'violet', size = 'md', online = false}) {
    return (
        <span className={`avatar avatar-${color} avatar-${size}`}>
      {initials}
            {online && <i className="online-dot"/>}
    </span>
    )
}

export function Toggle({checked, onChange, label, description}) {
    return (
        <label className="toggle-row">
      <span>
        <strong>{label}</strong>
          {description && <small>{description}</small>}
      </span>
            <input type="checkbox" checked={checked} onChange={onChange}/>
            <span className="toggle-track" aria-hidden="true"><i/></span>
        </label>
    )
}

export function SectionHeading({eyebrow, title, description}) {
    return (
        <div className="section-heading">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {description && <p>{description}</p>}
        </div>
    )
}
