import { lazy } from "@lincode/utils"
import Water from "../../display/Water"
import type { Water as ThreeWater } from "three/examples/jsm/objects/Water"
import { planeGeometry } from "../../display/primitives/Plane"
import { sphereGeometry } from "../../display/primitives/Sphere"
import loadTexture from "../../display/utils/loaders/loadTexture"
import { addWaterSystem, deleteWaterSystem } from "../waterSystem"
import configSystemWithCleanUp2 from "../utils/configSystemWithCleanUp2"
import { waternormalsUrlPtr } from "../../pointers/assetsPathPointers"

let WaterClass: typeof ThreeWater

const importWater = lazy(async () => {
    const { Water } = await import("three/examples/jsm/objects/Water")
    WaterClass = Water
})

export const [addConfigWaterSystem] = configSystemWithCleanUp2(
    (self: Water) => {
        const normalMap = self.normalMap || waternormalsUrlPtr[0]

        const isPlane = self.shape === "plane"
        const waterGeometry = isPlane ? planeGeometry : sphereGeometry
        const res = self.resolution

        self.object3d.add(
            (self.$water = new WaterClass(waterGeometry, {
                textureWidth: res,
                textureHeight: res,
                waterNormals: loadTexture(normalMap),
                // sunDirection: new Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7
            }))
        )
        addWaterSystem(self)
    },
    (self) => {
        self.object3d.remove(self.$water!)
        deleteWaterSystem(self)
    },
    [importWater]
)
