import { createEffect } from "@lincode/reactivity"
import openFolder from "../../api/files/openFolder"
import saveJSON from "../../api/files/saveJSON"
import { redo, undo } from "../../api/undoStack"
import { isPositionedManager } from "../../display/core/PositionedManager"
import deleteSelected from "./deleteSelected"
import { emitEditorCenterView } from "../../events/onEditorCenterView"
import { onKeyClear } from "../../events/onKeyClear"
import { emitSelectionTarget } from "../../events/onSelectionTarget"
import { setEditorCamera, getEditorCamera } from "../../states/useEditorCamera"
import { setMultipleSelection } from "../../states/useMultipleSelection"
import { getSelectionTarget } from "../../states/useSelectionTarget"
import { getSplitView, setSplitView } from "../../states/useSplitView"
import { getWorldPlayComputed } from "../../states/useWorldPlayComputed"
import mainCamera from "../mainCamera"
import copySelected from "./copySelected"
import { setTransformControlsSnap } from "../../states/useTransformControlsSnap"
import { container } from "../renderLoop/renderSetup"
import { getUILayer, setUILayer } from "../../states/useUILayer"
import {
    getHotKeysEnabled,
    setHotKeysEnabled
} from "../../states/useHotKeysEnabled"
import settings from "../../api/settings"

const enabledSet = new Set<HTMLElement>()
export const enableHotKeysOnElement = (el: HTMLElement) => {
    el.addEventListener("mouseover", () => enabledSet.add(el))
    el.addEventListener("mouseout", () => enabledSet.delete(el))
}
enableHotKeysOnElement(container)

export const handleStopPropagation = (e: Event) => {
    e.stopPropagation()
    setHotKeysEnabled(!!enabledSet.size)
}
document.addEventListener("mousedown", () =>
    setHotKeysEnabled(!!enabledSet.size)
)

const metaHotKey = (e: KeyboardEvent) => {
    e.preventDefault()
    setMultipleSelection(false)
}

createEffect(() => {
    if (getWorldPlayComputed() || !getHotKeysEnabled()) return

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Shift" || e.key === "Meta" || e.key === "Control")
            setMultipleSelection(true)
        if (e.key === "Shift") setTransformControlsSnap(true)

        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault()
            deleteSelected()
            return
        }

        const keyLowerCase = e.key.toLocaleLowerCase()
        if (keyLowerCase === "g") {
            settings.grid = !settings.grid
            return
        }
        if (keyLowerCase === "1") {
            if (!getSplitView())
                setEditorCamera(
                    getEditorCamera() === mainCamera ? undefined : mainCamera
                )
            setSplitView(false)
            return
        }
        if (keyLowerCase === "2") {
            setSplitView(true)
            setEditorCamera(undefined)
            return
        }
        if (keyLowerCase === "3") {
            setUILayer(!getUILayer())
            return
        }

        const target = getSelectionTarget()

        if (e.metaKey || e.ctrlKey) {
            if (keyLowerCase === "z") {
                metaHotKey(e)
                if (e.shiftKey) redo()
                else undo()
            }
            if (keyLowerCase === "y") {
                metaHotKey(e)
                redo()
            }
            if (keyLowerCase === "s") {
                metaHotKey(e)
                saveJSON()
            } else if (keyLowerCase === "o") {
                metaHotKey(e)
                openFolder()
            } else if (keyLowerCase === "c") {
                metaHotKey(e)
                copySelected()
            } else if (keyLowerCase === "p") metaHotKey(e)
        } else if (keyLowerCase === "c") {
            setEditorCamera(mainCamera)
            setUILayer(false)
            isPositionedManager(target) && emitEditorCenterView(target)
        } else if (keyLowerCase === "escape")
            target && emitSelectionTarget(undefined)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Shift" || e.key === "Meta" || e.key === "Control")
            setMultipleSelection(false)
        if (e.key === "Shift") setTransformControlsSnap(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)
    const handle = onKeyClear(() => setMultipleSelection(false))

    return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("keyup", handleKeyUp)
        handle.cancel()
    }
}, [getWorldPlayComputed, getHotKeysEnabled])
