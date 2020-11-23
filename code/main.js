import GLTFLoader from './imported_code/GLTFLoader.js';
import Renderer from './imported_code/Renderer.js';
import SpaceshipCamera from './src/SpaceshipCamera.js';
import Physics from './src/Physics.js';
import Light from './imported_code/Light.js'
import CollisionObject from './src/CollisionObject.js';
import Node from './imported_code/Node.js';
import CheckpointObject from "./src/CheckpointObject.js";

const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;
var maxspeed = 0;
let isPaused = false;
let lastLocation = [0,0];
let frame = 0;
let spaceshipSpeed = 0;
let currentTime = 0;

let checkpoints = [];
let checkpointsBool = [false,true];
let laps = [0,0,0]

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

        // Creation of walls:
        await this.loader.load('../assets/models/envivorment/walls/racetrack_walls.gltf');
        let walls= await this.loader.loadScene(this.loader.defaultScene);
        this.scene.addNode(walls.nodes[0]);

        // ------------------
        // BUILDING CREATION:
        // ------------------
        await this.loader.load('../assets/models/envivorment/buildings/skyscrapers/skyscraper1.gltf');
        let skyscraper1_1 = await this.loader.loadScene(this.loader.defaultScene);
        skyscraper1_1.nodes.translation = [-100,0,-50];
        mat4.fromTranslation(skyscraper1_1.nodes[0].matrix, skyscraper1_1.nodes.translation);
        this.scene.addNode(skyscraper1_1.nodes[0]);

        await this.loader.load('../assets/models/envivorment/buildings/skyscrapers/skyscraper1.gltf');
        let skyscraper1_2 = await this.loader.loadScene(this.loader.defaultScene);
        skyscraper1_2.nodes.translation = [300,0,500];
        mat4.fromTranslation(skyscraper1_2.nodes[0].matrix, skyscraper1_2.nodes.translation);
        this.scene.addNode(skyscraper1_2.nodes[0]);

        await this.loader.load('../assets/models/envivorment/buildings/skyscrapers/skyscraper2.gltf');
        let skyscraper2_1 = await this.loader.loadScene(this.loader.defaultScene);
        skyscraper2_1.nodes.translation = [20,-90,450];
        mat4.fromTranslation(skyscraper2_1.nodes[0].matrix, skyscraper2_1.nodes.translation);
        this.scene.addNode(skyscraper2_1.nodes[0]);

        await this.loader.load('../assets/models/envivorment/buildings/skyscrapers/skyscraper2.gltf');
        let skyscraper2_2 = await this.loader.loadScene(this.loader.defaultScene);
        skyscraper2_2.nodes.translation = [200,0,-15];
        mat4.fromTranslation(skyscraper2_2.nodes[0].matrix, skyscraper2_2.nodes.translation);
        this.scene.addNode(skyscraper2_2.nodes[0]);

        await this.loader.load('../assets/models/envivorment/buildings/skyscrapers/skyscraper3.gltf');
        let skyscraper3_1 = await this.loader.loadScene(this.loader.defaultScene);
        skyscraper3_1.nodes.translation = [800,0,-155];
        mat4.fromTranslation(skyscraper3_1.nodes[0].matrix, skyscraper3_1.nodes.translation);
        this.scene.addNode(skyscraper3_1.nodes[0]);

        await this.loader.load('../assets/models/envivorment/buildings/skyscrapers/skyscraper3.gltf');
        let skyscraper3_2 = await this.loader.loadScene(this.loader.defaultScene);
        skyscraper3_2.nodes.translation = [300,-150,-255];
        mat4.fromTranslation(skyscraper3_2.nodes[0].matrix, skyscraper3_2.nodes.translation);
        this.scene.addNode(skyscraper3_2.nodes[0]);



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

        this.currentSpaceship.spaceship = this.addCollisionCube(this.currentSpaceship.spaceship,20,10,20);
        /* console.log(this.currentSpaceship.spaceship); */

        let testCube = new Node();
        testCube.translation = [155.35,0,105.72];
        testCube = this.addCollisionCube(testCube,230.71,100,331.44);
        mat4.fromTranslation(testCube.matrix, testCube.translation);
        this.scene.addNode(testCube);

        let testCube2 = new Node();
        testCube2.translation = [386.19,0,-15.46];
        testCube2 = this.addCollisionCube(testCube2,256.97,100,80.08);
        mat4.fromTranslation(testCube2.matrix, testCube2.translation);
        this.scene.addNode(testCube2);

        let testcube3 = new Node();
        testcube3.translation = [550.00,0,305.00];
        testcube3 = this.addCollisionCube(testcube3,400.0,200,400.0);
        mat4.fromTranslation(testcube3.matrix, testcube3.translation);
        this.scene.addNode(testcube3);

        let testcube4 = new Node();
        testcube4.translation = [155.00,0,550.00];
        testcube4 = this.addCollisionCube(testcube4,400.0,200,400.0);
        mat4.fromTranslation(testcube4.matrix, testcube4.translation);
        this.scene.addNode(testcube4);

        let testcube5 = new Node();
        testcube5.translation = [-80.00,0,150.00];
        testcube5 = this.addCollisionCube(testcube5,80.0,200,1000.0);
        mat4.fromTranslation(testcube5.matrix, testcube5.translation);
        this.scene.addNode(testcube5);

        let testcube6 = new Node();
        testcube6.translation = [200,0,-180.00];
        testcube6 = this.addCollisionCube(testcube6,1000.0,200,80.0);
        mat4.fromTranslation(testcube6.matrix, testcube6.translation);
        this.scene.addNode(testcube6);

        let testcube7 = new Node();
        testcube7.translation = [635.00,0,20.00];
        testcube7 = this.addCollisionCube(testcube7,80.0,200,1000.0);
        mat4.fromTranslation(testcube7.matrix, testcube7.translation);
        this.scene.addNode(testcube7);

        let finish = new Node();
        finish.translation = [0.00,0,10.00];
        finish = this.addCheckpoint(finish,90.0,0,20.0);
        mat4.fromTranslation(finish.matrix, finish.translation);
        this.scene.addNode(finish);
        checkpoints.push(finish.children[0]);


        let midPoint = new Node();
        midPoint.translation = [363.0,0,(105.0+27.0)/2];
        midPoint = this.addCheckpoint(midPoint,20,0,80);
        mat4.fromTranslation(midPoint.matrix, midPoint.translation);
        this.scene.addNode(midPoint);
        checkpoints.push(midPoint.children[0]);

    }

    getSpeed(vector){
        let curSpeed = Math.sqrt(vector[0]* vector[0] + vector[1]* vector[1] + vector[2]* vector[2]);
        return curSpeed > 0.05 ? Math.round(curSpeed*100) : 0;
    }

    calculateSpeed(lastLocation, curLocation,dt){

        return Math.sqrt((lastLocation[0] - curLocation[0]) * (lastLocation[0] - curLocation[0])  + (lastLocation[1] - curLocation[1]) * (lastLocation[1] - curLocation[1])) / dt;
    }

    update() {
        if(isPaused){
            this.startTime = Date.now();
            return;
        }


        const t = this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;



        document.getElementById('time').innerText = "Current time: " + Math.floor(currentTime/60) + " min " + Math.floor(currentTime%60) + " sec.";
        if(this.loaded) {
            this.currentSpaceship.update(dt);

            if(this.currentSpaceship.started){
                currentTime += dt;
            }
            //console.log(this.currentSpaceship.spaceship.translation);
            let tmpLoc = [this.currentSpaceship.spaceship.translation[0],this.currentSpaceship.spaceship.translation[2]];

            if(frame % 6 == 0){
                spaceshipSpeed = Math.round( this.calculateSpeed(lastLocation,tmpLoc,dt ));
            }
            document.getElementById('speed').innerText = "Current speed: " + spaceshipSpeed + " u/s";
            lastLocation = tmpLoc;

            //Speed bar
            var bar = document.getElementById('myBar');
            /* var speed = this.getSpeed(this.currentSpaceship.velocity); */
            var speed = spaceshipSpeed;

            if (speed > maxspeed)
                maxspeed = speed;

            throttle.style.width = speed*(100/maxspeed) + "%";

        }

        if(this.lightMove) {
            this.updateLight();
        }

        if (this.physics && this.loaded) {
            let a = this.physics.update(this.currentSpaceship);
            if(a) {
                if (this.checkIfCheckpointsMatch(a, checkpoints[0]) && checkpointsBool[0]) {
                    checkpointsBool[0] = false;
                    checkpointsBool[1] = true;
                    console.log("checkpoint")
                    document.getElementById("Checkpoint").style.visibility = "visible";
                    document.getElementById("Checkpoint").innerText = "Krog koncan, čas: " + Math.round(currentTime * 100) / 100 + " sekund" ;

                    setTimeout(this.hide,3000);
                    this.addShowlaps(currentTime);
                    console.log(laps);
                    currentTime = 0;
                }
                if (this.checkIfCheckpointsMatch(a, checkpoints[1]) && checkpointsBool[1]) {
                    checkpointsBool[0] = true;
                    checkpointsBool[1] = false;
                    document.getElementById("Checkpoint").style.visibility = "visible";
                    document.getElementById("Checkpoint").innerText = "Checkpoint pred ciljem dosežen, " + Math.floor(currentTime* 100) / 100  + " sekund";
                    setTimeout(this.hide,1500);
                }
            }

        }

        /* if(this.loaded) {
            console.log(this.currentSpaceship.spaceship.translation);
        } */

        frame = (frame + 1) % 60;

        /* if (this.physics && this.loaded) {
            console.log(this.physics);
            console.log(this.physics.shipDamage);
            if(this.physics.shipDamage > 200) {
                isPaused = true;
                console.log("Your ship was destroyed");
            }
        } */
    }

    addShowlaps(ct) {
        laps.unshift(ct);
        document.getElementById("krog1").innerText = Math.floor(laps[0] * 100) / 100 + " sekund";
        document.getElementById("krog2").innerText = Math.floor(laps[1] * 100) / 100 + " sekund" ;
        document.getElementById("krog3").innerText = Math.floor(laps[2] * 100) / 100 + " sekund";
    }

    hide(){
        document.getElementById("Checkpoint").style.visibility = "hidden";
    }
    checkIfCheckpointsMatch(a,b){
        return (a.aabb.max[0] == b.aabb.max[0] &&
                a.aabb.min[0] == b.aabb.min[0]);
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
        let collisionCube = new CollisionObject(position, length, height, width);
        object.addChild(collisionCube);
        return object;
    }
    addCheckpoint(object, length, height, width, position=[0,0,0]) {
        // Lenght is x, width is z, height is y.
        let checkpointCube = new CheckpointObject(position, length, height, width);
        object.addChild(checkpointCube);
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
        case 'p':
        case 'Escape':
            //Function call /TODO

            Application.pause();
            document.getElementById('paused').style.visibility = isPaused ? "visible" : "hidden";
            break;
    } 
}; 

