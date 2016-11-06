import { avalon } from '../../src/seed/core'
import '../../src/renders/index'

describe('effect', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('effect1', function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <style>
             .animate-enter, .animate-leave{
             width:100px;
             height:100px;
             background: #29b6f6;
             transition: width 1s;
             -moz-transition: width 1s; 
             -webkit-transition: width 1s; 
             -o-transition: width 1s; 
             }  
             .animate-enter-active, .animate-leave{
             width:300px;
             }
             .animate-leave-active{
             width:100px;
             }
             </style>
             <div ms-controller="effect1">
             <xmp :widget="{is:'ms-test',$id:'effxx'}"></xmp>
             </div>
             */
        })

        avalon.effect("animate", {});
        avalon.component("ms-test", {
            template: "<div><p :for='el in @data' :effect='{is : \"animate\",action : el.action}'></p></div>",
            defaults: {
                //这里不会报错
                data: [{action: 'enter'}],
                add: function () {
                    //push的时候报错
                    this.data.push({
                        action: "enter"

                    });
                }
            }
        });
        vm = avalon.define({
            $id: "effect1",
            show: function () {
                avalon.vmodels.effxx.add();
            }
        });
        avalon.scan(div)
        setTimeout(function () {
            expect(div.getElementsByTagName('p').length).toBe(1)
            vm.show()
            setTimeout(function () {
                expect(div.getElementsByTagName('p').length).toBe(2)
                done()
                setTimeout(function () {
                    delete avalon.vmodels['effxx']
                    delete avalon.scopes['effxx']
                    delete avalon.component['ms-test']
                })
                //  delete avalon.vmodels['effect1']
            }, 500)
        }, 500)
    })
})