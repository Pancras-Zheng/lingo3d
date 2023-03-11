import { useState } from "preact/hooks"

type MenuItemProps = {
    disabled?: boolean
    onClick?: (e: MouseEvent) => void
    children: string
}

const ContextMenuItem = ({ disabled, onClick, children }: MenuItemProps) => {
    const [hover, setHover] = useState(false)

    return (
        <div
            style={{
                padding: 10,
                paddingLeft: 20,
                paddingRight: 20,
                whiteSpace: "nowrap",
                background:
                    !disabled && hover ? "rgba(255, 255, 255, 0.1)" : undefined,
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? undefined : "pointer"
            }}
            onClick={disabled ? undefined : onClick}
            onMouseEnter={disabled ? undefined : () => setHover(true)}
            onMouseLeave={disabled ? undefined : () => setHover(false)}
        >
            {children}
        </div>
    )
}
export default ContextMenuItem
