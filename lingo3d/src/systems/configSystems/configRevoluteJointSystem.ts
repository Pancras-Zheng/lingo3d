import { deg2Rad } from "@lincode/math"
import { physxPtr } from "../../pointers/physxPtr"
import RevoluteJoint from "../../display/joints/RevoluteJoint"
import configSystem from "../utils/configSystem"

export const [addConfigRevoluteJointSystem] = configSystem(
    (target: RevoluteJoint) => {
        const {
            $pxJoint,
            limited,
            limitLow,
            limitHigh,
            stiffness,
            damping,
            driveVelocity
        } = target
        if (!$pxJoint) return

        const { PxJointAngularLimitPair, PxRevoluteJointFlagEnum, destroy } =
            physxPtr[0]

        if (limited) {
            const limitPair = new PxJointAngularLimitPair(
                limitLow * deg2Rad,
                limitHigh * deg2Rad
            )
            limitPair.stiffness = stiffness
            limitPair.damping = damping
            $pxJoint.setLimit(limitPair)
            destroy(limitPair)
        }
        $pxJoint.setRevoluteJointFlag(
            PxRevoluteJointFlagEnum.eLIMIT_ENABLED(),
            limited
        )
        $pxJoint.setDriveVelocity(driveVelocity)
        $pxJoint.setRevoluteJointFlag(
            PxRevoluteJointFlagEnum.eDRIVE_ENABLED(),
            driveVelocity > 0
        )
    }
)
