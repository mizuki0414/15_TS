import * as utils from "./utils"

class Field {
    private field:Array<number>[];

    constructor(size:number=20) {
        this.field = utils.createArray2D(20,20,0);
    }
}
