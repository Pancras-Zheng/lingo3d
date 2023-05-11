import structuredClone from "@ungap/structured-clone"

if (!("structuredClone" in window)) window.structuredClone = structuredClone

function at(n) {
    // ToInteger() abstract op
    n = Math.trunc(n) || 0
    // Allow negative indexing from the end
    if (n < 0) n += this.length
    // OOB access is guaranteed to return undefined
    if (n < 0 || n >= this.length) return undefined
    // Otherwise, this is just normal property access
    return this[n]
}

const TypedArray = Reflect.getPrototypeOf(Int8Array)
for (const C of [Array, String, TypedArray]) {
    if ("at" in C.prototype) continue
    Object.defineProperty(C.prototype, "at", {
        value: at,
        writable: true,
        enumerable: false,
        configurable: true
    })
}

function group(callback) {
    const result = {}
    this.forEach((value, index, array) => {
        const key = callback.call(this, value, index, array)
        result[key] ??= []
        result[key].push(value)
    })
    return result
}

if (!("group" in Array.prototype))
    Object.defineProperty(Array.prototype, "group", {
        value: group,
        writable: true,
        enumerable: false,
        configurable: true
    })
