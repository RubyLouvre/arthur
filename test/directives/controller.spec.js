import { avalon } from '../../src/seed/core'
import '../../src/renders/index'

describe('controller', function () {
    var body = document.body, div, vm, h1, h2, h3, cdiv
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm && vm.$id]
    })


    it('default', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller="root">
             <h1>{{@page}}</h1>
             <div ms-controller="first">
             <h2 ms-text="@page"></h2>
             <div ms-if="@page=='first'">
             <div ms-controller="second">
             <h3 ms-html="@page"></h3>
             <div ms-if="@page == 'second'" id="cdiv">{{@level}}-{{@page}}-{{@kind}}</div>
             </div>
             </div>
             </div>
             </div>
             */
        })
        body.appendChild(div)
        var root = avalon.define({
            $id: 'root',
            page: 'root',
            level: 'root'
        });
        var first = avalon.define({
            $id: 'first',
            page: 'first',
            kind: 'first'
        });
        var second = avalon.define({
            $id: 'second',
            page: 'second',
            grade: "second"
        });

        avalon.scan(div)

        setTimeout(function () {
            h1 = div.getElementsByTagName('h1')[0]
            h2 = div.getElementsByTagName('h2')[0]
            h3 = div.getElementsByTagName('h3')[0]
            cdiv = document.getElementById('cdiv')

            expect(h1.innerHTML).toBe(root.page)
            expect(h2.innerHTML).toBe(first.page)
            expect(h3.innerHTML).toBe(second.page)
            expect(cdiv.innerHTML).toBe([root.level, second.page, first.kind].join('-'))
            first.page = 'A'
            setTimeout(function () {
                h1 = div.getElementsByTagName('h1')[0]
                h2 = div.getElementsByTagName('h2')[0]
                h3 = div.getElementsByTagName('h3')[0]
                cdiv = document.getElementById('cdiv')

                expect(h1.innerHTML).toBe(root.page)
                expect(h2.innerHTML).toBe(first.page)
                expect(!!h3).toBe(false)
                expect(!!cdiv).toBe(false)

                first.page = 'first'
                second.page = 'B'
                setTimeout(function () {
                    h1 = div.getElementsByTagName('h1')[0]
                    h2 = div.getElementsByTagName('h2')[0]
                    h3 = div.getElementsByTagName('h3')[0]
                    cdiv = document.getElementById('cdiv')

                    expect(h1.innerHTML + "!").toBe(root.page + "!")
                    expect(h2.innerHTML + "!!").toBe(first.page + "!!")
                    expect(h3.innerHTML + "!!!").toBe(second.page + "!!!")
                    expect(!!cdiv).toBe(false)
                    setTimeout(function () {
                        delete avalon.vmodels.root
                        delete avalon.vmodels.first
                        delete avalon.vmodels.second
                        done()
                    })

                })


            }, 100)

        }, 100)


    })
})