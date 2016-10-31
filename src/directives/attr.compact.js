
import { avalon } from '../seed/core'
import { cssDiff } from './css'
import { updateAttrs } from '../dom/attr/compact'

var cssDir = avalon.directive('css', {
    diff: cssDiff,
    update: function (vdom, change) {
        var dom = vdom.dom
        if (dom && dom.nodeType === 1) {
            updateAttrs(dom, change)
        }
    }
})

export var cssDiff = cssDir.diff