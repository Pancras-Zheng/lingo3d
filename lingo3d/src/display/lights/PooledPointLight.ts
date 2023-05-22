import {
    disposePointLights,
    releasePointLight,
    requestPointLight
} from "../../pools/objectPools/pointLightPool"
import IPooledPointLight, {
    pooledPointLightDefaults,
    pooledPointLightSchema
} from "../../interface/IPooledPointLight"
import { addPooledPointLightSystem } from "../../systems/pooledPointLightSystem"
import PointLight from "./PointLight"
import { onPointLightPool } from "../../events/onPointLightPool"
import { pointLightPoolPtr } from "../../pointers/pointLightPoolPtr"
import PooledPointLightBase from "../core/PooledPointLightBase"

const lightSet = new Set<PooledPointLight>()

let requested = false
const requestPointLights = () => {
    if (requested) return
    requested = true
    const lights: Array<PointLight> = []
    for (let i = 0; i < pointLightPoolPtr[0]; ++i)
        lights.push(requestPointLight([]))
    for (const light of lights) releasePointLight(light)
}
onPointLightPool(() => {
    if (!requested) return
    requested = false
    disposePointLights()
    requestPointLights()
    for (const light of lightSet)
        addPooledPointLightSystem(light, { visible: false })
})

export default class PooledPointLight
    extends PooledPointLightBase<PointLight>
    implements IPooledPointLight
{
    public static componentName = "pooledPointLight"
    public static defaults = pooledPointLightDefaults
    public static schema = pooledPointLightSchema

    public constructor() {
        super()
        requestPointLights()
        addPooledPointLightSystem(this, { visible: false })
        lightSet.add(this)
    }

    protected override disposeNode() {
        super.disposeNode()
        lightSet.delete(this)
    }
}
