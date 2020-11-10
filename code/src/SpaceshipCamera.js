const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
const quat = glMatrix.quat;

export default class SpaceshipCamera {
    constructor() {
        this.spaceship = undefined;
        this.camera = undefined;

        this.matrix = mat4.create();

        // Movement variables

        this.velocity = [0,0,0];
        this.mouseSensitivity = 0.0002;
        this.maxSpeed = 0.3;
        this.friction = 0.2;
        this.acceleration = 2;

        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};
    }

    // ----------------------------------------------------------
    //          FUNCTIONS FOR MOVING THE OBJECT/NODE
    // ----------------------------------------------------------

    update(dt) {  
        const c = this.camera;
        const s = this.spaceship;

        const forward = vec3.set(vec3.create(),
            -Math.sin(c.rotation[1]), 0, -Math.cos(c.rotation[1]));
        const right = vec3.set(vec3.create(),
            Math.cos(c.rotation[1]), 0, -Math.sin(c.rotation[1]));
        
        // 1: add movement acceleration
        let acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
        }

        // 2: update velocity
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // 3: if no movement, apply friction
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
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
        mat4.multiply(this.matrix, tempMatrix, this.matrix);

        this.spaceship.matrix = this.matrix;
        this.camera.matrix = this.matrix;

        this.camera.updateTransform();
        this.spaceship.updateTransform();

        this.camera.updateMatrix();
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

    mousemoveHandler(e) {
        // Currently don't really need mouse rotation:
        /* const dx = e.movementX;
        const dy = e.movementY;
        const c = this.camera;

        c.rotation[0] -= dy * c.mouseSensitivity;
        c.rotation[1] -= dx * c.mouseSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        if (c.rotation[0] > halfpi) {
            c.rotation[0] = halfpi;
        }
        if (c.rotation[0] < -halfpi) {
            c.rotation[0] = -halfpi;
        }

        c.rotation[1] = ((c.rotation[1] % twopi) + twopi) % twopi; */
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }
}