import { avalon } from '../../src/seed/core'
import { getOption, getDuplexType } from '../../src/dom/val/compact'

describe('value', function () {
    var a, b, c, d, e, f
    beforeEach(function () {
        a = document.createElement("option");
        var div = document.createElement('div')
        div.innerHTML = '<input type="radio" /><input type="checkbox" />'
        b = div.children[0]
        c = div.children[1]
        d = document.createElement('textarea')
        e = document.createElement('select')
        f = document.createElement('input')
    })
    it('option', function () {
        a.innerText = ' 111 '
        expect(getOption(a)).toBe('111')
        a.setAttribute('value', ' 222 ')
        expect(getOption(a)).toBe(' 222 ')
    })
    it('getDuplexType', function () {

        expect(getDuplexType(a)).toBe('option')
        expect(getDuplexType(b)).toBe('checked')
        expect(getDuplexType(c)).toBe('checked')
        expect(getDuplexType(d)).toBe('textarea')
        expect(getDuplexType(e)).toBe('select')
        expect(getDuplexType(f)).toBe('text')
    })

    it('fn.val', function () {
        expect(avalon(a).val()).toBe('')
        avalon(a).val(333)
        expect(avalon(a).val()).toBe('333')
        avalon(f).val('dd')
        expect(avalon(f).val()).toBe('dd')
        e.options.add(new Option("aa","111"))
        e.options.add(new Option("bb","222"))
        e.options.add(new Option("cc","333"))
        expect( avalon(e).val() ).toBe('111')
        avalon(e).val('222')
        expect( avalon(e).val() ).toBe('222')
        expect( e.children[1].selected ).toBe(true)
        e.multiple = true
        e.options.add(new Option("dd","444"))
        e.children[0].disabled = true
        expect( avalon(e).val() ).toEqual(['222'])
        avalon(e).val([])
        expect( e.children[1].selected ).toBe(false)
    })
})
