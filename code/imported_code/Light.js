import Node from './Node.js';

export default class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            ambientColor     : [51, 51, 51],
            diffuseColor     : [224, 224, 224],
            specularColor    : [255, 255, 255],
            shininess        : 10,
            attenuatuion     : [1.0, 0.000014, 0.0000000007]
        });
    }

}