import { throttleTrailing } from "@lincode/utils"
import { downPtr, FolderApi, InputBindingApi, Pane } from "./tweakpane"
import resetIcon from "./icons/resetIcon"
import { defaultsOptionsMap } from "../../interface/utils/Defaults"
import getDefaultValue, {
    equalsDefaultValue,
    equalsValue
} from "../../interface/utils/getDefaultValue"
import { Cancellable } from "@lincode/promiselikes"
import { emitEditorEdit } from "../../events/onEditorEdit"
import {
    assignEditorPresets,
    getEditorPresets
} from "../../states/useEditorPresets"
import connectorInIcon from "./icons/connectorInIcon"
import connectorOutIcon from "./icons/connectorOutIcon"
import renderSystemWithData from "../../utils/renderSystemWithData"
import Appendable from "../../api/core/Appendable"
import unsafeGetValue from "../../utils/unsafeGetValue"
import { getRuntimeValue, setRuntimeValue } from "../../utils/getRuntimeValue"
import unsafeSetValue from "../../utils/unsafeSetValue"
import { render } from "preact"
import { unmountComponentAtNode } from "preact/compat"
import Toggle from "./Toggle"
import {
    isNullableCallbackParam,
    NullableCallbackParam
} from "../../interface/utils/NullableCallback"
import {
    DefaultMethodArg,
    isDefaultMethodArg
} from "../../interface/utils/DefaultMethod"

const processValue = (value: any) => {
    if (typeof value === "string") {
        if (!value) return value
        if (value === "true" || value === "false")
            return value === "true" ? true : false
        const num = Number(value)
        if (!Number.isNaN(num)) return num
    }
    return value
}

type DraggingItem = { manager: any; prop: string; xyz?: "x" | "y" | "z" }
let draggingItem: DraggingItem | undefined

const skipChangeSet = new WeakSet<InputBindingApi>()
const [addRefreshSystem, deleteRefreshSystem] = renderSystemWithData(
    (
        input: InputBindingApi,
        {
            key,
            params,
            target
        }: {
            key: string
            params: any
            target: Appendable
        }
    ) => {
        const val = getRuntimeValue(target, key)
        if (equalsValue(target, val, params[key], key)) return
        params[key] = val
        skipChangeSet.add(input)
        input.refresh()
    }
)

export type Connection = {
    onDragStart?: (e: DragEvent) => void
    onDrag?: (e: DragEvent) => void
    onDragEnd?: (e: DragEvent, draggingItem: DraggingItem) => void
    onDrop?: (e: DragEvent, draggingItem: DraggingItem, prop: string) => void
}

export class PassthroughCallback {
    public constructor(
        public callback: (val: any) => void,
        public handle: Cancellable
    ) {}
}

export class PassthroughMethod {
    public constructor(
        public method: (val: any) => void,
        public handle: Cancellable
    ) {}
}

const initConnectorOut = (
    connectorOut: HTMLElement,
    target: Appendable,
    key: string,
    connection: Connection,
    xyz?: "x" | "y" | "z"
) => {
    connectorOut.draggable = true
    connectorOut.onmousedown = (e) => e.stopPropagation()
    connectorOut.ondragstart = (e) => {
        e.stopPropagation()
        draggingItem = {
            manager: target,
            prop: key,
            xyz
        }
        connectorOut.style.background = "rgba(255, 255, 255, 0.5)"
        connection.onDragStart?.(e)
    }
    connectorOut.ondrag = (e) => {
        e.stopPropagation()
        connection.onDrag?.(e)
    }
    connectorOut.ondragend = (e) => {
        e.stopPropagation()
        connectorOut.style.background = ""
        connection.onDragEnd?.(e, draggingItem!)
        draggingItem = undefined
    }
    return connectorOut
}

