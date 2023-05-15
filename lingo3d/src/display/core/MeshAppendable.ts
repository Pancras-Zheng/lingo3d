import { Object3D, PropertyBinding, Quaternion, Vector3 } from "three"
import getWorldDirection from "../../memo/getWorldDirection"
import getWorldPosition from "../../memo/getWorldPosition"
import { quaternion, ray, vector3 } from "../utils/reusables"
import { point2Vec, vec2Point } from "../utils/vec2Point"
import { CM2M, M2CM } from "../../globals"
import IMeshAppendable from "../../interface/IMeshAppendable"
import { setManager } from "../../api/utils/getManager"
import Appendable from "./Appendable"
import { deg2Rad, quadrant, rad2Deg } from "@lincode/math"
import SpawnPoint from "../SpawnPoint"
import getCenter from "../../memo/getCenter"
import worldToCanvas from "../../memo/worldToCanvas"
import Nullable from "../../interface/utils/Nullable"
import { fpsRatioPtr } from "../../pointers/fpsRatioPtr"
import { addConfigPhysicsSystem } from "../../systems/configLoadedSystems/configPhysicsSystem"
import { addLerpToSystem, deleteLerpToSystem } from "../../systems/lerpToSystem"
import { addMoveToSystem, deleteMoveToSystem } from "../../systems/moveToSystem"
import { addOnMoveSystem, deleteOnMoveSystem } from "../../systems/onMoveSystem"
import { addLookToSystem } from "../../systems/lookToSystem"
import { physxPtr } from "../../pointers/physxPtr"
import { assignPxTransform } from "../../engine/physx/pxMath"
import { actorPtrManagerMap } from "../../collections/pxCollections"
import PhysicsObjectManager from "./PhysicsObjectManager"
import scene from "../../engine/scene"
import Point3d from "../../math/Point3d"
import { Point3dType } from "../../utils/isPoint"
import { addPlaceAtSystem } from "../../systems/configLoadedSystems/placeAtSystem"
import { addConfigMeshAppendableSystem } from "../../systems/configSystems/configMeshAppendableSystem"

const up = new Vector3(0, 1, 0)

