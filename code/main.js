import GLTFLoader from './imported_code/GLTFLoader.js';
import Renderer from './imported_code/Renderer.js';
import SpaceshipCamera from './src/SpaceshipCamera.js';
import Physics from './src/Physics.js';
import Light from './imported_code/Light.js'
import CollisionObject from './src/CollisionObject.js';
import Node from './imported_code/Node.js';

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
let isPaused = false;
class Application {

    constructor(canvas) {
        this._update = this._update.bind(this);

        this.canvas = canvas;
        this._initGL();
        this.start();

        this.LightX = 500;
        this.LightY = 1800;
        this.LightZ = 500;

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

        let spaceshipNumber = window.location.hash.substring(1);

        // Just a little fix because the numbering of the files and the main menu numbering is different.
        if(spaceshipNumber == 0) {
            spaceshipNumber = 3;
        }

        // Creation of the spaceship and the camera behind it:
        await this.loader.load('../assets/models/ships/' + spaceshipNumber + '_spaceship/fripeout_ship_' + spaceshipNumber + '.gltf');
        this.scene = await this.loader.loadScene(this.loader.defaultScene);

        // Object created so that the rotation of both the spaceship and camera
        // is easier and synchronous:
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
        let spaceshipMove = spaceship.nodes[1].translation;
        spaceshipMove[0] = -15;
        mat4.fromTranslation(spaceship.nodes[1].matrix, spaceshipMove);
        this.scene.addNode(spaceship.nodes[1]);

        this.scene.nodes[2].translation[2] = 10;

        // Creation of racetrack:
        await this.loader.load('../assets/models/envivorment/racetrack/2/race_track_2.gltf');
        let racetrack = await this.loader.loadScene(this.loader.defaultScene);
        this.scene.addNode(racetrack.nodes[0]);

        // Just a simple light so we can see the scene:
        let light = new Light();
        light.translation[0] = this.LightX;
        light.translation[1] = this.LightY;
        light.translation[2] = this.LightZ;
        this.scene.addNode(light);
        this.lightMove = light;

        mat4.fromTranslation(this.lightMove.matrix, this.lightMove.translation);

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

        //---------------------------
        // Collision detection setup:
        //---------------------------

        this.physics = new Physics(this.scene);

        this.currentSpaceship.spaceship = this.addCollisionCube(this.currentSpaceship.spaceship,10,10,10);
        /* console.log(this.currentSpaceship.spaceship); */

        let testCube = new Node();
        testCube.translation = vec3.create([0,0,100]);
        testCube.matrix = mat4.fromTranslation(testCube.matrix, testCube.translation);

        testCube = this.addCollisionCube(testCube,230.71,100,331.44,[155.35,0,105.72]);

        this.scene.addNode(testCube);
    }

    getSpeed(vector){
        let curSpeed = Math.sqrt(vector[0]* vector[0] + vector[1]* vector[1] + vector[2]* vector[2]);
        return curSpeed > 0.05 ? Math.round(curSpeed*100) : 0;
    }

    update() {
        // Noting at the moment
        if(isPaused){
            this.startTime = Date.now();;
            return;
        }
        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        if(this.loaded) {
            this.currentSpaceship.update(dt);
            document.getElementById('speed').innerText = "Current speed: " +  this.getSpeed(this.currentSpaceship.velocity) + " u/s";
        }

        if(this.lightMove) {
            this.updateLight();
        }

        if (this.physics && this.loaded) {
            this.physics.update(this.currentSpaceship);
        }

        if(this.loaded) {
            console.log(this.currentSpaceship.spaceship.translation);
        }
    }

    updateLight() {
        this.lightMove.translation[0] = this.LightX;
        this.lightMove.translation[1] = this.LightY;
        this.lightMove.translation[2] = this.LightZ;

        mat4.fromTranslation(this.lightMove.matrix, this.lightMove.translation);
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
    static pause(){
        isPaused = !isPaused;
        this.startTime = this.time = Date.now();
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

    addCollisionCube(object, length, height, width, position=[0,0,0]) {
        // Lenght is x, width is z, height is y.
        console.log(position);
        let collisionCube = new CollisionObject(position, length, height, width);
        object.addChild(collisionCube);
        return object;
    }

}



document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new Application(canvas);
    const gui = new dat.GUI();

    gui.add(app, 'LightX', -500, 500);
    gui.add(app, 'LightY', 1500, 3000);
    gui.add(app, 'LightZ', -500, 500);
    gui.add(app, 'enableCamera');
});


//Keys detect
document.onkeydown = function(e) { 
    switch (e.key) { 
        //Right shift key -special ability (optional)
        case 16:
            //Function call /TODO
            break;

        //Space key -handbrake (optional)
        case 32:
            //Function call /TODO
            break;

        //Left arrow key -steerleft
        case 37: 
            //Function call /TODO
            break; 

        //Up arrow key -gas
        case 38: 
            //Function call /TODO 
            break; 

        //Right arrow key -steer right
        case 39: 
            //Function call /TODO
            break; 

        //Down arrow key -break
        case 40: 
            //Function call /TODO
            break; 

        //N key -nitrous 
        case 78:
            //Function call /TODO
            break;
        case 'e':
            //Function call /TODO

            Application.pause();
            document.getElementById('paused').style.visibility = isPaused ? "visible" : "hidden";
            break;
    } 
}; 

