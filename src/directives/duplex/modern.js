
import { avalon } from '../../seed/core'
import { duplexBeforeInit, duplexInit, duplexDiff, duplexValidate, valueHijack, updateView } from './share'
import { updateDataEvents } from './updateDataEvents.modern'


avalon.directive('duplex', {
    priority: 2000,
    beforeInit: duplexBeforeInit,
    init: duplexInit,
    diff: duplexDiff,
    update: function (vdom, value) {
        var dom = vdom.dom
        if (!this.dom) {
            this.duplexCb = updateModel
            this.dom = dom
            dom.__ms_duplex__ = this
            //绑定事件
            updateDataEvents(dom, this)
            //添加验证
            duplexValidate(dom, vdom)
        }
        updateView[this.dtype].call(this)
    }
})

