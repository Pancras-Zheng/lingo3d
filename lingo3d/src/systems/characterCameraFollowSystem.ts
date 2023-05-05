import MeshAppendable from "../api/core/MeshAppendable"
import CharacterCamera from "../display/core/CharacterCamera"
import fpsAlpha from "../display/utils/fpsAlpha"
import { euler, quaternion } from "../display/utils/reusables"
import { PI } from "../globals"
import renderSystemWithData from "./utils/renderSystemWithData"
import { addGyrateResetSystem } from "./configSystems/gyrateResetSystem"
import { positionChangedXZ } from "../memo/positionChangedXZ"

const followTargetRotation = (
    self: CharacterCamera,
    target: MeshAppendable,
    slerp: boolean
) => {
    euler.setFromQuaternion(target.quaternion)
    euler.y += PI

    if (slerp) {
        quaternion.setFromEuler(euler)
        self.midObject3d.quaternion.slerp(quaternion, fpsAlpha(0.1))
    } else self.midObject3d.setRotationFromEuler(euler)

    addGyrateResetSystem(self)
}

const rotateTarget = (
    self: CharacterCamera,
    target: MeshAppendable,
    slerp: boolean
) => {
    euler.setFromQuaternion(self.midObject3d.quaternion)
    euler.x = 0
    euler.z = 0
    euler.y += PI

    if (slerp) {
        quaternion.setFromEuler(euler)
        target.quaternion.slerp(quaternion, fpsAlpha(0.1))
        return
    }
    target.outerObject3d.setRotationFromEuler(euler)
}

export const [
    addCharacterCameraFollowSystem,
    deleteCharacterCameraFollowSystem
] = renderSystemWithData(
    (self: CharacterCamera, { found }: { found: MeshAppendable }) => {
        self.position.copy(found.position)

        if (!self.lockTargetRotation) return

        if (self.lockTargetRotation === "follow") {
            followTargetRotation(self, found, false)
            return
        }
        if (self.lockTargetRotation === "dynamic-lock") {
            positionChangedXZ(found.outerObject3d) &&
                rotateTarget(self, found, true)
            return
        }
        if (self.lockTargetRotation === "dynamic-follow") {
            positionChangedXZ(found.outerObject3d) &&
                followTargetRotation(self, found, true)
            return
        }
        rotateTarget(self, found, false)
    }
)
