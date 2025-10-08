import * as THREE from 'three';
import LocomotiveScroll from 'locomotive-scroll';
import vertexShader from './shaders/vertexShader.glsl';
import fragmentShader from './shaders/fragmentShader.glsl';
const locomotiveScroll = new LocomotiveScroll();
import gsap from 'gsap'
const scene = new THREE.Scene();
const distance = 5;
const fov = 2 * Math.atan((window.innerHeight / 2) / distance) * (180 / Math.PI);
const camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = distance;

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const images = document.querySelectorAll('img');
const planes = [];
const textures = [];

images.forEach(image => {
    const imgbounds = image.getBoundingClientRect();
    const texture = new THREE.TextureLoader().load(image.src);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: {
                value: texture
            },
            uMouse: {
                value: new THREE.Vector2(0.5, 0.5)
            },
            uHover: {
                value: new THREE.Vector2(0, 0)
            }
        },
        vertexShader,
        fragmentShader,
    });
    const geometry = new THREE.PlaneGeometry(imgbounds.width, imgbounds.height);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(
        imgbounds.left - window.innerWidth / 2 + imgbounds.width / 2,
        -imgbounds.top - window.innerHeight / 2 + imgbounds.height / 2,
        0
    );
    planes.push(plane);
    scene.add(plane);
});

function updatePlanesPosition() {
    planes.forEach((plane, idx) => {
        const image = images[idx];
        const imgbounds = image.getBoundingClientRect();
        plane.position.set(
            imgbounds.left - window.innerWidth / 2 + imgbounds.width / 2,
            -imgbounds.top + window.innerHeight / 2 - imgbounds.height / 2,
            0
        );
    });
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let lastHoveredPlane = null;

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(planes);

    // Reset all planes' uMouse and uHover
    planes.forEach(plane => {
        plane.material.uniforms.uMouse.value.set(0.5, 0.5);
        gsap.to(plane.material.uniforms.uHover.value, {
            x: 0,
            y: 0,
            duration: 0.4,
            overwrite: true
        });
    });

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const plane = intersect.object;
        if (intersect.uv) {
            plane.material.uniforms.uMouse.value.copy(intersect.uv);
        }
        gsap.to(plane.material.uniforms.uHover.value, {
            x: 1,
            y: 1,
            duration: 0.4,
            overwrite: true
        });
        lastHoveredPlane = plane;
    } else {
        if (lastHoveredPlane) {
            gsap.to(lastHoveredPlane.material.uniforms.uHover.value, {
                x: 0,
                y: 0,
                duration: 0.4,
                overwrite: true
            });
            lastHoveredPlane = null;
        }
    }
});

function animate() {
    requestAnimationFrame(animate);
    updatePlanesPosition();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    planes.forEach((plane, idx) => {
        const image = images[idx];
        const imgbounds = image.getBoundingClientRect();

        // Dispose old geometry
        plane.geometry.dispose();
        // Create new geometry with new size
        plane.geometry = new THREE.PlaneGeometry(imgbounds.width, imgbounds.height);

        // Re-set the texture in case the image src or size changed
        if (textures[idx]) {
            plane.material.uniforms.uTexture.value = textures[idx];
            textures[idx].needsUpdate = true;
        }

        // Update position
        plane.position.set(
            imgbounds.left - window.innerWidth / 2 + imgbounds.width / 2,
            -imgbounds.top + window.innerHeight / 2 - imgbounds.height / 2,
            0
        );
    });
    updatePlanesPosition();
});
// Re-set the texture in case the image src or size changed
// (not strictly necessary if src doesn't change, but ensures correct mapping)
if (textures[idx]) {
    plane.material.uniforms.uTexture.value = textures[idx];
    textures[idx].needsUpdate = true;
}

// Update position
plane.position.set(
    imgbounds.left - window.innerWidth / 2 + imgbounds.width / 2,
    -imgbounds.top + window.innerHeight / 2 - imgbounds.height / 2,
    0
);