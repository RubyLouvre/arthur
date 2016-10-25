/**
$$skipArray:是系统级通用的不可监听属性
$skipArray: 是当前对象特有的不可监听属性

 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 */
export var $$skipArray = {
    $id: true,
    $render: true,
    $track: true,
    $element: true,
    $watch: true,
    $fire: true,
    $events: true,
    $skipArray: true,
    $accessors: true,
    $hashcode: true,
    __proxy__: true,
    __data__: true,
    __const__: true
}