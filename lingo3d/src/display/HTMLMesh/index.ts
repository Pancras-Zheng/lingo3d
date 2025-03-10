import { Reactive } from "@lincode/reactivity"
import IHTMLMesh, {
    htmlMeshDefaults,
    htmlMeshSchema
} from "../../interface/IHTMLMesh"
import createElement from "../../utils/createElement"
import { Cancellable } from "@lincode/promiselikes"
import VisibleObjectManager from "../core/VisibleObjectManager"
import { setManager } from "../core/utils/getManager"
import { ColorString } from "../../interface/ITexturedStandard"

const elementContainerTemplate = createElement(`
    <div style="position: absolute; visibility: hidden; pointer-events: none;"></div>
`)

export default class HTMLMesh
    extends VisibleObjectManager
    implements IHTMLMesh
{
    public static componentName = "htmlMesh"
    public static defaults = htmlMeshDefaults
    public static schema = htmlMeshSchema

    public constructor() {
        super()

        this.createEffect(() => {
            let element = this.elementState.get()
            const innerHTML = this.innerHTMLState.get()
            if (!element && innerHTML)
                element = createElement(
                    innerHTML.startsWith("<")
                        ? innerHTML
                        : `<div>${innerHTML}</div>`
                )
            if (!element) return

            const elementContainer =
                elementContainerTemplate.cloneNode() as HTMLElement
            document.body.appendChild(elementContainer)
            elementContainer.appendChild(element)

            const handle = new Cancellable()
            import("./HTMLMesh").then(({ HTMLMesh, HTMLSprite }) => {
                if (handle.done) return

                const mesh = this.spriteState.get()
                    ? new HTMLSprite(element)
                    : new HTMLMesh(element)
                this.$innerObject.add(mesh)
                setManager(mesh, this)

                handle.watch(
                    this.cssColorState.get((color) => {
                        elementContainer.style.color = color
                        mesh.update()
                    })
                )
                handle.then(() => {
                    this.$innerObject.remove(mesh)
                    mesh.dispose()
                })
            })
            return () => {
                elementContainer.remove()
                handle.cancel()
            }
        }, [
            this.elementState.get,
            this.spriteState.get,
            this.innerHTMLState.get
        ])
    }

    private elementState = new Reactive<Element | undefined>(undefined)
    public get element() {
        return this.elementState.get()
    }
    public set element(val) {
        this.elementState.set(val)
    }

    private innerHTMLState = new Reactive<string | undefined>(undefined)
    public get innerHTML() {
        return this.innerHTMLState.get()
    }
    public set innerHTML(val) {
        this.innerHTMLState.set(val)
    }

    private spriteState = new Reactive(false)
    public get sprite() {
        return this.spriteState.get()
    }
    public set sprite(val) {
        this.spriteState.set(val)
    }

    private cssColorState = new Reactive<ColorString>("#ffffff")
    public get cssColor() {
        return this.cssColorState.get()
    }
    public set cssColor(val) {
        this.cssColorState.set(val)
    }
}
