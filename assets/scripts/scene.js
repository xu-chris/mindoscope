var width  = window.innerWidth,
height = window.innerHeight;
var container = document.querySelector('#container');
var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
container.appendChild(renderer.domElement);
var VIEW_ANGLE = 45,
    NEAR = 0.1,
    FAR = 10000;
var camera =  new THREE.PerspectiveCamera(45, width / height, 1, 1000);
camera.position.z = 300;
var scene = new THREE.Scene();
scene.add(camera);
var directionalLight = new THREE.DirectionalLight();
directionalLight.position.z = 10;
scene.add(directionalLight);
var radius = 100,
    segments = 50,
rings = 50;
var material = new THREE.MeshLambertMaterial(
{
  color: 0xFF0000
});
var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
        radius,
        segments,
        rings),
    material);
//scene.add(sphere);

var path = [];
path.push( new THREE.Vector2 (   0,  50 ) );
path.push( new THREE.Vector2 (  50,  50 ) );
path.push( new THREE.Vector2 (  50,  0 ) );
var shape = new THREE.Shape( path );

var extrusionSettings = {
  size: 30, height: 4, curveSegments: 3,
  bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
  material: 0, extrudeMaterial: 1
};
var extrude = new THREE.ExtrudeGeometry( shape, extrusionSettings );
var extrudedShape = new THREE.Mesh( extrude, material );
scene.add(extrudedShape);

function logic()  {
    extrudedShape.rotation.y += 0.05;
    extrudedShape.rotation.x += 0.05;
    requestAnimationFrame(render);
}

function render() {
  renderer.render(scene, camera);
}
setInterval(logic, 1000/60);