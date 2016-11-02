
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
             <li ms-for='($index, el) in @array ' data-for-rendered="@fn">{{$index}}::{{el}}</li>
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
                d: 44
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
           
          done()
          

        }, 300)
    })


})