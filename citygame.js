import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const objects = []; //list-array
let raycaster; //raygun

let loader = new GLTFLoader()
let moveForward = false;
let moveBackwards = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isSprinting = false;
let isCrouching = false;

let prevTime = performance.now(); //curent time
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();


let camera, scene, controls, renderer;

init();
animate();
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth /window.innerHeight, 0.1, 1000);
  camera.position.y = 1;

  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", function () {
    controls.lock();
  });
  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });
  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case 'KeyW':
        moveForward = true;
        break;
      case "KeyA":
        moveLeft = true;
        break;
      case "KeyS":
        moveBackwards = true;
        break;
      case "KeyD":
        moveRight = true;
        break;
      case "Space":
        if (canJump === true) velocity.y += 30; //jump force
        canJump = false;
        break;
      case 'ShiftLeft':
        isSprinting = true;
        break;
      case 'KeyC':
        camera.position.y += 0.4;
        isCrouching = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "KeyW":
        moveForward = false;
        break;
      case "KeyA":
        moveLeft = false;
        break;
      case "KeyS":
        moveBackwards = false;
        break;
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    1
  );

  const light = new THREE.AmbientLight(0xffffff);
  scene.add(light);

  loader.load("./IsabellaCity1.glb", function(gltf){
    let city = gltf.scene; // THREE Group
    scene.add(city); // adds scene to city
    city.traverse(function(obj){
        objects.push(obj); //adds each object to collision list
    });
  });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();
  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 1;

    const intersections = raycaster.intersectObjects(objects, false);
    const onObject = intersections.length > 0;
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x *10.0* delta
    velocity.z -= velocity.z *10.0* delta
    velocity.y -= 9.8 *10.0* delta

    direction.z = Number(moveForward) - Number(moveBackwards)
    direction.x = Number(moveRight) - Number(moveLeft)
    direction.normalize()

    if(isSprinting){
        camera.fov = 80;
        camera.updateProjectionMatrix();
        if(moveForward||moveBackwards) velocity.z -= direction.z * 200.0 * delta;
        if(moveLeft||moveRight) velocity.x -= direction.x * 200.0 * delta;
    }else if(isCrouching){
        camera.fov = 70;
        camera.updateProjectionMatrix();
        if(moveForward||moveBackwards) velocity.z -= direction.z * 20.0 * delta;
        if(moveLeft||moveRight) velocity.x -= direction.x * 20.0 * delta;
    }else{
        camera.fov = 75;
        camera.updateProjectionMatrix();
        if(moveForward||moveBackwards) velocity.z -= direction.z * 100.0 * delta;
        if(moveLeft||moveRight) velocity.x -= direction.x * 100.0 * delta;
    }
    //Negetive Vertical Collisions
    if(onObject === true){
      velocity.y = Math.max(0,velocity.y)
      canJump = true
    }
  controls.moveRight(-velocity.x*delta)
  controls.moveForward(-velocity.z*delta)
  
  controls.getObject().position.y += (velocity.y*delta)
  
  if(controls.getObject().position.y < -100){
    velocity.y = 0
    controls.getObject().position.y = 0

        canJump = true
    }
  }
  prevTime = time;
  renderer.render(scene, camera);
}

