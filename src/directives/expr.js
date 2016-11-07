import { avalon } from '../seed/core'

avalon.directive('nodeValue', {
    update: function (vdom, value) {
        vdom.dom.nodeValue = value
    }
})