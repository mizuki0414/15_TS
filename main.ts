class User {

}

console.log("hello user")

// jsは以下のような動的型付ができる
// var x = 10;
// x = "hello";


// typescriptは静的型付言語なので
// var x: number = 10;
// x = "hello";

var i: number;
var i: number = 10;
var i = 10; 　//こうやっても10(number)として型が決まる

var x;　// var x: anyこの時点ではany型
x = 10;
x = "hello";