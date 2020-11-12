import Node from './Node.js';

export default class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            ambientColor     : [51, 51, 51],
            diffuseColor     : [255, 255, 255],
            specularColor    : [255, 255 , 255],
            shininess        : 10,
            attenuatuion     : [1.0, 0.0014, 0.000007]
        });
    }

}