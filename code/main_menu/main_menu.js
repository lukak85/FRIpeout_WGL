import GLTFLoader from './../imported_code/GLTFLoader.js';
import Renderer from './MMRenderer.js';
import SpaceshipCamera from './../src/SpaceshipCamera.js';
import Light from './../imported_code/Light.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

class MMApplication {

    constructor(canvas) {
        this._update = this._update.bind(this);

        this.canvas = canvas;
        this._initGL();
        this.start();

        this.LightX = 250;
        this.LightY = 500;
        this.LightZ = 250;

        requestAnimationFrame(this._update);
    }

    _initGL() {
        this.gl = null;
        try {
            this.gl = this.canvas.getContext('webgl2', {
                preserveDrawingBuffer: true
            });
        } catch (error) {
        }

        if (!this.gl) {
            console.log('Cannot create WebGL 2.0 context');
        }
    }

    _update() {
        this._resize();
        this.update();
        this.render();
        requestAnimationFrame(this._update);
    }

    _resize() {
        const canvas = this.canvas;
        const gl = this.gl;

        if (canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight)
        {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            console.log(this.gl);

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            this.resize();
        }
    }

    async start() {
        this.loader = new GLTFLoader();
        this.loaded = false;

        // Creation of FRIpeout logo:
        await this.loader.load('../assets/models/ui/fripeout_logo.gltf');
        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        this.logo = await this.loader.loadScene(this.loader.defaultScene);
        this.scene.addNode(this.logo.nodes[0]);
        
        this.logo = this.scene.nodes[0];

        // Load spaceship:
        await this.loader.load('../assets/models/ships/3_spaceship/fripeout_ship_3.gltf');
        this.currentSpaceship = await this.loader.loadNode('Spaceship');
        this.camera = await this.loader.loadNode('Camera');
        this.scene.addNode(this.currentSpaceship);
        // this.logo.addChild(camera);

        // Camera translation;
        this.camera.translation = vec3.fromValues(0, 0, -10);
        let transl = mat4.create();
        mat4.fromTranslation(transl, this.camera.translation)
        mat4.mul(this.camera.matrix, transl, this.camera.matrix);

        this.logo.translation = vec3.fromValues(0, 0, -12.5);
        transl = mat4.create();
        mat4.fromTranslation(transl, this.logo.translation)
        mat4.mul(this.logo.matrix, transl, this.logo.matrix)

        this.loaded = true;

        // Just a simple light so we can see the scene:
        let light = new Light();
        light.translation[0] = this.LightX;
        light.translation[1] = this.LightY;
        light.translation[2] = this.LightZ;
        this.scene.addNode(light);
        this.lightMove = light;

        mat4.fromTranslation(this.lightMove.matrix, this.lightMove.translation);

        // Spaceship list:
        this.spaceshipList = [];
        this.spaceshipList.push(this.currentSpaceship);
        
        // Add second spaceship to the list:
        await this.loader.load('../assets/models/ships/1_spaceship/fripeout_ship_1.gltf');
        let spaceship = await this.loader.loadNode('Spaceship');
        this.scene.addNode(spaceship);
        this.spaceshipList.push(this.scene.nodes[4]);

        // Add third spaceship to the list:
        await this.loader.load('../assets/models/ships/2_spaceship/fripeout_ship_2.gltf');
        spaceship = await this.loader.loadNode('Spaceship');
        this.scene.addNode(spaceship);
        this.spaceshipList.push(this.scene.nodes[5]);

        // Initial spaceship:
        this.currentSpaceshipIndex = 0;

        let tempMatrix = mat4.create();
        mat4.fromScaling(tempMatrix, [1/256,1/256,1/256]);
        mat4.mul(this.spaceshipList[1].matrix, tempMatrix, this.spaceshipList[1].matrix);
        mat4.mul(this.spaceshipList[2].matrix, tempMatrix, this.spaceshipList[2].matrix);


        if (!this.scene || !this.camera) {
            throw new Error('Scene or Camera not present in glTF');
        }

        if (!this.camera.camera) {
            throw new Error('Camera node does not contain a camera reference');
        }

        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler);

        this.renderer = new Renderer(this.gl);
        this.renderer.prepareScene(this.scene);
        this.resize();

        console.log(this.scene);

        let startupAudio = document.createElement("audio");
        startupAudio.src = "./../../assets/audio/Impact - Deep Down.mp3";
        startupAudio.play();
    }

    update() {
        // Noting at the moment
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if(this.currentSpaceship) {
            let spaceshipRotation = mat4.create();
            mat4.fromRotation(spaceshipRotation, dt * 0.25, [0,1,0]);
            mat4.mul(this.currentSpaceship.matrix, spaceshipRotation, this.currentSpaceship.matrix);
        }
    }

    render() {
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        if (this.camera) {
            this.camera.camera.aspect = aspectRatio;
            this.camera.camera.updateMatrix();
        }
    }

    enableCamera() {
        this.canvas.requestPointerLock();
    }

    pointerlockchangeHandler() {
        if (!this.camera) {
            return;
        }

        if (document.pointerLockElement === this.canvas) {
            this.currentSpaceship.enable();
        } else {
            this.currentSpaceship.disable();
        }
    }

    selectVehicle() {
        this.logo.translation = vec3.fromValues(100, 0, -12.5);
        let transl = mat4.create();
        mat4.fromTranslation(transl, this.logo.translation)
        mat4.mul(this.logo.matrix, transl, this.logo.matrix)
    }

    switchVehicle(change) {
        if(this.currentSpaceshipIndex + change < this.spaceshipList.length && this.currentSpaceshipIndex + change >= 0) {
            let tempMatrix = mat4.create();
            mat4.fromScaling(tempMatrix, [1/256,1/256,1/256]);
            mat4.mul(this.currentSpaceship.matrix, tempMatrix, this.currentSpaceship.matrix);

            this.currentSpaceshipIndex += change;
            this.currentSpaceship = this.spaceshipList[this.currentSpaceshipIndex];

            mat4.fromScaling(tempMatrix, [256,256,256]);
            mat4.mul(this.currentSpaceship.matrix, tempMatrix, this.currentSpaceship.matrix);
            mat4.fromRotation(this.currentSpaceship.matrix, 3, [0,1,0]);
        }
    }

}

var currentApp;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const mmapp = new MMApplication(canvas);

    currentApp = mmapp;
});

var vehicleSelection = false;

document.addEventListener('keydown', (e) => {
    console.log(e.key);
    if(e.key == "Enter") {
        if(vehicleSelection == true) {
            window.location.href = "./game.html" + '#' + currentApp.currentSpaceshipIndex;
        }
    }
    if(vehicleSelection) {
        if(e.key == "ArrowRight") {
            currentApp.switchVehicle(1);
        }
        else if(e.key == "ArrowLeft") {
            currentApp.switchVehicle(-1);
        }
    }
    if(!vehicleSelection) {
        currentApp.selectVehicle();
        vehicleSelection = true;

        document.getElementById('keypress').style.visibility = "hidden";
        document.getElementById('vehicleselect').style.visibility = "visible";
    }
});