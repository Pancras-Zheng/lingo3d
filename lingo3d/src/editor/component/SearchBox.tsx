import { useSignal } from "@preact/signals"
import { CSSProperties, useEffect } from "preact/compat"
import CloseIcon from "./icons/CloseIcon"
import TextInput from "./TextInput"

type SearchBoxProps = {
    style?: CSSProperties
    fullWidth?: boolean
    onChange?: (val: string) => void
    clearOnChange?: any
}

const SearchBox = ({
    style,
    fullWidth,
    onChange,
    clearOnChange
}: SearchBoxProps) => {
    const textSignal = useSignal("")

    useEffect(() => {
        textSignal.value = ""
    }, [clearOnChange])

    useEffect(() => {
        if (!textSignal.value) {
            onChange?.("")
            return
        }
        const timeout = setTimeout(
            () => onChange?.(textSignal.value.trim()),
            300
        )
        return () => {
            clearTimeout(timeout)
        }
    }, [textSignal.value])

    return (
        <div
            className="lingo3d-flexcenter"
            style={{
                width: "100%",
                flexShrink: 0,
                marginBottom: 8,
                ...style
            }}
        >
            <div
                style={{
                    display: "flex",
                    outline: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(255, 255, 255, 0.02)",
                    width: fullWidth ? "calc(100% - 2px)" : "calc(100% - 20px)"
                }}
            >
                <TextInput
                    style={{ flexGrow: 1, paddingLeft: 4 }}
                    placeholder="Search..."
                    textSignal={textSignal}
                    inputPadding={6}
                />
                <div
                    className="lingo3d-flexcenter"
                    style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        width: 22,
                        height: 22,
                        opacity: textSignal.value ? 1 : 0.2,
                        cursor: textSignal.value ? "pointer" : undefined
                    }}
                    onClick={() => (textSignal.value = "")}
                >
                    <CloseIcon />
                </div>
            </div>
        </div>
    )
}

export default SearchBox
