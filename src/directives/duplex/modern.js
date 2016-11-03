
import { avalon } from '../../seed/core'
import { duplexBeforeInit, duplexInit, duplexDiff, duplexValidate } from './share'
import { updateModel } from './updateDataHandle'
import { updateView } from './updateView.modern'
import { updateDataEvents } from './updateDataEvents.modern'


avalon.directive('duplex', {
    priority: 2000,
    beforeInit: duplexBeforeInit,
    init: duplexInit,
    diff: duplexDiff,
    update: function (vdom, value) {
        var dom = vdom.dom
        if (!this.dom) {
            this.duplex = updateModel
            this.dom = dom
            dom.__ms_duplex__ = this
            //绑定事件
            updateModelEvents(dom, this)
            //添加验证
            duplexValidate(dom, vdom)
        }
        updateView[this.dtype].call(this)
    }
})

