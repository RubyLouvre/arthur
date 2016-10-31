import { avalon } from '../seed/core'

avalon.directive('nodeValue', {
    update: function (node, value) {
        node.dom.nodeValue = value
    }
})