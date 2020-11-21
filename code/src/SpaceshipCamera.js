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
        this.maxSpeed = 45;
        this.friction = 0.15;
        this.acceleration = 20;

        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        // --------------------------------------------------------

        this.angle = 0;
        this.translationMatrix = mat4.create();
        this.rotationSpeed = 2;

        // --------------------------------------------------------

        this.cameraRotation = 0;
        this.maxCameraAngle = 0.20;

        this.firstLoop = true;
        this.initCameraMatrix = mat4.create();

        // --------------------------------------------------------

        this.spaceshipAudio = document.createElement("audio");
        this.spaceshipAudio.src = "./../../assets/audio/Sub - Sub Bees.mp3";
        this.spaceshipAudio.loop = true;
        this.spaceshipAudio.volume = 0.2;

        this.drivingAudio = document.createElement("audio");
        this.drivingAudio.src = "./../../assets/audio/415673__burghrecords__spaceship-cruising-ufo_2.mp3";
        this.drivingAudio.loop = true;
        this.drivingAudio.volume = 0.2;
    }

    // ----------------------------------------------------------
    //          FUNCTIONS FOR MOVING THE OBJECT/NODE
    // ----------------------------------------------------------

    update(dt) {
        const s = this.spaceship;
        const cam = this.spaceship.children[0];

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
        vec3.scaleAndAdd(this.velocity, this.velocity, acc,  dt * this.acceleration);

        // 3: if no movement, apply friction
        vec3.scale(this.velocity, this.velocity, 1 - this.friction);


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

        //------------------------------------------------
        // Camera rotation so it's not completely static:
        //------------------------------------------------
        if(this.firstLoop && this.spaceship) {
            this.firstLoop = false;
            mat4.copy(this.initCameraMatrix, cam.matrix);
        }

        let cameraMatrix = mat4.create();
        this.cameraCenter(dt);

        mat4.fromRotation(cameraMatrix, this.cameraRotation, [0,1,0]);

        mat4.multiply(cam.matrix, cameraMatrix, this.initCameraMatrix);

        //-----------------------
        // Play spaceship sounds:
        //-----------------------
        if(this.keys['KeyW'] || this.keys['KeyS']) {
            this.spaceshipAudio.pause();
            this.spaceshipAudio.currentTime = 0;
            this.drivingAudio.play();

            if(this.drivingAudio.currentTime > 4) {
                this.drivingAudio.currentTime = 0;
            }
        }
        else if(!(this.keys['KeyW'] || this.keys['KeyS'])) {
            this.drivingAudio.pause();
            this.drivingAudio.currentTime = 0;
            this.spaceshipAudio.play();

            if(this.spaceshipAudio.currentTime > 3) {
                this.spaceshipAudio.currentTime = 0;
            }
        }
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

        // Camera rotation:
        this.cameraRotation += dir * dt * this.rotationSpeed;
        if(this.cameraRotation > this.maxCameraAngle - 0.01) {
            this.cameraRotation = this.maxCameraAngle;
        }
        else if(this.cameraRotation < -this.maxCameraAngle + 0.01) {
            this.cameraRotation = -this.maxCameraAngle;
        }
        
        // this.cameraRotation = dir * Math.min(Math.abs(this.maxCameraAngle), Math.abs(this.cameraRotation));

        // s.rotation[1] = ((s.rotation[1] % twopi) + twopi) % twopi;
    }

    cameraCenter(dt) {
        if(this.cameraRotation > 0) {
            if(this.cameraRotation < 0.005) {
                this.cameraRotation = 0;
            }
            else {
                this.cameraRotation -= 1.0 * dt;
            }
        }
        else if(this.cameraRotation < 0) {
            if(this.cameraRotation > -0.005) {
                this.cameraRotation = 0;
            }
            else {
                this.cameraRotation += 1.0 * dt;
            }
        }
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