export default class MeshAppendable<T extends Object3D = Object3D>
    extends Appendable
    implements IMeshAppendable
{
    public object3d: T
    public position: Vector3
    public quaternion: Quaternion
    public userData: Record<string, any>

    public constructor(public outerObject3d: T = new Object3D() as T) {
        super()
        setManager(outerObject3d, this)
        addConfigMeshAppendableSystem(this)
        this.object3d = outerObject3d
        this.position = outerObject3d.position
        this.quaternion = outerObject3d.quaternion
        this.userData = outerObject3d.userData
    }

    public declare parent?: MeshAppendable
    public declare children?: Set<Appendable | MeshAppendable>

    public declare traverse: (
        cb: (appendable: Appendable | MeshAppendable) => void
    ) => void

    public declare traverseSome: (
        cb: (appendable: Appendable | MeshAppendable) => unknown
    ) => boolean

    public override append(child: Appendable | MeshAppendable) {
        this.$appendNode(child)
        "object3d" in child && this.object3d.add(child.outerObject3d)
    }

    public attach(child: Appendable | MeshAppendable) {
        this.$appendNode(child)
        "object3d" in child && this.object3d.attach(child.outerObject3d)
    }

    protected override disposeNode() {
        super.disposeNode()
        this.outerObject3d.parent?.remove(this.outerObject3d)
        this.querySphere && physxPtr[0].destroy(this.querySphere)
    }

    public override get name() {
        return super.name
    }
    public override set name(val) {
        super.name = this.outerObject3d.name = PropertyBinding.sanitizeNodeName(
            val ?? ""
        )
    }

    public get x() {
        return this.position.x * M2CM
    }
    public set x(val) {
        this.position.x = val * CM2M
        addConfigPhysicsSystem(this)
    }

    public get y() {
        return this.position.y * M2CM
    }
    public set y(val) {
        this.position.y = val * CM2M
        addConfigPhysicsSystem(this)
    }

    public get z() {
        return this.position.z * M2CM
    }
    public set z(val) {
        this.position.z = val * CM2M
        addConfigPhysicsSystem(this)
    }

    public getWorldPosition() {
        return vec2Point(getWorldPosition(this.object3d))
    }

    public getCenter() {
        return vec2Point(getCenter(this.object3d))
    }

    public getWorldDirection() {
        return getWorldDirection(this.object3d)
    }

    public getProjectedPosition() {
        return worldToCanvas(this.object3d)
    }

    private _onMove?: () => void
    public get onMove() {
        return this._onMove
    }
    public set onMove(cb) {
        this._onMove = cb
        cb ? addOnMoveSystem(this) : deleteOnMoveSystem(this)
    }

    public translateX(val: number) {
        this.outerObject3d.translateX(val * CM2M * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public translateY(val: number) {
        this.outerObject3d.translateY(val * CM2M * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public translateZ(val: number) {
        this.outerObject3d.translateZ(val * CM2M * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public rotateX(val: number) {
        this.outerObject3d.rotateX(val * deg2Rad * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public rotateY(val: number) {
        this.outerObject3d.rotateY(val * deg2Rad * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public rotateZ(val: number) {
        this.outerObject3d.rotateZ(val * deg2Rad * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public setRotationFromDirection(direction: Point3dType) {
        const ogParent = this.outerObject3d.parent
        ogParent !== scene && scene.attach(this.outerObject3d)

        this.outerObject3d.setRotationFromQuaternion(
            quaternion.setFromUnitVectors(up, direction as Vector3)
        )
        ogParent !== scene && ogParent!.attach(this.outerObject3d)
    }

    public placeAt(target: MeshAppendable | Point3dType | SpawnPoint | string) {
        addPlaceAtSystem(this, { target })
    }

    public moveForward(distance: number) {
        vector3.setFromMatrixColumn(this.outerObject3d.matrix, 0)
        vector3.crossVectors(this.outerObject3d.up, vector3)
        this.position.addScaledVector(vector3, distance * CM2M * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public moveRight(distance: number) {
        vector3.setFromMatrixColumn(this.outerObject3d.matrix, 0)
        this.position.addScaledVector(vector3, distance * CM2M * fpsRatioPtr[0])
        addConfigPhysicsSystem(this)
    }

    public onMoveToEnd: Nullable<() => void>

    public lerpTo(x: number, y: number, z: number, alpha = 0.05) {
        const from = new Vector3(this.x, this.y, this.z)
        const to = new Vector3(x, y, z)

        deleteMoveToSystem(this)
        addLerpToSystem(this, { from, to, alpha })
    }

    public moveTo(x: number, y: number | undefined, z: number, speed = 5) {
        if (x === this.x) x += 0.01
        if (z === this.z) z += 0.01

        const {
            x: rx,
            y: ry,
            z: rz
        } = new Vector3(
            x - this.x,
            y === undefined ? 0 : y - this.y,
            z - this.z
        ).normalize()
        const sx = speed * rx
        const sy = speed * ry
        const sz = speed * rz

        const quad = quadrant(x, z, this.x, this.z)

        deleteLerpToSystem(this)
        addMoveToSystem(this, { sx, sy, sz, x, y, z, quad })
    }

    protected getRay() {
        return ray.set(
            getWorldPosition(this.object3d),
            getWorldDirection(this.object3d)
        )
    }

    public pointAt(distance: number) {
        return vec2Point(this.getRay().at(distance * CM2M, vector3))
    }

    public get rotationX() {
        return this.outerObject3d.rotation.x * rad2Deg
    }
    public set rotationX(val) {
        this.outerObject3d.rotation.x = val * deg2Rad
        addConfigPhysicsSystem(this)
    }

    public get rotationY() {
        return this.outerObject3d.rotation.y * rad2Deg
    }
    public set rotationY(val) {
        this.outerObject3d.rotation.y = val * deg2Rad
        addConfigPhysicsSystem(this)
    }

    public get rotationZ() {
        return this.outerObject3d.rotation.z * rad2Deg
    }
    public set rotationZ(val) {
        this.outerObject3d.rotation.z = val * deg2Rad
        addConfigPhysicsSystem(this)
    }

    public get rotation() {
        return this.rotationZ
    }
    public set rotation(val) {
        this.rotationZ = val
    }

    public lookAt(target: MeshAppendable | Point3dType): void
    public lookAt(x: number, y: number | undefined, z: number): void
    public lookAt(
        a0: MeshAppendable | Point3dType | number,
        a1?: number,
        a2?: number
    ) {
        if (typeof a0 === "number") {
            this.lookAt(new Point3d(a0, a1 === undefined ? this.y : a1, a2!))
            return
        }
        if ("outerObject3d" in a0)
            this.outerObject3d.lookAt(getWorldPosition(a0.object3d))
        else this.outerObject3d.lookAt(point2Vec(a0))
    }

    public onLookToEnd: (() => void) | undefined

    public lookTo(target: MeshAppendable | Point3dType, alpha?: number): void
    public lookTo(
        x: number,
        y: number | undefined,
        z: number,
        alpha?: number
    ): void
    public lookTo(
        a0: MeshAppendable | Point3dType | number,
        a1: number | undefined,
        a2?: number,
        a3?: number
    ) {
        if (typeof a0 === "number") {
            this.lookTo(
                new Point3d(a0, a1 === undefined ? this.y : a1, a2!),
                a3
            )
            return
        }
        const { quaternion } = this.outerObject3d
        const quaternionOld = quaternion.clone()
        this.lookAt(a0)
        const quaternionNew = quaternion.clone()

        quaternion.copy(quaternionOld)

        addLookToSystem(this, { quaternion, quaternionNew, a1 })
    }

    private queryRadius?: number
    private querySphere?: any
    public queryNearby(radius: number) {
        const { PxSphereGeometry, pxOverlap, destroy } = physxPtr[0]
        if (!PxSphereGeometry) return []

        if (radius !== this.queryRadius) {
            this.queryRadius = radius
            this.querySphere && destroy(this.querySphere)
            this.querySphere = new PxSphereGeometry(radius * CM2M)
        }
        const result: Array<PhysicsObjectManager> = []
        for (const item of pxOverlap(this.querySphere, assignPxTransform(this)))
            result.push(actorPtrManagerMap.get(item.actor.ptr)!)
        return result
    }
}
