/**
$$skipArray:是系统级通用的不可监听属性
$skipArray: 是当前对象特有的不可监听属性

 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 */
export var $$skipArray = {
    $id: void 0,
    $render: void 0,
    $track: void 0,
    $element: void 0,
    $watch: void 0,
    $fire: void 0,
    $events: void 0,
    $skipArray: void 0,
    $accessors: void 0,
    $hashcode: void 0,
    __proxy__: void 0,
    __data__: void 0,
    __const__: void 0
}