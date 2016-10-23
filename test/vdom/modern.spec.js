import {avalon, vdom } from '../../src/vdom/modern'
describe('vdom', function () {
    describe('VElement', function () {
        it('test', function () {
            var el = new vdom.VElement('p', { title: '111' }, [])
            expect(el).toInstanceOf(vdom.VElement)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.toDOM().title).toBe('111')
            expect(el.toHTML().toLowerCase()).toBe('<p title="111"></p>')
            if (avalon.modern) {
                var circle = new vdom.VElement('circle', {}, [])
                expect(circle.toDOM().nodeName).toBe('circle')


                var template = new vdom.VElement('template', {}, [
                    new vdom.VText('111')
                ])
                expect(template.toDOM().nodeName).toBe('TEMPLATE')


            }
            var xmp = new vdom.VElement('xmp', { 'for': 'ddd', 'class': 'a b', style: 'border: 4px' }, [
                new vdom.VText('111')
            ])
            expect(xmp.toDOM().nodeName).toBe('XMP')
            expect(xmp.toDOM().htmlFor).toBe('ddd')
            expect(xmp.toDOM().className).toBe('a b')
            expect(xmp.toDOM().style.borderWidth).toMatch(/4/i)
            var noscript = new vdom.VElement('noscript', {}, [
                new vdom.VText('111')
            ])

            expect(noscript.toDOM().nodeName).toBe('NOSCRIPT')
            expect(noscript.toDOM().innerText).toBe('111')

            var style = new vdom.VElement('style', {}, [
                new vdom.VText('.blue{color:blue}')
            ])
            expect(style.toDOM().nodeName).toBe('STYLE')
            var script = new vdom.VElement('script', {}, [
                new vdom.VText('var a = 1')
            ])
            expect(script.toDOM().nodeName).toBe('SCRIPT')
            expect(script.toDOM().text).toBe('var a = 1')

            var input = new vdom.VElement('input', { type: 'password' }, [

            ], true)
            expect(input.toDOM().nodeName).toBe('INPUT')
            expect(input.toDOM().type).toBe('password')
            expect(input.toHTML()).toBe('<input type="password"/>')
            expect(vdom(input, 'toDOM').nodeName).toBe('INPUT')
        })

    })

    describe('VComment', function () {

        it('test', function () {
            var el = new vdom.VComment('aaa')
            expect(el).toInstanceOf(vdom.VComment)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.nodeValue).toBe('aaa')
            expect(el.nodeName).toBe('#comment')
            expect(el.toDOM().nodeType).toBe(8)
            expect(el.toHTML()).toBe('<!--aaa-->')
            expect(vdom(el, 'toDOM')).toBe(el.dom)
        })
    })
    describe('VText', function () {

        it('test', function () {
            var el = new vdom.VText('aaa')
            expect(el).toInstanceOf(vdom.VText)
            expect(el).toHaveProperty('nodeValue')
            expect(vdom(el, 'toDOM')).toBe(el.dom)

            expect(avalon.domize(el)).toBe(el.dom)
        })
    })

    describe('VFragment', function () {

        it('test', function () {
            var el = new vdom.VFragment([])
            expect(el).toInstanceOf(vdom.VFragment)
            expect(el).not.toHaveProperty('toDOM')
            expect(el).not.toHaveProperty('toHTML')
            expect(el.children).toEqual([])
            expect(el.nodeName).toBe('#document-fragment')
            expect(el.toDOM().nodeType).toBe(11)
            expect(el.toHTML()).toBe('')
            expect(el.toDOM().nodeType).toBe(11)
            var hasChildren = new vdom.VFragment([
                new vdom.VElement('p', {}, [
                    new vdom.VText('ooooo')
                ])
            ])
            expect(hasChildren.toDOM().children.length).toBe(1)
            expect(hasChildren.toHTML()).toBe('<p>ooooo</p>')
            expect(vdom(el, 'toDOM')).toBe(el.dom)
        })
    })



    describe('vdom', function () {
        it('test', function () {
            var el = vdom(null, 'toHTML')
            expect(el).toBe('')
            var el2 = vdom(null, 'toDOM')
            expect(el2.nodeType).toBe(11)

         
        })
    })

})