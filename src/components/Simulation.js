import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './styles.css';


// Constants
const VIEW_SIZE = 880.89;

// Standard planting areas (square meters)
const STANDARD_AREAS = {
  wheat: 4,  // 2m x 2m
  corn: 9,   // 3m x 3m
  soyabean: 2.25, // 1.5m x 1.5m
  peas: 1,   // 1m x 1m
  tomato: 4  // 2m x 2m
};

const FARM_SECTORS = {
  sector1: { name: 'North Field', size: 40, soil: { clay: 30, silt: 35, sand: 35 } },
  sector2: { name: 'South Field', size: 40, soil: { clay: 40, silt: 40, sand: 20 } },
  sector3: { name: 'East Field', size: 30, soil: { clay: 20, silt: 40, sand: 40 } },
  sector4: { name: 'West Field', size: 45, soil: { clay: 35, silt: 35, sand: 30 } }
};

const PLANT_LAYOUTS = {
  wheat: { spacing: 1, height: 1, scale: 0.8, color: 0xFFD700 },
  corn: { spacing: 1.5, height: 2, scale: 1, color: 0x90EE90 },
  soyabean: { spacing: 0.8, height: 0.7, scale: 0.7, color: 0x228B22 },
  peas: { spacing: 0.6, height: 0.8, scale: 0.6, color: 0x32CD32 },
  tomato: { spacing: 1.2, height: 1.2, scale: 0.9, color: 0x8B0000 }
};

// System requirements for high quality
const SYSTEM_REQUIREMENTS = {
  minMemory: 4, // GB
  minCores: 4,
  minGPUMemory: 2 // GB
};

// Check system compatibility
const checkSystemCompatibility = () => {
  try {
    const nav = window.navigator;
    const gl = document.createElement('canvas').getContext('webgl2');
    
    if (!gl) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    // Estimate system capabilities
    const hasGoodGPU = !(renderer.includes('Intel') && !renderer.includes('Iris'));
    const memory = nav.deviceMemory || 4; // Default to 4GB if not available
    const cores = nav.hardwareConcurrency || 2;
    
    return (
      memory >= SYSTEM_REQUIREMENTS.minMemory &&
      cores >= SYSTEM_REQUIREMENTS.minCores &&
      hasGoodGPU
    );
  } catch (error) {
    console.warn('Error checking system compatibility:', error);
    return false;
  }
};

