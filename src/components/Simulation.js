import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './styles.css';

const Simulation = () => {
  const simulationRef = useRef();
  const [wheatMarkers, setWheatMarkers] = useState([]);
  const [sprinklerMarkers, setSprinklerMarkers] = useState([]);
  const [showHighlights, setShowHighlights] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('wheat');
  const cameraRef = useRef();
  const gridHelperRef = useRef(); // Reference for the grid helper

  useEffect(() => {
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat = 'no-repeat';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Initial camera (top view)
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 0); // Top view
    camera.lookAt(0, 0, 0); // Looking down at the center
    cameraRef.current = camera; // Save camera reference for later updates

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',  // Try 'default' or 'low-power' if this doesn't work
      antialias: true,
    });
    renderer.setSize(800, 600);
    simulationRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.rotateSpeed = 0.5;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
    sunLight.position.set(10, 10, 5);
    scene.add(sunLight);

    // Load texture for the ground
    const textureLoader = new THREE.TextureLoader();
    const groundTexture = textureLoader.load(
      './assets/ground.jpg',
      () => console.log('Ground texture loaded successfully'),
      undefined,
      (error) => console.error('Error loading ground texture:', error)
    );

    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10); // Adjust repeat to cover the ground

    // Ground
    const size = 50;
    const groundGeometry = new THREE.PlaneGeometry(size, size);
    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Add border to the ground
    const borderGeometry = new THREE.EdgesGeometry(groundGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    scene.add(border);

    // Grid helper
    const gridSize = 50; // Same size as the ground
    const gridDivisions = 10; // Number of grid divisions
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xffff00, 0xffff00); // Yellow grid lines
    gridHelper.visible = false; // Initially hidden
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper; // Store the grid helper reference

    const loader = new GLTFLoader();
    const wheatCountX = 10;
    const wheatCountZ = 10;
    const gridCellSize = 5;
    const gridOffsetX = gridCellSize * wheatCountX / 2;
    const gridOffsetZ = gridCellSize * wheatCountZ / 2;
    const wheatHighlightMarkers = [];
    const sprinklerHighlightMarkers = [];
    const sprinklerPositions = [3, 7, 15];

    // Function to load plant model
    const loadPlantModel = (plantType) => {
      loader.load(`./models/${plantType}.glb`, (gltf) => {
        const plantGeometry = gltf.scene.children[0].geometry;
        const plantMaterial = gltf.scene.children[0].material;
        const plantMesh = new THREE.InstancedMesh(plantGeometry, plantMaterial, wheatCountX * wheatCountZ);
        plantMesh.scale.set(1, 1, 1);

        let instanceId = 0;
        for (let i = 0; i < wheatCountX; i++) {
          for (let j = 0; j < wheatCountZ; j++) {
            const posX = i * gridCellSize - gridOffsetX + gridCellSize / 2;
            const posZ = j * gridCellSize - gridOffsetZ + gridCellSize / 2;

            const matrix = new THREE.Matrix4();
            matrix.setPosition(posX, 1, posZ);

            if (sprinklerPositions.includes(instanceId)) {
              loader.load('./models/sprinkler.glb', (sprinklerGltf) => {
                const sprinkler = sprinklerGltf.scene;
                sprinkler.position.set(posX, 1, posZ);
                sprinkler.scale.set(1, 1, 1);
                scene.add(sprinkler);

                const sprinklerMarkerGeometry = new THREE.CircleGeometry(1, 32);
                const sprinklerMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 }); // Blue marker for sprinklers
                const sprinklerMarker = new THREE.Mesh(sprinklerMarkerGeometry, sprinklerMarkerMaterial);
                sprinklerMarker.rotation.x = -Math.PI / 2;
                sprinklerMarker.position.set(posX, 0.01, posZ);
                sprinklerMarker.visible = false;
                scene.add(sprinklerMarker);
                sprinklerHighlightMarkers.push(sprinklerMarker);
              });
            } else {
              plantMesh.setMatrixAt(instanceId, matrix);

              const wheatMarkerGeometry = new THREE.CircleGeometry(1, 32);
              const wheatMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }); // Red marker for wheat
              const wheatMarker = new THREE.Mesh(wheatMarkerGeometry, wheatMarkerMaterial);
              wheatMarker.rotation.x = -Math.PI / 2;
              wheatMarker.position.set(posX, 0.01, posZ);
              wheatMarker.visible = false;
              scene.add(wheatMarker);
              wheatHighlightMarkers.push(wheatMarker);
            }

            instanceId++;
          }
        }

        plantMesh.instanceMatrix.needsUpdate = true;
        scene.add(plantMesh);

        setWheatMarkers(wheatHighlightMarkers);
        setSprinklerMarkers(sprinklerHighlightMarkers);
      }, undefined, (error) => {
        console.error('Error loading model:', error);
      });
    };

    loadPlantModel(selectedPlant);

    // Animate function
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (simulationRef.current) {
        renderer.dispose();  // Dispose of renderer to free up resources
        simulationRef.current.removeChild(renderer.domElement);
      }
    };
    
  }, [selectedPlant]);

  // Toggle highlighting function
  const toggleHighlight = () => {
    setShowHighlights(!showHighlights);

    // Toggle wheat markers
    wheatMarkers.forEach(marker => {
      marker.visible = !marker.visible;
    });

    // Toggle sprinkler markers
    sprinklerMarkers.forEach(marker => {
      marker.visible = !marker.visible;
    });

    // Toggle grid visibility
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = !gridHelperRef.current.visible;
    }
  };

  const setTopView = () => {
    const camera = cameraRef.current;
    camera.position.set(0, 20, 0);
    camera.lookAt(0, 0, 0);
  };

  const setSideView = () => {
    const camera = cameraRef.current;
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);
  };

  const setIsometricView = () => {
    const camera = cameraRef.current;
    camera.position.set(20, 10, 20);
    camera.lookAt(0, 0, 0);
  };

  const plantOptions = ['wheat', 'corn', 'soyabean', 'peas', 'tomato'];

  const handlePlantChange = (event) => {
    setSelectedPlant(event.target.value);
  };

  return (
    <div className="simulation-wrapper">
      <div className="simulation-container-wrapper">
        <div ref={simulationRef} className="simulation-container"></div>
      </div>
      <div className="buttons-container">
        <button className="button-gradient highlight-button" onClick={toggleHighlight}>
          {showHighlights ? 'Hide Highlights' : 'Show Highlights'}
        </button>
        <select className="plant-select" value={selectedPlant} onChange={handlePlantChange}>
          {plantOptions.map((plant) => (
            <option key={plant} value={plant}>
              {plant.charAt(0).toUpperCase() + plant.slice(1)}
            </option>
          ))}
        </select>
        <button className="button-gradient" onClick={setTopView}>Top View</button>
        <button className="button-gradient" onClick={setSideView}>Side View</button>
        <button className="button-gradient" onClick={setIsometricView}>Isometric View</button>
      </div>
    </div>
  );
}  

export default Simulation;
