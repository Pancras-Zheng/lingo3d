import { Object3D } from "three"
import ISimpleObjectManager from "../../interface/ISimpleObjectManager"
import AnimatedObjectManager from "./AnimatedObjectManager"
import { addConfigPhysicsSystem } from "../../systems/configLoadedSystems/configPhysicsSystem"

export default class SimpleObjectManager<T extends Object3D = Object3D>
    extends AnimatedObjectManager<T>
    implements ISimpleObjectManager
{
    public get scaleX() {
        return this.outerObject3d.scale.x
    }
    public set scaleX(val) {
        this.outerObject3d.scale.x = val
        this.userData.physicsMode = undefined
        addConfigPhysicsSystem(this)
    }

    public get scaleY() {
        return this.outerObject3d.scale.y
    }
    public set scaleY(val) {
        this.outerObject3d.scale.y = val
        this.userData.physicsMode = undefined
        addConfigPhysicsSystem(this)
    }

    public get scaleZ() {
        return this.outerObject3d.scale.z
    }
    public set scaleZ(val) {
        this.outerObject3d.scale.z = val
        this.userData.physicsMode = undefined
        addConfigPhysicsSystem(this)
    }

    public get scale() {
        return this.scaleX
    }
    public set scale(val) {
        this.scaleX = val
        this.scaleY = val
        this.scaleZ = val
    }
}
