import Appendable from "../../api/core/Appendable"
import { handleStopPropagation } from "../../engine/hotkeys"
import { emitSelectionTarget } from "../../events/onSelectionTarget"
import { setWorldPlay } from "../../states/useWorldPlay"
import { toggleRightClick } from "../../engine/mouse"

export default (e: MouseEvent, target?: Appendable, rightClick?: boolean) => {
    handleStopPropagation(e)
    setWorldPlay(false)
    rightClick && toggleRightClick(e.clientX, e.clientY)
    emitSelectionTarget(target, true)
}
