import GLTFLoader from './imported_code/GLTFLoader.js';
import Renderer from './imported_code/Renderer.js';
import SpaceshipCamera from './src/SpaceshipCamera.js';
import Light from './imported_code/Light.js'
const mat4 = glMatrix.mat4;

class Application {

    constructor(canvas) {
        this._update = this._update.bind(this);

        this.canvas = canvas;
        this._initGL();
        this.start();

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

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            this.resize();
        }
    }

    async start() {
        this.loader = new GLTFLoader();
        this.loaded = false;

        // Creation of the spaceship and the camera behind it:
        await this.loader.load('../assets/models/ships/3_spaceship/fripeout_ship_3.gltf');

        this.scene = await this.loader.loadScene(this.loader.defaultScene);

        // Object created so that the rotation of both the spaceship and camera
        // is easier and synchronus:
        this.currentSpaceship = new SpaceshipCamera();
        this.currentSpaceship.spaceship = await this.loader.loadNode('Spaceship');
        var camera = await this.loader.loadNode('Camera');

        this.currentSpaceship.spaceship.addChild(camera);

        this.loaded = true;

        // Camera is a part of spaceship-camera object, but can be reffered to 
        // in either way from now on:
        this.camera = this.currentSpaceship.spaceship.children[0];

        // Create another spaceship:
        await this.loader.load('../assets/models/ships/2_spaceship/fripeout_ship_2.gltf');
        let spaceship = await this.loader.loadScene(this.loader.defaultScene);
        this.scene.addNode(spaceship.nodes[1]);

        /* console.log(this.scene.nodes[2]);
        this.scene.nodes[2].translation[1] = 10;
        console.log(this.scene.nodes[2]); */

        // Creation of floors:
        await this.loader.load('../assets/models/envivorment/floor/floor.gltf');
        let floor = await this.loader.loadScene(this.loader.defaultScene);
        this.scene.addNode(floor.nodes[1]);

        // Creation of skybox:
        /* await this.loader.load('../assets/models/envivorment/cubemap/skybox.gltf');
        let cubemap = await this.loader.loadScene(this.loader.defaultScene);
        this.scene.addNode(cubemap.nodes[1]); */

        // Just a simple light so we can see the scene:
        let light = new Light();
        light.translation[0] = 0;
        light.translation[1] = 15;
        light.translation[2] = 0;
        this.scene.addNode(light);

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
    }

    update() {
        // Noting at the moment
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if(this.loaded) {
            this.currentSpaceship.update(dt);
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

}


document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new Application(canvas);
    const gui = new dat.GUI();

    gui.add(app, 'enableCamera');
});
