console.log("hello world");
let matrix:number[] = [];

for(let i = 0; i < 10; i++) {
    matrix[i] = i + 1;
}

matrix.forEach(function(ele, index){
    console.log(index, ele);
})
