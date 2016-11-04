import { avalon } from '../../src/seed/core'
import '../../src/renders/index'

describe('duplex', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        if (div.parentNode === body) {
            body.removeChild(div)
            delete avalon.vmodels[vm.$id]
        }
    })
    it('数据转换', function (done) {
        avalon.filters.limit = function (str, a) {
            return String(str).slice(0, a)
        }
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex1' >
             <input ms-duplex-string='@aaa|limit(4)'><span>{{@aaa}}</span>
             <input ms-duplex-number='@bbb' ><span>{{@bbb}}</span>
             <input ms-duplex-boolean='@ccc' ><span>{{@ccc}}</span>
             <input ms-duplex-checked='@ddd' type='radio' ><span>{{@ddd}}</span>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex1',
            aaa: 1234567,
            bbb: '123a',
            ccc: 'true',
            ddd: true
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var inputs = div.getElementsByTagName('input')
            var spans = div.getElementsByTagName('span')

            expect(inputs[0].value).toBe('1234')
            expect(vm.aaa).toBe(1234567)
            expect(spans[0].innerHTML).toBe('1234567')
            expect(inputs[1].value).toBe('123')
            expect(vm.bbb).toBe('123a')
            expect(spans[1].innerHTML).toBe('123a')
            expect(inputs[2].value).toBe('true')
            expect(vm.ccc).toBe('true')
            expect(spans[2].innerHTML).toBe('true')
            expect(vm.ddd).toBe(true)
            expect(spans[3].innerHTML).toBe('true')
            expect(inputs[3].checked).toBe(true)
            vm.bbb = '333b'
            vm.ccc = 'NaN'
            vm.ddd = false
            setTimeout(function () {
                expect(inputs[1].value).toBe('333')
                expect(vm.bbb).toBe('333b')
                expect(spans[1].innerHTML).toBe('333b')
                expect(inputs[2].value).toBe('false')
                expect(vm.ccc).toBe('NaN')
                expect(spans[2].innerHTML).toBe('NaN')
                expect(spans[3].innerHTML).toBe('false')
                expect(inputs[3].checked).toBe(false)
                done()
            }, 100)//chrome 37还是使用定时器，需要延迟足够的时间

        }, 100)

    })
    it('checkbox', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex2' >
             <input ms-duplex-number='@aaa' value='111' type='checkbox'>
             <input ms-duplex-number='@aaa' value='222' type='checkbox'>
             <input ms-duplex-number='@aaa' value='333' type='checkbox'>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex2',
            aaa: [333]

        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var inputs = div.getElementsByTagName('input')
            expect(inputs[0].checked).toBe(false)
            expect(inputs[1].checked).toBe(false)
            expect(inputs[2].checked).toBe(true)
            fireClick(inputs[0])
            fireClick(inputs[1])
            fireClick(inputs[2])
            setTimeout(function () {
                expect(vm.aaa.concat()).toEqual([111, 222])
                done()
            }, 100)
        })
    })

    it('select', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex3' >
             <select ms-duplex-number='@aaa' multiple="true">
             <option>111</option>
             <option>222</option>
             <option>333</option>
             <option>444</option>
             </select>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex3',
            aaa: [111, 444]

        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var options = div.getElementsByTagName('option')
            expect(options[0].selected).toBe(true)
            expect(options[1].selected).toBe(false)
            expect(options[3].selected).toBe(true)

            done()

        })
    })

    it('textarea & contenteditable', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex4'>
             <textarea ms-duplex='@aaa | uppercase'></textarea>
             <blockquote ms-duplex='@bbb | lowercase' contenteditable='true'><div>2222</div></blockquote>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex4',
            aaa: "aaa",
            bbb: "BBB"
        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var textareas = div.getElementsByTagName('textarea')
            var blockquote = div.getElementsByTagName('blockquote')

            expect(textareas[0].value).toBe('AAA')
            expect(blockquote[0].innerHTML).toBe('bbb')
            vm.aaa = "aaa_bbb"
            vm.bbb = 'fff_AAA'
            setTimeout(function () {
                expect(textareas[0].value).toBe('AAA_BBB')
                expect(blockquote[0].innerHTML).toBe('fff_aaa')
                done()
            }, 80)
        }, 100)
    })

    it('select2', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex5' >
             <select ms-duplex='@aaa'>
             <option>
             aaa
             </option>
             <option>
             bbb
             </option>
             <option>
             ccc
             </option>
             <option>
             ddd
             </option>
             <input ms-duplex="@aaa"><span>{{@aaa}}</span>
             </div>
             */
        })
        var vm = avalon.define({
            $id: 'duplex5',
            aaa: "ccc"

        })
        avalon.scan(div, vm)
        setTimeout(function () {
            var options = div.getElementsByTagName('option')
            var inputs = div.getElementsByTagName('input')
            var spans = div.getElementsByTagName('span')

            expect(options[0].selected + "1").toBe(false + "1")
            expect(options[1].selected + "2").toBe(false + "2")
            expect(options[2].selected + "3").toBe(true + "3")
            expect(options[3].selected).toBe(false)

            expect(spans[0].innerHTML).toBe('ccc')
            expect(inputs[0].value).toBe('ccc')
            inputs[0].value = 'bbb'
            avalon.fireDom(div.getElementsByTagName('select')[0], 'change')
            setTimeout(function () {
//                expect(options[0].selected).toBe(false)
//                expect(options[1].selected).toBe(true)
//                expect(options[2].selected).toBe(false)
//                expect(options[3].selected).toBe(false)
//                expect(spans[0].innerHTML).toBe('bbb')

                done()
            })



        }, 80)
    })
    it('select3', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex6' >
             <select ms-duplex-number='@arr' multiple='true'>
             <option>
             111
             </option>
             <option>
             222
             </option>
             <option>
             333
             </option>
             <option>
             444
             </option>
             </select>
             <p>{{@arr}}</p>
             </div>
             */
        })
        var vm = avalon.define({
            $id: 'duplex6',
            arr: [111, 444]
        })
        avalon.scan(div, vm)
        setTimeout(function () {

            var options = div.getElementsByTagName('option')
            var ps = div.getElementsByTagName('p')
            expect(options[0].selected).toBe(true)
            expect(options[1].selected).toBe(false)
            expect(options[2].selected).toBe(false)
            expect(options[3].selected).toBe(true)
            options[0].selected = false
            options[1].selected = true
            options[2].selected = true
            options[3].selected = false
            avalon.fireDom(div.getElementsByTagName('select')[0], 'change')
            setTimeout(function () {
                expect(vm.arr.concat()).toEqual([222, 333])
                expect(ps[0].innerHTML).toEqual([222, 333] + "")
                done()
            })
        }, 100)
    })

    it('通过更新修改checkbox中的ms-duplex', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex7' >
             <label ms-for="el in @list">
             <input ms-duplex="@topic" type="checkbox" ms-attr="{id:el.name,value:el.value}" name="topic">{{el.name}}
             </label>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex7',
            topic: ['1', '2'],
            list: [{name: 'dog', value: '1'}, {name: 'bird', value: '2'}, {name: 'cat', value: '3'}],
        })
        avalon.scan(div, vm)
        setTimeout(function () {

            var inputs = div.getElementsByTagName('input')

            expect(inputs[0].checked).toBe(true)
            expect(inputs[1].checked).toBe(true)
            expect(inputs[2].checked).toBe(false)

            vm.topic = ['1', '3']
            setTimeout(function () {
                expect(inputs[0].checked).toBe(true)
                expect(inputs[1].checked).toBe(false)
                expect(inputs[2].checked).toBe(true)
                done()
            }, 100)
        }, 100)
    })
    it('ms-duplex+radio', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex8' >
             <label><input type="radio" ms-duplex-string="@isChecked" name="check" value="true">是</label>
             <label><input type="radio" ms-duplex-string="@isChecked" name="check" value="false">否</label>
             <p ms-text="@isChecked"></p>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex8',
            isChecked: ''
        })
        avalon.scan(div)
        setTimeout(function () {

            var inputs = div.getElementsByTagName('input')

            expect(inputs[0].checked).toBe(false)
            expect(inputs[1].checked).toBe(false)
            fireClick(inputs[0])
            setTimeout(function () {
                expect(vm.isChecked).toBe('true')

                fireClick(inputs[1])
                setTimeout(function () {
                    expect(vm.isChecked).toBe('false')

                    fireClick(inputs[0])
                    setTimeout(function () {
                        expect(vm.isChecked).toBe('true')
                        done()
                    }, 100)
                }, 100)
            }, 100)
        }, 100)

    })
    it('ms-duplex事件触发问题', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='duplex9' >
             <input ms-duplex="@aaa"/><em>{{@aaa}}</em>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'duplex9',
            aaa: ''
        })
        avalon.scan(div)
        setTimeout(function () {

            var input = div.getElementsByTagName('input')[0]
            input.value = 999
            avalon.fireDom(input, 'input')
            avalon.fireDom(input, 'propertychange')
            setTimeout(function () {
                expect(vm.aaa).toBe('999')
                var em = div.getElementsByTagName('em')[0]
                expect(em.innerHTML).toBe('999')
                done()
            }, 100)
        }, 100)

    })
})