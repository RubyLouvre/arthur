import { avalon } from '../seed/core'
import { byPriority } from '../parser/attributes'

var rendering = null
var fibers = []
export function scheduling(sub) {
    if (sub === void 0) {
        var go = fibers.length
    } else {
        if (rendering) {
            avalon.Array.ensure(fibers, sub)
            fibers.sort(byPriority)
        } else {
            fibers.push(sub)
            go = true
        }
    }
    if (go) {
        rendering = fibers[0]
        fibers[0].update()
        avalon.Array.remove(fibers, rendering)
        rendering = null
        scheduling()
    }
}