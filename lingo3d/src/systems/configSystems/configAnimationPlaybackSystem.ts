import { LoopOnce, LoopRepeat } from "three"
import AnimationManager from "../../display/core/AnimatedObjectManager/AnimationManager"
import AnimationStates from "../../display/core/AnimatedObjectManager/AnimationStates"
import { INVERSE_STANDARD_FRAME } from "../../globals"
import getContext from "../../memo/getContext"
import { addUpdateDTSystem, deleteUpdateDTSystem } from "../updateDTSystem"
import configSystemWithCleanUp2 from "../utils/configSystemWithCleanUp2"

export const [addConfigAnimationPlaybackSystem] = configSystemWithCleanUp2(
    (animationStates: AnimationStates) => {
        const manager = animationStates.manager
        if (!manager) return false

        const action = manager.$action
        if (!action) return false

        const mixer = manager.$mixer
        action.paused = manager.paused || animationStates.pausedCount > 0

        console.log(manager.paused)

        if (action.paused) {
            if (animationStates.gotoFrame !== undefined) {
                action.paused = false
                action.play()
                mixer.setTime(
                    (action.time =
                        animationStates.gotoFrame * INVERSE_STANDARD_FRAME)
                )
                animationStates.gotoFrame = undefined
                action.paused = true
            }
            return false
        }
        
        console.log(mixer)

        const context = getContext(mixer) as {
            manager?: AnimationManager
            playCount?: number
        }
        const prevManager = context.manager
        context.manager = manager
        if (prevManager && prevManager !== manager) {
            action.crossFadeFrom(prevManager.$action!, 0.25, true)
            if (animationStates.gotoFrame === undefined) {
                action.time = 0
            }
        }
        if (animationStates.gotoFrame !== undefined) {
            action.time = animationStates.gotoFrame * INVERSE_STANDARD_FRAME
            animationStates.gotoFrame = undefined
        }
        if (typeof animationStates.loop === "number")
            action.setLoop(
                animationStates.loop > 1 ? LoopRepeat : LoopOnce,
                animationStates.loop
            )
        else if (animationStates.loop) action.setLoop(LoopRepeat, Infinity)
        else action.setLoop(LoopOnce, 1)

        action.clampWhenFinished = true
        action.enabled = true
        action.play()

        context.playCount = (context.playCount ?? 0) + 1
        context.playCount === 1 && addUpdateDTSystem(mixer)
    },
    (animationStates) => {
        const mixer = animationStates.manager!.$mixer
        const context = getContext(mixer) as {
            manager?: AnimationManager
            playCount?: number
        }
        context.playCount = context.playCount! - 1
        context.playCount === 0 && deleteUpdateDTSystem(mixer)
    }
)
