
describe('for', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('简单的一维数组循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='for0' >
             <ul>
             <li ms-for='($index, el) in @array ' data-for-rendered="@fn">{{$index}}::{{el}}</li>
             </ul>
             </div>
             */
        })
        var called = false
        vm = avalon.define({
            $id: 'for0',
            array: [1, 2, 3, 4, 5],
            fn: function () {
                called = true
            }
        })
        avalon.scan(div)
        setTimeout(function () {
            var lis = div.getElementsByTagName('li')
            var ps = div.getElementsByTagName('p')
            expect(lis[0].innerHTML).toBe('0::1')
            expect(lis[1].innerHTML).toBe('1::2')
            expect(lis[2].innerHTML).toBe('2::3')
            expect(lis[3].innerHTML).toBe('3::4')
            expect(lis[4].innerHTML).toBe('4::5')
            vm.array.reverse()
            setTimeout(function () {
                expect(lis[0].innerHTML).toBe('0::5')
                expect(lis[1].innerHTML).toBe('1::4')
                expect(lis[2].innerHTML).toBe('2::3')
                expect(lis[3].innerHTML).toBe('3::2')
                expect(lis[4].innerHTML).toBe('4::1')
                done()
            })

        }, 300)
    })


    it('简单的对象循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='for0' >
             <ul>
             <li ms-for='($index, el) in @array |limitBy(4)' data-for-rendered="@fn">{{$index}}::{{el}}</li>
             </ul>
             </div>
             */
        })
        var called = false
        vm = avalon.define({
            $id: 'for0',
            array: {
                a: 11,
                b: 22,
                c: 33,
                d: 44,
                e: 55
            },
            fn: function () {
                called = true
            }
        })
        avalon.scan(div)
        setTimeout(function () {
            var lis = div.getElementsByTagName('li')
            var ps = div.getElementsByTagName('p')
            expect(lis[0].innerHTML).toBe('a::11')
            expect(lis[1].innerHTML).toBe('b::22')
            expect(lis[2].innerHTML).toBe('c::33')
            expect(lis[3].innerHTML).toBe('d::44')
            expect(lis.length).toBe(4)
            expect(called).toBe(true)
            done()


        }, 300)
    })

    it('使用注释循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="for1" >
             <!--ms-for:el in @forlist -->
             <p>{{el}}</p>
             <!--ms-for-end:-->
             </div>
             */
        })

        vm = avalon.define({
            $id: "for1",
            forlist: [1, 2, 3]
        })
        avalon.scan(div)
        setTimeout(function () {
            var ps = div.getElementsByTagName('p')
            expect(ps.length).toBe(3)
            done()
        }, 300)
    })
    it('双层循环,并且重复利用已有的元素节点', function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='for1'>
             <table>
             <tr ms-for='tr in @array'>
             <td ms-for='td in tr'>{{td}}</td>
             </tr>
             </table>
             </div>
             */
        })
        vm = avalon.define({
            $id: 'for1',
            array: [[1, 2, 3], [4, 5, 6], [7, 8, 9, 10]]
        })
        avalon.scan(div)
        setTimeout(function () {
            var tds = div.getElementsByTagName('td')

            expect(tds[0].innerHTML).toBe('1')
            expect(tds[1].innerHTML).toBe('2')
            expect(tds[2].innerHTML).toBe('3')
            expect(tds[3].innerHTML).toBe('4')
            expect(tds[4].innerHTML).toBe('5')
            expect(tds[5].innerHTML).toBe('6')
            expect(tds[6].innerHTML).toBe('7')
            expect(tds[7].innerHTML).toBe('8')
            expect(tds[8].innerHTML).toBe('9')
            expect(tds[9].innerHTML).toBe('10')
            avalon.each(tds, function (i, el) {
                el.title = el.innerHTML
            })
            vm.array = [[11, 22, 33], [44, 55, 66], [77, 88, 99]]
            setTimeout(function () {
                expect(tds.length).toBe(9)
                expect(tds[0].innerHTML).toBe('11')
                expect(tds[1].innerHTML).toBe('22')
                expect(tds[2].innerHTML).toBe('33')
                expect(tds[3].innerHTML).toBe('44')
                expect(tds[4].innerHTML).toBe('55')
                expect(tds[5].innerHTML).toBe('66')
                expect(tds[6].innerHTML).toBe('77')
                expect(tds[7].innerHTML).toBe('88')
                expect(tds[8].innerHTML).toBe('99')

                /*     expect(tds[0].title).toBe('1')
                     expect(tds[1].title).toBe('2')
                     expect(tds[2].title).toBe('3')
                     expect(tds[3].title).toBe('4')
                     expect(tds[4].title).toBe('5')
                     expect(tds[5].title).toBe('6')
                     expect(tds[6].title).toBe('7')
                     expect(tds[7].title).toBe('8')
                     expect(tds[8].title).toBe('9')*/
                done()
            })
        })
    })

    it('监听数组长度变化', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <select ms-controller='for2'>
             <option ms-for='el in @array'>{{el.length}}</option>
             </select>
             */
        })
        vm = avalon.define({
            $id: 'for2',
            array: [[1, 2], [3, 4, 5]]
        })
        avalon.scan(div)
        setTimeout(function () {
            var options = div.getElementsByTagName('option')

            expect(options[0].innerHTML).toBe('2')
            expect(options[1].innerHTML).toBe('3')

            vm.array = [['a', "b", "c", "d"], [3, 4, 6, 7, 8]]
            setTimeout(function () {

                expect(options[0].innerHTML).toBe('4')
                expect(options[1].innerHTML).toBe('5')
                done()
            })
        })
    })

    it('添加新的对象元素', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller='for3'>
             <li ms-for='el in @array'>{{el.a}}</li>
             </ul>
             */
        })
        vm = avalon.define({
            $id: 'for3',
            array: [{ a: 1 }]
        })
        avalon.scan(div)
        setTimeout(function () {
            var lis = div.getElementsByTagName('li')

            expect(lis[0].innerHTML).toBe('1')

            vm.array = [{ a: 2 }, { a: 3 }]
            setTimeout(function () {

                expect(lis[0].innerHTML).toBe('2')
                expect(lis[1].innerHTML).toBe('3')
                done()
            })
        })
    })

    it('ms-if与ms-for并用', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <ul ms-controller='for4'>
             <div class='panel' ms-for='(jj, el) in @panels' ms-if='jj === @curIndex' ms-html='el'></div>
             </ul>
             */
        })
        vm = avalon.define({
            $id: 'for4',
            curIndex: 0, //默认显示第一个
            panels: ["<div>面板1</div>", "<p>面板2</p>", "<strong>面板3</strong>"]
        })
        avalon.scan(div)
        setTimeout(function () {
            var ds = div.getElementsByTagName('div')
            var prop = 'innerText' in div ? 'innerText' : 'textContent'
            expect(ds[0][prop]).toBe('面板1')
            vm.curIndex = 1
            setTimeout(function () {
                expect(ds[0][prop]).toBe('面板2')
                vm.curIndex = 2
                setTimeout(function () {
                    expect(ds[0][prop]).toBe('面板3')
                    done()
                })
            })
        })
    })
    it('ms-if+ms-for', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="for10">
             <div ms-if="@toggle">
             <p class="am-text-danger">此处是带ms-if的内容</p>
             <ul class="am-list" >
             <li ms-for="el in @lists">{{el}}</li>
             </ul>
             </div>
             </div>
             */
        })

        vm = avalon.define({
            $id: 'for10',
            lists: ['你好', '司徒正美'],
            toggle: true
        });
        avalon.scan(div)
        setTimeout(function () {
            var ss = div.getElementsByTagName('li')
            expect(ss.length).toBe(2)
            vm.toggle = false
            setTimeout(function () {
                var ss = div.getElementsByTagName('li')
                expect(ss.length).toBe(0)
                vm.toggle = true
                setTimeout(function () {
                    var ss = div.getElementsByTagName('li')
                    expect(ss.length+"!!").toBe("2!!")
                    done()
                })
            })
        })

    })
    it('数组循环+对象循环', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <table ms-controller="for7" >
             <tr ms-for="el in @list">
             <td ms-for="elem in el">{{elem}}</td>
             </tr>
             </table>
             */
        })
        vm = avalon.define({
            $id: 'for7',
            list: [{ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }]
        })
        avalon.scan(div)
        setTimeout(function () {
            var tds = div.getElementsByTagName('td')
            expect(tds.length).toBe(9)
            done()

        }, 300)
    })
})