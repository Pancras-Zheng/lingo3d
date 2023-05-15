import CameraBase from "."
import {
    getCameraPointerLock,
    setCameraPointerLock
} from "../../../states/useCameraPointerLock"
import { getCameraRendered } from "../../../states/useCameraRendered"
import { getWorldPlayComputed } from "../../../states/useWorldPlayComputed"
import { container } from "../../../engine/renderLoop/containers"
import { cameraRenderedPtr } from "../../../pointers/cameraRenderedPtr"
import { onMouseDown } from "../../../events/onMouseDown"
import { onMouseUp } from "../../../events/onMouseUp"
import { addGyrateInertiaSystem } from "../../../systems/gyrateInertiaSystem"
import { cameraPointerLockPtr } from "../../../pointers/cameraPointerLockPtr"

const isMobile = (() => {
    const ua = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return true
    } else if (
        /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
            ua
        )
    ) {
        return true
    }
    return false
})()

export default function (this: CameraBase) {
    if (this.done) return

    this.createEffect(() => {
        if (
            cameraRenderedPtr[0] !== this.$camera ||
            !this.mouseControlState.get()
        )
            return

        if (cameraPointerLockPtr[0] === this.$camera) {
            const handleMove = ({ movementX, movementY }: MouseEvent) => {
                this.gyrate(movementX, movementY)
                this.inertia &&
                    addGyrateInertiaSystem(this, {
                        factor: 1,
                        movementX,
                        movementY
                    })
            }
            document.addEventListener("mousemove", handleMove)

            return () => {
                document.removeEventListener("mousemove", handleMove)
            }
        }

        let started = false
        let identifier: number | undefined
        let xOld: number | undefined
        let yOld: number | undefined

        const handleDown = () => {
            started = true
            ;[xOld, yOld] = [undefined, undefined]
        }
        const handleUp = () => (started = false)

        const handleMove = (e: MouseEvent | Touch) => {
            xOld === undefined && (xOld = e.clientX)
            yOld === undefined && (yOld = e.clientY)
            const [movementX, movementY] = [e.clientX - xOld, e.clientY - yOld]
            ;[xOld, yOld] = [e.clientX, e.clientY]
            if (!started) return
            this.gyrate(
                (movementX / window.innerWidth) * 3000,
                (movementY / window.innerHeight) * 3000
            )
            this.inertia &&
                addGyrateInertiaSystem(this, {
                    factor: 1,
                    movementX,
                    movementY
                })
        }

        if (isMobile) {
            const handleTouchStart = (e: TouchEvent) => {
                if (identifier !== undefined) return
                identifier =
                    e.changedTouches[e.changedTouches.length - 1].identifier
                handleDown()
            }
            container.addEventListener("touchstart", handleTouchStart)

            const handleTouchEnd = (e: TouchEvent) => {
                if (identifier === undefined) return
                if (
                    e.changedTouches[e.changedTouches.length - 1].identifier ===
                    identifier
                ) {
                    identifier = undefined
                    handleUp()
                }
            }
            container.addEventListener("touchend", handleTouchEnd)

            const handleTouchMove = (e: TouchEvent) => {
                if (identifier === undefined) return
                let touch: Touch | undefined
                for (let i = 0; i < e.changedTouches.length; ++i) {
                    const t = e.changedTouches[i]
                    if (t.identifier === identifier) {
                        touch = t
                        break
                    }
                }
                touch && handleMove(touch)
            }
            container.addEventListener("touchmove", handleTouchMove)

            return () => {
                container.removeEventListener("touchstart", handleTouchStart)
                container.removeEventListener("touchend", handleTouchEnd)
                container.removeEventListener("touchmove", handleTouchMove)
                identifier = undefined
                started = false
            }
        }

        const handle0 = onMouseDown(handleDown)
        const handle1 = onMouseUp(handleUp)
        container.addEventListener("mousemove", handleMove)

        return () => {
            handle0.cancel()
            handle1.cancel()
            container.removeEventListener("mousemove", handleMove)
            identifier = undefined
            started = false
        }
    }, [this.mouseControlState.get, getCameraRendered, getCameraPointerLock])

    this.createEffect(() => {
        const [camera] = cameraRenderedPtr
        if (
            this.mouseControlState.get() !== true ||
            camera !== this.$camera ||
            !getWorldPlayComputed()
        )
            return

        const onClick = () => container.requestPointerLock?.()
        const onPointerLockChange = () => {
            if (document.pointerLockElement === container)
                setCameraPointerLock(camera)
            else setCameraPointerLock(undefined)
        }
        container.addEventListener("click", onClick)
        document.addEventListener("pointerlockchange", onPointerLockChange)

        return () => {
            container.removeEventListener("click", onClick)
            document.removeEventListener(
                "pointerlockchange",
                onPointerLockChange
            )
            document.exitPointerLock()
            setCameraPointerLock(undefined)
        }
    }, [this.mouseControlState.get, getCameraRendered, getWorldPlayComputed])
}
