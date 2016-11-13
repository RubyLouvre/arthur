import { avalon } from '../seed/core'

avalon.directive('nodeValue', {
    update: function (vdom, value) {
        vdom.nodeValue = value
        vdom.dom.nodeValue = value
    }
})