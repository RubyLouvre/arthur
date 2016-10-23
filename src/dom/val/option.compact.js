var roption = /^<option(?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s+value[\s=]/i
export function option(node) {
       //在IE11及W3C，如果没有指定value，那么node.value默认为node.text（存在trim作），但IE9-10则是取innerHTML(没trim操作)
       //specified并不可靠，因此通过分析outerHTML判定用户有没有显示定义value
       return roption.test(node.outerHTML) ? node.value : node.text.trim()
}