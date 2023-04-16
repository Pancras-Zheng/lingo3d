import Appendable from "../api/core/Appendable"
import { disableSchema } from "../collections/disableSchema"
import { extendDefaults } from "./utils/Defaults"
import { ExtractProps } from "./utils/extractProps"
import Nullable from "./utils/Nullable"
import {
    nullableCallback,
    nullableCallbackDtParam
} from "./utils/NullableCallback"

export default interface IAppendable {
    onLoop: Nullable<(dt: number) => void>
    proxy: Nullable<Appendable>
    uuid: string
    id: Nullable<string>
    name: Nullable<string>
    runtimeData: Nullable<Record<string, any>>
}

export const appendableSchema: Required<ExtractProps<IAppendable>> = {
    onLoop: Function,
    proxy: Object,
    uuid: String,
    id: String,
    name: String,
    runtimeData: Object
}
for (const key of ["proxy", "runtimeData", "uuid"]) disableSchema.add(key)

export const appendableDefaults = extendDefaults<IAppendable>([], {
    onLoop: nullableCallback(nullableCallbackDtParam),
    proxy: undefined,
    uuid: "",
    id: undefined,
    name: undefined,
    runtimeData: undefined
})
