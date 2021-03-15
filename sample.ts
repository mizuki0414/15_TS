let a = "a";
let b = "true";

// any
// void
function func(a: number, b: boolean): number {
    return a;
}

// Array
let aa: number[] = [10, 20]

// Object
interface Hoge {
    a: number,
    b?: number | null,
}

let v: Hoge = { a: 10 }

