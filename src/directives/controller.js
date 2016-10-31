import { avalon } from '../seed/core'
import { impCb } from './important'

avalon.directive('controller', {
    priority: 2,
    getScope: function (name, scope) {
        var v = avalon.vmodels[name]
        if (v)
            return v
        return scope
    },
    callback: impCb
})