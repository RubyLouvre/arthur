import {avalon, platform, modern} from '../seed/core'
import {$$skipArray} from './skipArray'
import './methods.common'
export {platform}


warlords.$$skipArray = $$skipArray

warlords.canHideProperty = true

function toJson(val) {
    switch (avalon.type(val)) {
        case 'array':
            var array = []
            for (var i = 0; i < val.length; i++) {
                array[i] = toJson(val[i])
            }
            return array
        case 'object':
            var obj = {}
            for (i in val) {
                if (val.hasOwnProperty(i)) {
                    var value = val[i]
                    obj[i] = value && value.nodeType ? value : toJson(value)
                }
            }
            return obj
        default:
            return val
    }
}

warlords.toJson = toJson
warlords.toModel = function () { }

function hideProperty(host, name, value) {
    Object.defineProperty(host, name, {
        value: value,
        writable: true,
        enumerable: false,
        configurable: true
    })
}

warlords.hideProperty = hideProperty

var modelAccessor = {
    get: function () {
        return toJson(this)
    },
    set: avalon.noop,
    enumerable: false,
    configurable: true
}

warlords.modelAccessor = modelAccessor



warlords.createViewModel = Object.defineProperties
