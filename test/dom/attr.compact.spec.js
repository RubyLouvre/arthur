import { avalon } from
    '../../src/seed/core'
import { updateAttr } from
    '../../src/dom/attr/compact'
import { compactParseJSON } from
    '../../src/dom/attr/parseJSON.compact'

import { isVML } from
    '../../src/dom/attr/isVML'

describe('attr', function () {
    describe('updateAttr', function () {
        it('test', function () {
            var vnode = {
                dynamic: {},
                'ms-attr': {
                    src: 'https://github.com/ecomfe/zrender',
                    href: 'https://github.com/ecomfe/zrender',
                    'data-title': "aaa",
                    'for': 'bbb',
                    'aaa': false,
                    'class': 'eee'
                }
            }
           var option = document.createElement('label')
            option.setAttribute('aaa', '111')
            console.log('---------------'+updateAttr)
         /*    updateAttr(option, vnode)
            expect(option.src).toBe('https://github.com/ecomfe/zrender')
            expect(option.href).toBe('https://github.com/ecomfe/zrender')
            expect(option.getAttribute('data-title')).toBe('aaa')
            expect(option.getAttribute('aaa')).toBe(null)
            expect(option.getAttribute('for')).toBe('bbb')
            expect(option.className).toBe('eee')
            avalon(option).attr("title", '222')
            expect(avalon(option).attr('title')).toBe('222')*/
        })
    })

    describe('compactParseJSON', function () {
        it('test', function () {
            expect(compactParseJSON()).toBe(void 0)
            expect(compactParseJSON(null)).toBe(null)

            expect(compactParseJSON("{}")).toEqual({})
            expect(compactParseJSON("{\"test\":1}")).toEqual({ test: 1 })
            expect(compactParseJSON("\n{\"test\":1}")).toEqual({ test: 1 })

            expect(function () {
                compactParseJSON("");
            }).toThrowError(TypeError)

            expect(function () {
                compactParseJSON("{a:1}");
            }).toThrowError(TypeError)

            expect(function () {
                compactParseJSON("{'a':1}");
            }).toThrowError(TypeError)


        })
    })

    describe('isVML', function () {
        it('test', function () {
            if ( avalon.msie < 9) {
                 document.namespaces.add("v", "urn:schemas-microsoft-com:vml", "#default#VML");
                 var oval = document.createElement("v:oval")
                 expect(isVML(oval)).toBe(true)
            }else{
                 var oval = document.createElement("v:oval")
                  expect(isVML(oval)).toBe(false)
            }

        })
    })
})


