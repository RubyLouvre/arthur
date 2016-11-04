
import { avalon } from '../../seed/core'
import { duplexBeforeInit, duplexInit, duplexDiff, duplexValidate, valueHijack, updateView } from './share'
import { updateModel } from './updateDataHandle'
import { updateDataEvents } from './updateDataEvents.compact'


avalon.directive('duplex', {
    priority: 9999999,
    beforeInit: duplexBeforeInit,
    init: duplexInit,
    diff: duplexDiff,
    update: function (vdom, value) {
        var dom = vdom.dom
        if (!this.dom) {
            this.dom = dom
            this.duplex = updateModel
            dom.__ms_duplex__ = this
            //绑定事件
            updateDataEvents(dom, this)
            //添加验证
            duplexValidate(dom, vdom)
        }
        //如果不支持input.value的Object.defineProperty的属性支持,
        //需要通过轮询同步, chrome 42及以下版本需要这个hack
        if (this.isString
            && !avalon.msie
            && valueHijack === false
            && !dom.valueHijack) {

            dom.valueHijack = updateModel
            var intervalID = setInterval(function () {
                if (!avalon.contains(avalon.root, dom)) {
                    clearInterval(intervalID)
                } else {
                    dom.valueHijack({ type: 'poll' })
                }
            }, 30)
        }
        //更新视图
        updateView[this.dtype].call(this)

    }
})

if (avalon.msie === 6) {
    updateView.updateChecked = function (vdom, checked) {
        var dom = vdom.dom
        if (dom) {
            setTimeout(function () {
                //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                //并且要先设置defaultChecked后设置checked
                //并且必须设置延迟
                dom.defaultChecked = checked
                dom.checked = checked
            }, 30)
        }
    }
}
