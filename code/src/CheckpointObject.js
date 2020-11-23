import Node from './../imported_code/Node.js';

const vec3 = glMatrix.vec3;

export default class CheckpointObject extends Node {
    constructor(position, length, height, width) {
        super();
        this.translation = vec3.create(position);


        // console.log(position);

        /* this.aabb = {
            min: [position[0]-length/2, position[1]-height/2, position[2]-width/2],
            max: [position[0]+length/2, position[1]+height/2, position[2]+width/2]
        }; */

        this.aabb = {
            min: [-length/2, -height/2, -width/2],
            max: [length/2, height/2, width/2]
        };
    }
}