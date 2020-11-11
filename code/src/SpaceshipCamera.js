const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
const quat = glMatrix.quat;

export default class SpaceshipCamera {
    constructor() {
        this.spaceship = undefined;

        this.matrix = mat4.create();

        // Movement variables

        this.velocity = [0,0,0];
        this.mouseSensitivity = 0.0002;
        this.maxSpeed = 1.5;
        this.friction = 0.2;
        this.acceleration = 2;

        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        // --------------------------------------------------------

        this.angle = 0;
        this.translationMatrix = mat4.create();
        this.rotationSpeed = 2;
    }

    // ----------------------------------------------------------
    //          FUNCTIONS FOR MOVING THE OBJECT/NODE
    // ----------------------------------------------------------

    update(dt) {
        const s = this.spaceship;

        const forward = vec3.set(vec3.create(),
            -Math.sin(this.angle), 0, -Math.cos(this.angle));
        const right = vec3.set(vec3.create(),
            Math.cos(this.angle), 0, -Math.sin(this.angle));
        
        // 1: add movement acceleration
        let acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            this.rotate(dt, 1);
        }
        if (this.keys['KeyA']) {
            this.rotate(dt, -1);
        }

        // 2: update velocity
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // 3: if no movement, apply friction
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'])
        {
            vec3.scale(this.velocity, this.velocity, 1 - this.friction);
        }

        // 4: limit speed
        const len = vec3.len(this.velocity);
        if (len > this.maxSpeed) {
            vec3.scale(this.velocity, this.velocity, this.maxSpeed / len);
        }

        let tempMatrix = mat4.create();

        mat4.fromTranslation(tempMatrix, this.velocity);
        mat4.multiply(this.translationMatrix, tempMatrix, this.translationMatrix);

        mat4.fromYRotation(tempMatrix, this.angle);
        mat4.multiply(this.matrix, this.translationMatrix, tempMatrix);

        this.spaceship.matrix = this.matrix;

        this.spaceship.updateTransform();

        this.spaceship.updateMatrix();
    }

    enable() {
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    disable() {
        document.removeEventListener('mousemove', this.mousemoveHandler);
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);

        for (let key in this.keys) {
            this.keys[key] = false;
        }
    }

    rotate(dt, dir) {
        const s = this.spaceship;

        this.angle -= dir * dt * this.rotationSpeed;

        const pi = Math.PI;
        const twopi = pi * 2;

        // s.rotation[1] = ((s.rotation[1] % twopi) + twopi) % twopi;
    }

    mousemoveHandler(e) {
        // Nothing so far
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }
}