const FarmSimulation = () => {
  const simulationRef = useRef();
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const plantsRef = useRef([]);
  const sprinklersRef = useRef([]);
  const frameIdRef = useRef();
  const measurementsRef = useRef([]);

  
  const [selectedSector, setSelectedSector] = useState('sector1');
  const [selectedPlant, setSelectedPlant] = useState('wheat');
  const [showHighlights, setShowHighlights] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [soilComposition, setSoilComposition] = useState({
    sand: 33,
    silt: 33,
    clay: 34
  });
  

  // Calculate number of plants and sprinklers based on soil composition and sector size
  const layoutConfig = useMemo(() => {
    const sector = FARM_SECTORS[selectedSector];
    const plantArea = STANDARD_AREAS[selectedPlant];
    const totalArea = sector.size * sector.size;
    
    // Adjust plant density based on soil composition
    const soilQualityFactor = (
      (sector.soil.clay * 0.3) +
      (sector.soil.silt * 0.4) +
      (sector.soil.sand * 0.3)
    ) / 100;
    
    const maxPlants = Math.floor(totalArea / plantArea);
    const actualPlants = Math.floor(maxPlants * soilQualityFactor);
    
    // Calculate sprinkler coverage
    const sprinklerCoverage = 25; // square meters per sprinkler
    const numSprinklers = Math.ceil(totalArea / sprinklerCoverage);
    
    return {
      numPlants: actualPlants,
      numSprinklers,
      plantSpacing: Math.sqrt(plantArea),
      gridSize: Math.floor(Math.sqrt(actualPlants))
    };
  }, [selectedSector, selectedPlant]);

  
  // Add loading manager to track asset loading
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingManagerRef = useRef(new THREE.LoadingManager(
    // onLoad
    () => setIsLoading(false),
    // onProgress
    (url, itemsLoaded, itemsTotal) => {
      setLoadingProgress((itemsLoaded / itemsTotal) * 100);
    },
    // onError
    (url) => {
      console.error('Error loading asset:', url);
      // Fallback to low quality if asset loading fails
      setIsHighQuality(false);
    }
  ));

  // Modified createGeometricPlant with proper async loading
  const createGeometricPlant = async (type) => {
  if (isHighQuality) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader(loadingManagerRef.current);
      loader.load(
        `/models/${type}.glb`,
        (gltf) => {
          const plant = gltf.scene;
          
          // Ensure materials are properly loaded
          plant.traverse((child) => {
            if (child.isMesh) {
              // Keep the original materials from the GLB
              child.material.needsUpdate = true;
              // Enable shadows
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          plant.scale.set(
            PLANT_LAYOUTS[type].scale,
            PLANT_LAYOUTS[type].scale,
            PLANT_LAYOUTS[type].scale
          );

          resolve(plant);
        },
        undefined,
        reject
      );
    });
  } else {
    const layout = PLANT_LAYOUTS[type];
    const geometry = new THREE.CylinderGeometry(
      layout.scale * 0.3,
      layout.scale * 0.1,
      layout.height,
      6
    );
    const material = new THREE.MeshBasicMaterial({ color: layout.color });
    return new THREE.Mesh(geometry, material);
  }
};

  // Modified createSprinkler with proper async loading
  const createSprinkler = async () => {
    if (isHighQuality) {
      return new Promise((resolve, reject) => {
        const loader = new GLTFLoader(loadingManagerRef.current);
        loader.load(
          '/models/sprinkler.glb',
          (gltf) => {
            const sprinkler = gltf.scene;
            
            // Ensure materials are properly loaded
            sprinkler.traverse((child) => {
              if (child.isMesh) {
                // Keep the original materials from the GLB
                child.material.needsUpdate = true;
                // Enable shadows
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
  
            sprinkler.scale.set(1, 1, 1);
            resolve(sprinkler);
          },
          undefined,
          reject
        );
      });
    } else {
      const sprinklerGroup = new THREE.Group();
      const base = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 8);
      const baseMesh = new THREE.Mesh(
        base,
        new THREE.MeshBasicMaterial({ color: 0x696969 })
      );
      const head = new THREE.SphereGeometry(0.15, 8, 8);
      const headMesh = new THREE.Mesh(
        head,
        new THREE.MeshBasicMaterial({ color: 0x808080 })
      );
      headMesh.position.y = 0.3;
      sprinklerGroup.add(baseMesh);
      sprinklerGroup.add(headMesh);
      return sprinklerGroup;
    }
  };

  const setupScene = () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
  
    const camera = new THREE.PerspectiveCamera(
      75,
      1,
      0.1,
      layoutConfig.gridSize * 10
    );
    camera.position.set(0, layoutConfig.gridSize*3, 0);
    
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'default',
      antialias: isHighQuality,
      precision: isHighQuality ? 'highp' : 'lowp',
      stencil: false,
      alpha: false
    });
    
    if (isHighQuality) {
      // Enable shadow mapping
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Add primary directional light (sun)
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(5, 10, 5);
      dirLight.castShadow = true;
      // Configure shadow properties
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.1;
      dirLight.shadow.camera.far = 500;
      dirLight.shadow.camera.left = -50;
      dirLight.shadow.camera.right = 50;
      dirLight.shadow.camera.top = 50;
      dirLight.shadow.camera.bottom = -50;
      scene.add(dirLight);
      
      // Add ambient light for overall illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Add hemisphere light for better environmental lighting
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
      scene.add(hemiLight);
    }
    
    renderer.setSize(VIEW_SIZE, VIEW_SIZE);
    renderer.setPixelRatio(isHighQuality ? Math.min(window.devicePixelRatio, 2) : 1); 
    
    return { scene, camera, renderer };
  };


  // Modified ground creation with proper texture loading
  const createGround = (scene, size) => {
    const geometry = new THREE.PlaneGeometry(size, size);
    let material;

    if (isHighQuality) {
      const textureLoader = new TextureLoader(loadingManagerRef.current);
      const texture = textureLoader.load('/assets/ground.jpg',
        // onLoad callback
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(4, 4); // Adjust based on your needs
          material.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.error('Error loading ground texture:', error);
          // Fallback to low quality
          material.color.set(0xB8860B);
        }
      );
      material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.DoubleSide 
      });
    } else {
      material = new THREE.MeshBasicMaterial({ 
        color: 0xB8860B, 
        side: THREE.DoubleSide 
      });
    }

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    return ground;
  };

  // Modified createFarmElements to handle async creation
  const createFarmElements = async (scene, config) => {
    const plantInstances = [];
    const sprinklerInstances = [];
  
    try {
      // Create templates
      const plantTemplate = await createGeometricPlant(selectedPlant);
      const sprinklerTemplate = await createSprinkler();
      
      const sectorSize = FARM_SECTORS[selectedSector].size;
      const offset = sectorSize / 2;
      
      // Calculate soil quality factor considering all components
      const soilQualityFactor = (
        (soilComposition.clay * 0.35) + // Clay helps with water retention
        (soilComposition.silt * 0.4) +  // Silt provides good drainage and nutrients
        (soilComposition.sand * 0.25)   // Sand helps with aeration but less with nutrients
      ) / 100;
  
      // Calculate actual plant spacing based on crop type
      const baseSpacing = PLANT_LAYOUTS[selectedPlant].spacing;
      // Adjust spacing based on soil quality (poorer soil = more spacing needed)
      const adjustedSpacing = baseSpacing * (1 + (1 - soilQualityFactor) * 0.5);
      
      // Calculate grid dimensions
      const plantsPerRow = Math.floor(sectorSize / adjustedSpacing);
      const totalPlants = plantsPerRow * plantsPerRow;
      
      // Place plants in a dense grid pattern
      for (let row = 0; row < plantsPerRow; row++) {
        for (let col = 0; col < plantsPerRow; col++) {
          const plant = isHighQuality ? plantTemplate.clone() : plantTemplate.clone();
          
          // Add slight randomization based on soil composition
          const randomFactor = (
            (soilComposition.sand * 0.5) +  // Sandy soil allows more movement
            (soilComposition.clay * 0.2) +  // Clay soil keeps things more fixed
            (soilComposition.silt * 0.3)    // Silt provides medium stability
          ) / 100;
          
          // Calculate position with natural variation
          const xPos = (row * adjustedSpacing) - offset + (Math.random() * randomFactor - randomFactor/2);
          const zPos = (col * adjustedSpacing) - offset + (Math.random() * randomFactor - randomFactor/2);
          
          plant.position.set(
            xPos,
            PLANT_LAYOUTS[selectedPlant].height / 2,
            zPos
          );
  
          scene.add(plant);
          plantInstances.push(plant);
        }
      }
  
      // Calculate sprinkler placement (more realistic coverage)
      // Standard sprinkler coverage radius (in meters)
      const sprinklerRadius = 8;
      // Adjust coverage based on soil composition
      const coverageMultiplier = (
        (soilComposition.silt * 1) +   // Silt has average water retention
        (soilComposition.sand * 0.33) +   // Sandy soil needs more coverage
        (soilComposition.clay * 0.56)    // Clay soil retains water better
      ) / 100;
      
      const adjustedCoverage = sprinklerRadius * coverageMultiplier;
      // Calculate number of sprinklers needed for adequate coverage
      const sprinklersPerSide = Math.ceil(sectorSize / (adjustedCoverage * 2));
      const sprinklerSpacing = sectorSize / sprinklersPerSide;
  
      // Place sprinklers in an offset grid for better coverage
      for (let row = 0; row < sprinklersPerSide; row++) {
        for (let col = 0; col < sprinklersPerSide; col++) {
          const sprinkler = isHighQuality ? sprinklerTemplate.clone() : sprinklerTemplate.clone();
          
          // Offset every other row for better coverage
          const rowOffset = col % 2 === 0 ? sprinklerSpacing / 2 : 0;
          
          sprinkler.position.set(
            (row * sprinklerSpacing) - offset + rowOffset,
            0.15,
            (col * sprinklerSpacing) - offset
          );
  
          scene.add(sprinkler);
          sprinklerInstances.push(sprinkler);
        }
      }
  
      return { plantInstances, sprinklerInstances };
    } catch (error) {
      console.error('Error creating farm elements:', error);
      setIsHighQuality(false);
      return createFarmElements(scene, config);
    }
  };

  const createMeasurements = (scene, sectorSize, plantSpacing, sprinklerRadius) => {
    const measurements = [];
    
    // Helper function to create text sprite
    const createTextSprite = (message) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      context.font = '24px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(message, 128, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      return new THREE.Sprite(spriteMaterial);
    };

    // Helper function to create measurement line
    const createMeasurementLine = (start, end, label) => {
      const points = [start, end];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
      const line = new THREE.Line(geometry, material);
      
      const sprite = createTextSprite(label);
      sprite.position.set(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 + 0.5,
        (start.z + end.z) / 2
      );
      sprite.scale.set(2, 0.5, 1);
      
      scene.add(line);
      scene.add(sprite);
      measurements.push(line, sprite);
    };

    // Ground size measurement
    createMeasurementLine(
      new THREE.Vector3(-sectorSize/2, 0.1, -sectorSize/2),
      new THREE.Vector3(sectorSize/2, 0.1, -sectorSize/2),
      `Ground: ${sectorSize}m`
    );

    // Plant spacing measurement
    createMeasurementLine(
      new THREE.Vector3(-plantSpacing/2, 0.5, 0),
      new THREE.Vector3(plantSpacing/2, 0.5, 0),
      `Plant Spacing: ${plantSpacing.toFixed(1)}m`
    );

    // Create sprinkler coverage visualization for each sprinkler
    sprinklersRef.current.forEach(sprinkler => {
      const points = [];
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          sprinkler.position.x + Math.cos(theta) * sprinklerRadius,
          0.2,
          sprinkler.position.z + Math.sin(theta) * sprinklerRadius
        ));
      }
      const circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const circleMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
      const circle = new THREE.Line(circleGeometry, circleMaterial);
      scene.add(circle);
      measurements.push(circle);

      // Add coverage radius label for the first sprinkler only
      if (sprinkler === sprinklersRef.current[0]) {
        const radiusLabel = createTextSprite(`Coverage Radius: ${sprinklerRadius}m`);
        radiusLabel.position.set(
          sprinkler.position.x + sprinklerRadius/2,
          1,
          sprinkler.position.z
        );
        scene.add(radiusLabel);
        measurements.push(radiusLabel);
      }
    });

    return measurements;
  };

  useEffect(() => {
    const isCompatible = checkSystemCompatibility();
    
    let cleanupFunctions = [];
    
    const setup = async () => {
        // Only show loading screen for high quality mode
        if (isHighQuality) {
            setIsLoading(true);
            
            // Clear existing content first
            if (sceneRef.current) {
                while(sceneRef.current.children.length > 0) { 
                    const object = sceneRef.current.children[0];
                    sceneRef.current.remove(object);
                    
                    // Properly dispose of materials and geometries
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                    if (object.geometry) object.geometry.dispose();
                }
            }
        } else {
            setIsLoading(false);
        }

        const { scene, camera, renderer } = setupScene();
        
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        
        simulationRef.current?.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        controls.enableKeys = false;
        controlsRef.current = controls;

        const ground = createGround(scene, FARM_SECTORS[selectedSector].size);
        cleanupFunctions.push(() => {
            ground.geometry.dispose();
            ground.material.dispose();
            if (ground.material.map) {
                ground.material.map.dispose();
            }
        });

        try {
            // Create farm elements
            const { plantInstances, sprinklerInstances } = await createFarmElements(scene, layoutConfig);
            plantsRef.current = plantInstances;
            sprinklersRef.current = sprinklerInstances;

            // Create measurements if showHighlights is true
            if (showHighlights) {
                const sectorSize = FARM_SECTORS[selectedSector].size;
                const plantSpacing = PLANT_LAYOUTS[selectedPlant].spacing;
                const sprinklerRadius = 8; // Standard sprinkler coverage radius

                // Clear any existing measurements
                if (measurementsRef.current.length > 0) {
                    measurementsRef.current.forEach(measurement => {
                        if (measurement.geometry) measurement.geometry.dispose();
                        if (measurement.material) measurement.material.dispose();
                        scene.remove(measurement);
                    });
                    measurementsRef.current = [];
                }

                // Create new measurements
                measurementsRef.current = createMeasurements(scene, sectorSize, plantSpacing, sprinklerRadius);

                // Add cleanup for measurements
                cleanupFunctions.push(() => {
                    measurementsRef.current.forEach(measurement => {
                        if (measurement.geometry) measurement.geometry.dispose();
                        if (measurement.material) measurement.material.dispose();
                        scene.remove(measurement);
                    });
                    measurementsRef.current = [];
                });
            }
            
            // Only set loading to false after everything is loaded in high quality mode
            if (isHighQuality) {
                setIsLoading(false);
            }
            
            cleanupFunctions.push(() => {
                plantInstances.forEach(plant => {
                    if (isHighQuality) {
                        plant.traverse((child) => {
                            if (child.isMesh) {
                                child.geometry.dispose();
                                child.material.dispose();
                            }
                        });
                    } else {
                        plant.geometry.dispose();
                        plant.material.dispose();
                    }
                });
                sprinklersRef.current = [];
                plantsRef.current = [];
            });

            const animate = () => {
                frameIdRef.current = requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };

            animate();
        } catch (error) {
            console.error('Error in setup:', error);
            setIsHighQuality(false);
            setIsLoading(false);
            setup();
        }
    };

    setup();

    return () => {
        cancelAnimationFrame(frameIdRef.current);
        cleanupFunctions.forEach(cleanup => cleanup());
        
        // Clean up measurements
        if (measurementsRef.current.length > 0) {
            measurementsRef.current.forEach(measurement => {
                if (measurement.geometry) measurement.geometry.dispose();
                if (measurement.material) measurement.material.dispose();
                sceneRef.current?.remove(measurement);
            });
            measurementsRef.current = [];
        }
        
        if (rendererRef.current) {
            rendererRef.current.dispose();
        }
        
        if (controlsRef.current) {
            controlsRef.current.dispose();
        }
        
        if (sceneRef.current) {
            sceneRef.current.clear();
        }
        
        simulationRef.current?.removeChild(rendererRef.current?.domElement);
    };
}, [selectedSector, selectedPlant, layoutConfig, soilComposition, isHighQuality, showHighlights]); // Added showHighlights dependency


  const handleQualityToggle = (value) => {
    if (value === 'high') {
      // Clear existing scene first
      if (sceneRef.current) {
        while(sceneRef.current.children.length > 0) { 
          const object = sceneRef.current.children[0];
          sceneRef.current.remove(object);
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
          if (object.geometry) object.geometry.dispose();
        }
      }
      setIsHighQuality(true);
    } else {
      setIsHighQuality(false);
    }
  };


  const setView = (viewType) => {
    if (!cameraRef.current) return;
    
    const camera = cameraRef.current;
    const size = FARM_SECTORS[selectedSector].size;
    
    const views = {
      top: [0, size, 0],
      side: [0, size/5, size],
      isometric: [size, size/2, size]
    };
    
    const [x, y, z] = views[viewType] || [0, size/2, 0];
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  };

  return (
    <div className="simulation-wrapper">
      <div className="simulation-content">
        <div className="simulation-container">
          {isHighQuality && isLoading && (
            <div className="loading-overlay">
              Loading Farm Sector... {Math.round(loadingProgress)}%
            </div>
          )}
          <div ref={simulationRef} />
        </div>
        
        <div className="control-panel">
          <div className="simulation-info">
            <p>Quality Mode: {isHighQuality ? 'High' : 'Low'}</p>
          </div>
          
          <div className="soil-composition">
            <h3>Soil Composition (%)</h3>
            <div className="soil-inputs">
              <label>
                Sand:
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={soilComposition.sand}
                  onChange={(e) => setSoilComposition(prev => ({
                    ...prev,
                    sand: parseInt(e.target.value)
                  }))}
                />
              </label>
              <label>
                Silt:
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={soilComposition.silt}
                  onChange={(e) => setSoilComposition(prev => ({
                    ...prev,
                    silt: parseInt(e.target.value)
                  }))}
                /></label>
                <label>
                  Clay:
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={soilComposition.clay}
                    onChange={(e) => setSoilComposition(prev => ({
                      ...prev,
                      clay: parseInt(e.target.value)
                    }))}
                  />
                </label>
              </div>
            </div>
  
            <div className="simulation-controls">
              <select 
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="sector-select"
              >
                {Object.entries(FARM_SECTORS).map(([key, sector]) => (
                  <option key={key} value={key}>
                    {sector.name} ({sector.size}m)
                  </option>
                ))}
              </select>
  
              <select 
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="plant-select"
              >
                {Object.keys(PLANT_LAYOUTS).map(plant => (
                  <option key={plant} value={plant}>
                    {plant.charAt(0).toUpperCase() + plant.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={isHighQuality ? 'high' : 'low'}
                onChange={(e) => handleQualityToggle(e.target.value)}
                className="quality-toggle"
              >
                <option value="high">High Quality</option>
                <option value="low">Low Quality</option>
              </select>

            </div>
  
            <div className="view-controls">
              <button onClick={() => setView('top')}>Top View</button>
              <button onClick={() => setView('side')}>Side View</button>
              <button onClick={() => setView('isometric')}>Isometric View</button>
              <button onClick={() => setShowHighlights(!showHighlights)}>
                {showHighlights ? 'Hide Grid' : 'Show Grid'}
              </button>
            </div>
          </div>      
        </div>
    </div>
  );
};

export default FarmSimulation;