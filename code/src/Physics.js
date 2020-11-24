import CollisionObject from "./CollisionObject.js";
import CheckpointObject from "./CheckpointObject.js";
import PowerupObject from "./PowerupObject.js";

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;


export default class Physics {

    constructor(scene) {
        this.scene = scene;

        this.shipDamage = 0;
    }

    update(spaceship) {
        let result;
        this.scene.traverse(other => {
            if (other instanceof CollisionObject) {
                // First child is camera, second child is collision object (in the case of a spaceship):
                if(other != spaceship.spaceship.children[1]) {
                    // If the object we're colliding with isn't the object itself:
                    this.resolveCollision(spaceship, other);
                }
            }
            if (other instanceof CheckpointObject) {
                // First child is camera, second child is collision object (in the case of a spaceship):
                if(other != spaceship.spaceship.children[1]) {
                    // If the object we're colliding with isn't the object itself:
                    let tmp = this.resolveCollisionCheckpoint(spaceship, other);
                    if(tmp){
                        result = other;
                    }
                }
            }
            if (other instanceof PowerupObject) {
                // First child is camera, second child is collision object (in the case of a spaceship):
                if(other != spaceship.spaceship.children[1]) {
                    // If the object we're colliding with isn't the object itself:
                    let tmp = this.resolveCollisionCheckpoint(spaceship, other);
                    if(tmp){
                        result = other;
                    }
                }
            }

        });
        return result;
    }

    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    resolveCollision(spaceship, b) {
        let a = spaceship.spaceship.children[1];

        let ta = mat4.create();
        mat4.mul(ta, a.parent.matrix, a.matrix);
        let tb = mat4.create();
        mat4.mul(tb, b.parent.matrix, b.matrix);

        const posa = mat4.getTranslation(vec3.create(), ta);
        const posb = mat4.getTranslation(vec3.create(), tb);

        const mina = vec3.add(vec3.create(), posa, a.aabb.min);
        const maxa = vec3.add(vec3.create(), posa, a.aabb.max);
        const minb = vec3.add(vec3.create(), posb, b.aabb.min);
        const maxb = vec3.add(vec3.create(), posb, b.aabb.max);

        // Check if there is collision.
        const isColliding = this.aabbIntersection({
            min: mina,
            max: maxa
        }, {
            min: minb,
            max: maxb
        });

        if (!isColliding) {
            return;
        }

        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), maxb, mina);
        const diffb = vec3.sub(vec3.create(), maxa, minb);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        let getBeforeTranslation = vec3.create();
        mat4.getTranslation(getBeforeTranslation, a.parent.matrix);
        vec3.add(getBeforeTranslation, getBeforeTranslation, minDirection);
        mat4.fromTranslation(spaceship.translationMatrix, getBeforeTranslation);

        a.parent.translation[0] = getBeforeTranslation[0];
        a.parent.translation[1] = getBeforeTranslation[1];
        a.parent.translation[2] = getBeforeTranslation[2];

        this.shipDamage += 1;
    }

    resolveCollisionCheckpoint(spaceship, b) {
        let a = spaceship.spaceship.children[1];

        let ta = mat4.create();
        mat4.mul(ta, a.parent.matrix, a.matrix);
        let tb = mat4.create();
        mat4.mul(tb, b.parent.matrix, b.matrix);

        const posa = mat4.getTranslation(vec3.create(), ta);
        const posb = mat4.getTranslation(vec3.create(), tb);

        const mina = vec3.add(vec3.create(), posa, a.aabb.min);
        const maxa = vec3.add(vec3.create(), posa, a.aabb.max);
        const minb = vec3.add(vec3.create(), posb, b.aabb.min);
        const maxb = vec3.add(vec3.create(), posb, b.aabb.max);

        // Check if there is collision.
        const isColliding = this.aabbIntersection({
            min: mina,
            max: maxa
        }, {
            min: minb,
            max: maxb
        });

        if (!isColliding) {
            return;
        }

        return true;
    }

}