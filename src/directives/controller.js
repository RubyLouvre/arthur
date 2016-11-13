import { avalon } from '../seed/core'
import { impCb } from './important'
import {mediatorFactory} from '../vmodel/share'
avalon.directive('controller', {
    priority: 2,
    getScope: function (name, scope) {
        var v = avalon.vmodels[name]
        if (v){
            v.$render = this
            if(scope){
               return mediatorFactory(scope, v) 
            }
            return v
        }
        return scope
    },
    update: impCb
})