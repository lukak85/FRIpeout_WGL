import Ammo from './../../lib/ammo.wasm.js';

export function fripeoutCollisionDetection(object1, object2) {
    // Physics configuration
    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
    // physicsWorld.setGravity( new Ammo.btVector3( 0, -9.82, 0 ) );

    var scene_size = 5000;
    var max_objects = 10; // Tweak this as needed

    bt_collision_configuration = new Ammo.btDefaultCollisionConfiguration();
    bt_dispatcher = new Ammo.btCollisionDispatcher(bt_collision_configuration);

    var wmin = new Ammo.btVector3(-scene_size, -scene_size, -scene_size);
    var wmax = new Ammo.btVector3(scene_size, scene_size, scene_size);

    // This is one type of broadphase, Ammo.js has others that might be faster
    bt_broadphase = new Ammo.bt32BitAxisSweep3(
            wmin, wmax, max_objects, 0, true /* disable raycast accelerator */);

    bt_collision_world = new Ammo.btCollisionWorld(bt_dispatcher, bt_broadphase, bt_collision_configuration);

    // Create two collision objects
    var sphere_A = new Ammo.btCollisionObject();
    var sphere_B = new Ammo.btCollisionObject();

    // Move each to a specific location
    sphere_A.getWorldTransform().setOrigin(new Ammo.btVector3(2, 1.5, 0));
    sphere_B.getWorldTransform().setOrigin(new Ammo.btVector3(2, 0, 0));

    // Create the sphere shape with a radius of 1
    var sphere_shape = new Ammo.btSphereShape(1);

    // Set the shape of each collision object
    sphere_A.setCollisionShape(sphere_shape);
    sphere_B.setCollisionShape(sphere_shape);

    // Add the collision objects to our collision world
    bt_collision_world.addCollisionObject(sphere_A);
    bt_collision_world.addCollisionObject(sphere_B);

    // Perform collision detection
    bt_collision_world.performDiscreteCollisionDetection();

    var numManifolds = bt_collision_world.getDispatcher().getNumManifolds();

    // For each contact manifold
    for(var i = 0; i < numManifolds; i++){
        var contactManifold = bt_collision_world.getDispatcher().getManifoldByIndexInternal(i);
        var obA = contactManifold.getBody0();
        var obB = contactManifold.getBody1();
        contactManifold.refreshContactPoints(obA.getWorldTransform(), obB.getWorldTransform());
        var numContacts = contactManifold.getNumContacts();

        // For each contact point in that manifold
        for(var j = 0; j < numContacts; j++){

            // Get the contact information
            var pt = contactManifold.getContactPoint(j);
            var ptA = pt.getPositionWorldOnA();
            var ptB = pt.getPositionWorldOnB();
            var ptdist = pt.getDistance();

            // Do whatever else you need with the information...
        }
    }
}

function tick() {
    requestAnimationFrame( tick );
    var dt = clock.getDelta();
    for (var i = 0; i < syncList.length; i++)
        syncList[i](dt);
    physicsWorld.stepSimulation( dt, 10 );
    controls.update( dt );
    renderer.render( scene, camera );
    time += dt;
    stats.update();
}