import { avalon } from '../../src/seed/core'
import '../../src/component/index'

avalon.component('ms-button', {
    template: '<button type="button"><span><slot /></span></button>',
    defaults: {
        buttonText: "button"
    },
    soleSlot: 'buttonText'
})
avalon.component('ms-panel', {
    template: heredoc(function(){
        /*
<div>
    <div class="body">
        <slot name="body"></slot>
    </div>
    <p><ms-button :widget="@button" /></p>
</div>
         */
    }),
    defaults: {
        body: "&nbsp;&nbsp;",
        button: {
            buttonText: 'click me!'
        }
    },
    soleSlot: 'body'
})

describe('widget', function () {
    var textProp = 'textContent' in document ? 'textContent': 'innerText' 

    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })


    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('ms-button中buttonText', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='widget0' >
             <xmp is='ms-button'>{{@btn}}</xmp>
             <ms-button>这是标签里面的TEXT</ms-button>
             <ms-button ms-widget='{buttonText:"这是属性中的TEXT"}'></ms-button>
             <ms-button></ms-button>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget0',
            btn: '这是VM中的TEXT'
        })
        avalon.scan(div)
        setTimeout(function () {

            var span = div.getElementsByTagName('span')
            expect(span[0][textProp]).toBe('这是VM中的TEXT')
            expect(span[1][textProp]).toBe('这是标签里面的TEXT')
            expect(span[2][textProp]).toBe('这是属性中的TEXT')
            expect(span[3][textProp]).toBe('button')
            vm.btn = '改动'
            setTimeout(function () {
                expect(span[0][textProp]).toBe('改动')

                done()
            })
        })


    })
    
     it('通过更新配置对象修改组件界面(VM对象形式)', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='widget1' >
             <xmp is='ms-panel' ms-widget="@aaa" style='border:1px solid red;display:block'>{{@aaa.panelBody}}</xmp>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'widget1',
            aaa: {
                panelBody: 'aaa面板',
                button: {
                    buttonText: "aaa按钮"
                }
            }
        })
        avalon.scan(div)
        function getDiv(el) {
            if (el.querySelector) {
                return el.querySelector('.body')
            } else {
                return el.getElementsByTagName('div')[0].
                        getElementsByTagName('div')[0]
            }
        }
        setTimeout(function () {
            var div2 = getDiv(div)
            var span = div.getElementsByTagName('span')[0]
            expect(div2[textProp]).toBe('aaa面板')
            expect(span[textProp]).toBe('aaa按钮')
            vm.aaa.panelBody = '新面板'
            vm.aaa.button.buttonText = "新按钮"
            setTimeout(function () {
                expect(div2[textProp]).toBe('新面板')
                expect(span[textProp]).toBe('新按钮')
                vm.aaa.panelBody = '新面板plus'
                vm.aaa.button.buttonText = "新按钮plus"
                setTimeout(function () {

                    expect(div2[textProp]).toBe('新面板plus')
                    expect(span[textProp]).toBe('新按钮plus')
                    done()
                }, 300)
            }, 300)
        }, 300)
    })

    it('通过更新配置对象修改组件界面(数组形式)', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='widget1' >
             <xmp ms-widget="[{is:'ms-panel'}, @aaa]" style='border:1px solid red;display:block'>{{@aaa.panelBody}}</xmp>
             </div>
             */
        })
        var panelVm 
        vm = avalon.define({
            $id: 'widget1',
            aaa: {
                panelBody: 'aaa面板',
                onInit:function(e){
                    panelVm = e.vmodel 
                },
                button: {
                    onInit:function(e){
//                         panelVm.$watch('button.buttonText', function(v){
//                            e.vmodel.buttonText = v
//                         })
                    },
                    buttonText: "aaa按钮"
                }
            }
        })
        avalon.scan(div)
        function getDiv(el) {
            if (el.querySelector) {
                return el.querySelector('.body')
            } else {
                return el.getElementsByTagName('div')[0].
                        getElementsByTagName('div')[0]
            }
        }
        setTimeout(function () {
            var div2 = getDiv(div)
            var span = div.getElementsByTagName('span')[0]
            expect(div2[textProp]).toBe('aaa面板')
            expect(span[textProp]).toBe('aaa按钮')
            vm.aaa.panelBody = '新面板'
            vm.aaa.button.buttonText = "新按钮"
            setTimeout(function () {
                expect(div2[textProp]).toBe('新面板')
                expect(span[textProp]).toBe('新按钮')
                vm.aaa.panelBody = '新面板plus'
                vm.aaa.button.buttonText = "新按钮plus"
                setTimeout(function () {

                    expect(div2[textProp]).toBe('新面板plus')
                    expect(span[textProp]).toBe('新按钮plus')
                    done()
                }, 300)
            }, 300)
        }, 300)
    })

})