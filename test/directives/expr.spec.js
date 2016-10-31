import { avalon } from '../../src/seed/core'
import '../../src/renders/index'

describe('expr', function () {

    it('两个插值在同一文本节点中', function () {
        var div = document.createElement('div')
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="text1">{{@aaa}}+{{@bbb}}</div>
            */
        })
        var vm = avalon.define({
            $id: 'text1',
            aaa: 111,
            bbb: 222
        })
        avalon.scan(div)
        expect(div.innerHTML).toBe('<div>111+222</div>')
        delete avalon.vmodels.text1
    })

    it('存在过滤器', function () {
        var div = document.createElement('div')
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="text2">{{@aaa | uppercase}}+{{@bbb}}</div>
            */
        })
        var vm = avalon.define({
            $id: 'text2',
            aaa: 'aaa',
            bbb: 222
        })
        avalon.scan(div)
        expect(div.innerHTML).toBe('<div>AAA+222</div>')
        delete avalon.vmodels.text2
    })

     it('存在多个过滤器', function () {
        var div = document.createElement('div')
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="text3">{{@aaa | uppercase | truncate(7)}}+{{@bbb | date("yyyy-MM-dd")}}</div>
            */
        })
        var vm = avalon.define({
            $id: 'text3',
            aaa: 'ae4dfdsfd',
            bbb: 1477928314673
        })
        avalon.scan(div)
        expect(div.innerHTML).toBe('<div>AE4D...+2016-10-31</div>')
        delete avalon.vmodels.text2
    })
})