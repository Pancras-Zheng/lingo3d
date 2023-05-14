import { useEffect, useLayoutEffect, useState } from "preact/hooks"
import getDisplayName from "../utils/getDisplayName"
import Setup, { defaultSetup } from "../../display/Setup"
import addSetupInputs from "./addSetupInputs"
import CloseableTab from "../component/tabs/CloseableTab"
import AppBar from "../component/bars/AppBar"
import { emitSelectionTarget } from "../../events/onSelectionTarget"
import useInitCSS from "../hooks/useInitCSS"
import { useSignal } from "@preact/signals"
import useSyncState from "../hooks/useSyncState"
import { getSelectionTarget } from "../../states/useSelectionTarget"
import { DEBUG, EDITOR_WIDTH } from "../../globals"
import useInitEditor from "../hooks/useInitEditor"
import addTargetInputs from "./addTargetInputs"
import SearchBox from "../component/SearchBox"
import usePane from "./usePane"
import mergeRefs from "../hooks/mergeRefs"
import getStaticProperties from "../../display/utils/getStaticProperties"
import { stopPropagation } from "../utils/stopPropagation"
import { onEditorRefresh } from "../../events/onEditorRefresh"
import { multipleSelectionTargets } from "../../collections/multipleSelectionTargets"

const Editor = () => {
    useInitCSS()
    useInitEditor()

    useLayoutEffect(() => {
        if (!DEBUG) {
            window.onbeforeunload = confirmExit
            function confirmExit() {
                return "Are you sure you want to close the current page?"
            }
        }
    }, [])

    const [pane, setContainer] = usePane()

    const selectionTarget = useSyncState(getSelectionTarget)
    const selectedSignal = useSignal<Array<string>>([])

    const [includeKeys, setIncludeKeys] = useState<Array<string>>()
    const [refresh, setRefresh] = useState({})

    useEffect(() => {
        const handle = onEditorRefresh(() => setRefresh({}))
        return () => {
            handle.cancel()
        }
    }, [])

    useLayoutEffect(() => {
        if (!pane || multipleSelectionTargets.size) return
        if (
            selectedSignal.value.at(-1) === "Settings" ||
            !selectionTarget ||
            selectionTarget instanceof Setup
        ) {
            const handle = addSetupInputs(pane, defaultSetup, includeKeys)
            return () => {
                handle.cancel()
            }
        }
        const handle0 = addTargetInputs(pane, selectionTarget, includeKeys)
        const handle1 = selectionTarget.$events.on("runtimeSchema", () =>
            setRefresh({})
        )
        return () => {
            handle0.cancel()
            handle1.cancel()
        }
    }, [selectionTarget, selectedSignal.value, includeKeys, pane, refresh])

    return (
        <div
            className="lingo3d-ui lingo3d-bg lingo3d-editor lingo3d-flexcol"
            style={{ width: EDITOR_WIDTH, height: "100%" }}
        >
            <AppBar>
                <CloseableTab selectedSignal={selectedSignal}>
                    Settings
                </CloseableTab>
                {selectionTarget && (
                    <CloseableTab
                        selectedSignal={selectedSignal}
                        key={selectionTarget.uuid}
                        selected
                        onClose={() => emitSelectionTarget(undefined)}
                    >
                        {getDisplayName(selectionTarget)}
                    </CloseableTab>
                )}
            </AppBar>
            <SearchBox
                onChange={(val) => {
                    if (!val) {
                        setIncludeKeys(undefined)
                        return
                    }
                    val = val.toLowerCase()
                    setIncludeKeys(
                        Object.keys(
                            getStaticProperties(selectionTarget ?? defaultSetup)
                                .schema
                        ).filter((key) => key.toLowerCase().includes(val))
                    )
                }}
                clearOnChange={selectedSignal.value.at(-1)}
            />
            <div
                style={{
                    flexGrow: 1,
                    overflowY: "scroll",
                    overflowX: "hidden",
                    paddingLeft: 8,
                    paddingRight: 8
                }}
                ref={mergeRefs(stopPropagation, setContainer)}
            />
        </div>
    )
}
export default Editor
