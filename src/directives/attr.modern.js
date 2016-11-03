
import { avalon } from '../seed/core'
import { cssDiff } from './css'
import { updateAttrs } from '../dom/attr/modern'

avalon.directive('attr', {
    diff: cssDiff,
    update: function (vdom, value) {
        var dom = vdom.dom
        if (dom && dom.nodeType === 1) {
            updateAttrs(dom, value)
        }
    }
})

