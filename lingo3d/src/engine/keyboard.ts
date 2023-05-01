import { createEffect } from "@lincode/reactivity"
import { onKeyClear } from "../events/onKeyClear"
import { emitKeyDown } from "../events/onKeyDown"
import { emitKeyPress } from "../events/onKeyPress"
import { emitKeyUp } from "../events/onKeyUp"
import { getWorldPlayComputed } from "../states/useWorldPlayComputed"
import { keyPressSet } from "../collections/keyPressSet"
import {
    addKeyPressEmitSystem,
    deleteKeyPressEmitSystem
} from "../systems/keyPressEmitSystem"

const processKey = (str: string) => {
    str = str.length === 1 ? str.toLocaleLowerCase() : str
    if (str === " ") str = "Space"
    return str
}

createEffect(() => {
    if (!getWorldPlayComputed()) return

    addKeyPressEmitSystem(keyPressSet)
    const handle = onKeyClear(() => {
        if (!keyPressSet.size) return
        const pressed = [...keyPressSet]
        keyPressSet.clear()
        for (const key of pressed) emitKeyUp(key)
    })

    const handleKeyDown = (e: KeyboardEvent): void => {
        const key = processKey(e.key)
        keyPressSet.add(key)
        emitKeyDown(key)
    }
    const handleKeyUp = (e: KeyboardEvent): void => {
        const key = processKey(e.key)
        keyPressSet.delete(key)
        emitKeyUp(key)
        !keyPressSet.size && emitKeyPress()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
        deleteKeyPressEmitSystem(keyPressSet)
        handle.cancel()
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("keyup", handleKeyUp)
    }
}, [getWorldPlayComputed])
