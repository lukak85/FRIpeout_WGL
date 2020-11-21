import Node from './../imported_code/Node.js';

export default class CollisionObject extends Node {
    onstructor(position, length, width, height) {
        super();
        this.translation = vec3.create(position);

        this.aabb = {
            min: [-length/2, -width/2, -height/2],
            max: [length/2, width/2, height/2]
        }
    }
}