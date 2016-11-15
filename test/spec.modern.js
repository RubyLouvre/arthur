import './seed/core.spec'
import './seed/browser.spec'
import './seed/cache.spec'
import './seed/lang.modern.spec'

import './filters/index.spec'
import './vdom/modern.spec'

//DOM相关
import './dom/shim.modern.spec'
import './dom/ready.modern.spec'
import './dom/val.modern.spec'
import './dom/class.modern.spec'
import './dom/html.spec'
import './dom/attr.modern.spec'
import './dom/event.modern.spec'
import './dom/css.modern.spec'

import './vtree/clearString.spec'
import './vtree/fromString.spec'
import './vtree/fromDOM.spec'


import './vmodel/modern.spec'

//这不是测试，但下面的模块都依赖这个

import '../src/renders/modern'

import './directives/attr.spec'


