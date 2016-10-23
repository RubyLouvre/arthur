export let window = typeof window === 'object' ? window :
    typeof global === 'object' ? global : {}
export let inBrowser = window.location && window.navigator
/* istanbul ignore if  */
if (!window.JSON) {
    window.JSON = {
        stringify: function () {
            throw 'undefined json'
        }
    }
}

export let document = inBrowser ? window.document : {
    createElement: Object,
    createElementNS: Object,
    documentElement: 'xx',
    contains: Boolean
}
export var root = inBrowser ? document.documentElement : {
    outerHTML: 'x'
}

let versions = {
    objectobject: 7,//IE7-8
    objectundefined: 6,//IE6
    undefinedfunction: NaN,// other modern browsers
    undefinedobject: NaN //Mobile Safari 8.0.0 (iOS 8.4.0) 
}
/* istanbul ignore next  */
export var msie = inBrowser.documentMode ||
    versions[typeof document.all + typeof XMLHttpRequest]

export var modern = msie !== msie