export default async (
    handle: Cancellable,
    pane: Pane,
    title: string,
    target: Appendable,
    params: Record<string, any>,
    prepend?: boolean,
    connection?: Connection,
    toggle?: boolean
) => {
    if (!prepend) await Promise.resolve()

    const paramKeys = Object.keys(params)
    if (!paramKeys.length) return {}

    for (const key of paramKeys)
        if (key.startsWith("preset "))
            params[key] = getEditorPresets()[key] ?? true

    const folder: FolderApi = pane.addFolder({ title })
    const options = defaultsOptionsMap.get(
        unsafeGetValue(target.constructor, "defaults")
    )
    const result = Object.fromEntries(
        Object.keys(params).map((key) => {
            const value = unsafeGetValue(target, key)
            let input: any
            if (
                value instanceof NullableCallbackParam ||
                value instanceof DefaultMethodArg
            ) {
                input = folder.addButton({
                    title: key,
                    label: key
                })
            } else {
                input = folder.addInput(
                    params,
                    key,
                    getEditorPresets()["preset " + key] !== false
                        ? options?.[key]
                        : undefined
                )
                if (key.startsWith("preset ")) {
                    input.on("change", ({ value }: any) =>
                        assignEditorPresets({ [key]: value })
                    )
                    return [key, input]
                }

                if (isNullableCallbackParam(value))
                    unsafeSetValue(
                        target,
                        key,
                        new PassthroughCallback((val) => {
                            params[key] = val
                            skipChangeSet.add(input)
                            input.refresh()
                        }, handle)
                    )
                else if (isDefaultMethodArg(value))
                    unsafeSetValue(
                        target,
                        key,
                        new PassthroughMethod((val) => {
                            params[key] = val
                            skipChangeSet.add(input)
                            input.refresh()
                        }, handle)
                    )
                else addRefreshSystem(input, { key, params, target })

                const resetButton = resetIcon.cloneNode(true) as HTMLElement
                input.element.prepend(resetButton)
                resetButton.style.opacity = "0.1"

                const updateResetButton = throttleTrailing(() => {
                    const unchanged = equalsDefaultValue(
                        params[key],
                        target,
                        key
                    )
                    resetButton.style.opacity = unchanged ? "0.1" : "0.5"
                    resetButton.style.cursor = unchanged ? "auto" : "pointer"
                }, 100)
                updateResetButton()

                resetButton.onclick = () => {
                    params[key] = structuredClone(
                        getDefaultValue(target, key, true, true)
                    )
                    input.refresh()
                }

                input.on("change", ({ value }: any) => {
                    updateResetButton()
                    if (skipChangeSet.has(input)) {
                        skipChangeSet.delete(input)
                        return
                    }
                    !downPtr[0] && emitEditorEdit("start")
                    setRuntimeValue(target, key, processValue(value))
                    !downPtr[0] && emitEditorEdit("end")
                })
            }

            if (connection) {
                const els = input.element.querySelectorAll(".tp-pndtxtv_a")
                if (els.length) {
                    let i = 0
                    for (const el of els) {
                        const xyz = "xyz"[i++] as "x" | "y" | "z"
                        const connectorOut = initConnectorOut(
                            connectorOutIcon.cloneNode(true) as HTMLElement,
                            target,
                            key,
                            connection,
                            xyz
                        )
                        connectorOut.id =
                            target.uuid + " " + key + "-" + xyz + " out"
                        connectorOut.style.marginTop = "5px"
                        connectorOut.style.marginRight = "4px"
                        connectorOut.style.marginLeft = "4px"
                        const { nextElementSibling } = el
                        if (nextElementSibling)
                            el.parentElement.insertBefore(
                                connectorOut,
                                nextElementSibling
                            )
                        else el.parentElement.appendChild(connectorOut)
                    }
                    return [key, input]
                }
                const connectorOut = initConnectorOut(
                    connectorOutIcon.cloneNode(true) as HTMLElement,
                    target,
                    key,
                    connection
                )
                connectorOut.id = target.uuid + " " + key + " out"
                input.element.append(connectorOut)

                const connectorIn = connectorInIcon.cloneNode(
                    true
                ) as HTMLElement
                connectorIn.id = target.uuid + " " + key + " in"
                input.element.prepend(connectorIn)

                connectorIn.ondragenter = (e) => {
                    e.stopPropagation()
                    connectorIn.style.background = "rgba(255, 255, 255, 0.5)"
                }
                connectorIn.ondragleave = (e) => {
                    e.stopPropagation()
                    connectorIn.style.background = ""
                }
                connectorIn.ondrop = (e) => {
                    e.stopPropagation()
                    connectorIn.style.background = ""
                    draggingItem && connection.onDrop?.(e, draggingItem, key)
                }
            }
            if (toggle) {
                const div = document.createElement("div")
                render(<Toggle manager={target} property={key} />, div)
                handle.then(() => unmountComponentAtNode(div))
                input.element.appendChild(div)
            }
            return [key, input]
        })
    )
    handle.then(() => {
        folder.dispose()
        for (const input of Object.values(result)) {
            deleteRefreshSystem(input)
            input.dispose()
        }
    })
    return result
}
