import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

// Create a copy of default farm sectors
const DEFAULT_FARM_SECTORS = {
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

const createGridLayer = (bounds, gridSize = 200) => {  
  return L.gridLayer({
    tileSize: L.point(gridSize, gridSize),  
    opacity: 0.4
  }).createTile = function(coords) {
    const tile = L.DomUtil.create('canvas', 'leaflet-tile');
    const ctx = tile.getContext('2d');
    const size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;
    
    // Draw grid lines
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 2;  
    
    // Draw vertical line
    ctx.beginPath();
    ctx.moveTo(size.x, 0);
    ctx.lineTo(size.x, size.y);
    ctx.stroke();
    
    // Draw horizontal line
    ctx.beginPath();
    ctx.moveTo(0, size.y);
    ctx.lineTo(size.x, size.y);
    ctx.stroke();
    
    // Add click event listener to highlight and simulate
    tile.addEventListener('click', () => {
      console.log('Grid cell clicked:', coords);
      
      // Highlight the grid cell
      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.fillRect(0, 0, size.x, size.y);
      
      // Perform simulation for this grid
      simulateGrid(coords);
    });
    
    return tile;
  };
};

// Function to simulate grid
const simulateGrid = (coords) => {
  // Implement simulation logic here
  console.log('Simulating grid at:', coords);
};

// Add a safe dispose helper function
const safeDispose = (object) => {
  if (!object) return;
  
  if (object.geometry) {
    object.geometry.dispose();
  }
  
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    } else {
      if (object.material.map) object.material.map.dispose();
      object.material.dispose();
    }
  }
};

// Add these texture URLs at the top with other constants
const TEXTURE_URLS = {
  ground: {
    color: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg',
    normal: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big-nm.jpg',
    roughness: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big-ao.jpg'
  },
  sprinkler: {
    metal: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/metal.jpg',
    metalNormal: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/metal_normal.jpg'
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

  // Add refs for the map
  const polygonMapRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const [polygonPoints, setPolygonPoints] = useState([]);

  const [selectedSector, setSelectedSector] = useState('sector1');
  const [selectedPlant, setSelectedPlant] = useState('wheat');
  const [isLoading, setIsLoading] = useState(true);
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [soilComposition, setSoilComposition] = useState({
    sand: 33,
    silt: 33,
    clay: 34
  });
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Add state for selected grid cell
  const [selectedGridCell, setSelectedGridCell] = useState(null);
  const gridRef = useRef([]);

  // Add state for tracking selected cell coordinates
  const [selectedCellCoords, setSelectedCellCoords] = useState(null);

  // Add state to track active farm sectors
  const [activeFarmSectors, setActiveFarmSectors] = useState(DEFAULT_FARM_SECTORS);

  // Add new state for metrics display
  const [showMetrics, setShowMetrics] = useState(false);

  // Load saved data from localStorage
  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem('mapAnalysisData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Loading saved data:', parsedData);
        
        if (parsedData.soil) {
          // Round the soil values to integers
          const newSoilComposition = {
            sand: Math.round(parsedData.soil.sand),
            silt: Math.round(parsedData.soil.silt),
            clay: Math.round(parsedData.soil.clay)
          };
          
          console.log('Setting soil composition:', newSoilComposition);
          setSoilComposition(newSoilComposition);
        }

        // Load polygon points
        if (parsedData.points && parsedData.points.length > 0) {
          console.log('Loading polygon points:', parsedData.points);
          setPolygonPoints(parsedData.points);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Load saved data when component mounts
  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Add event listener for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'mapAnalysisData') {
        loadSavedData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSavedData]);

  // Initialize polygon map
  useEffect(() => {
    // Ensure the container exists and has dimensions
    const container = document.getElementById('polygon-preview');
    if (!container) return;

    // Set a small timeout to ensure the container is fully rendered
    const initializeMap = setTimeout(() => {
      if (!polygonMapRef.current && container) {
      const map = L.map('polygon-preview', {
          center: [20.5937, 78.9629],
        zoom: 5,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true
        });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap contributors'
      }).addTo(map);

        // Create polygon layer if points exist
        if (polygonPoints.length >= 3) {
          // Create the main polygon
          const polygon = L.polygon(polygonPoints, {
            color: '#28a745',
            weight: 2,
            fillOpacity: 0.1
          }).addTo(map);

          // Get polygon bounds
          const bounds = polygon.getBounds();
          
          // Calculate grid size based on polygon area
          const gridSize = 10;
          const latStep = (bounds.getNorth() - bounds.getSouth()) / gridSize;
          const lngStep = (bounds.getEast() - bounds.getWest()) / gridSize;

          // Store grid cells with their coordinates
          const gridCells = [];

          // Helper function to check if point is inside polygon
          const isPointInPolygon = (point, poly) => {
            const polyPoints = poly.getLatLngs()[0];
            let inside = false;
            
            for (let i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
              const xi = polyPoints[i].lat, yi = polyPoints[i].lng;
              const xj = polyPoints[j].lat, yj = polyPoints[j].lng;
              
              const intersect = ((yi > point[1]) !== (yj > point[1])) &&
                (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
              
              if (intersect) inside = !inside;
            }
            
            return inside;
          };

          // Create grid cells
          for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
              const cellBounds = [
                [bounds.getSouth() + latStep * row, bounds.getWest() + lngStep * col],
                [bounds.getSouth() + latStep * (row + 1), bounds.getWest() + lngStep * (col + 1)]
              ];

              // Check if cell corners are inside polygon
              const corners = [
                [cellBounds[0][0], cellBounds[0][1]], // Southwest
                [cellBounds[0][0], cellBounds[1][1]], // Southeast
                [cellBounds[1][0], cellBounds[1][1]], // Northeast
                [cellBounds[1][0], cellBounds[0][1]]  // Northwest
              ];

              // Only create cell if at least one corner is inside the polygon
              if (corners.some(corner => isPointInPolygon(corner, polygon))) {
                const rectangle = L.rectangle(cellBounds, {
        color: '#28a745',
                  weight: 1,
                  fillOpacity: 0.2
                }).addTo(map);

                // Store cell info
                gridCells.push({
                  rectangle,
                  coords: { row, col }
                });

                // Add click handler
                rectangle.on('click', () => {
                  // Reset all cells to default style
                  gridCells.forEach(cell => {
                    cell.rectangle.setStyle({
                      color: '#28a745',
                      fillOpacity: 0.2
                    });
                  });

                  // Highlight clicked cell
                  rectangle.setStyle({
                    color: '#dc3545',
                    fillOpacity: 0.4
                  });

                  // Update selected cell state
                  setSelectedCellCoords({ row, col });
                  setSelectedGridCell(rectangle);

                  // Calculate cell size in meters (using a fixed size for now)
                  const cellSize = 50; // 50 meters per cell
                  const sectorKey = `sector${row}-${col}`;
                  
                  // Create new sectors object with only the selected grid cell
                  const newSectors = {
                    [sectorKey]: {
                      name: `Grid Cell ${row}-${col}`,
                      size: cellSize,
                      soil: { clay: 33, silt: 33, sand: 34 }
                    }
                  };

                  // Update active sectors
                  setActiveFarmSectors(newSectors);

                  // Select the new sector
                  setSelectedSector(sectorKey);
                });
              }
            }
          }

          // Store grid cells reference
          gridRef.current = gridCells;

          // Fit map to polygon bounds
          map.fitBounds(bounds);
        }

        polygonMapRef.current = map;
        
        // Force a map invalidation and redraw
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    }, 100);

    return () => {
      clearTimeout(initializeMap);
      if (polygonMapRef.current) {
        // Clear grid cells
        if (gridRef.current.length > 0) {
          gridRef.current.forEach(cell => cell.rectangle.remove());
        }
        gridRef.current = [];
        polygonMapRef.current.remove();
        polygonMapRef.current = null;
      }
    };
  }, [polygonPoints]);

  // Update sector select options to use active farm sectors
  const sectorOptions = useMemo(() => {
    return Object.entries(activeFarmSectors).map(([key, sector]) => ({
      key,
      name: sector.name,
      size: sector.size
    }));
  }, [activeFarmSectors]);

  // Add effect to reset to default sectors when grid cell is deselected
  useEffect(() => {
    if (!selectedGridCell) {
      setActiveFarmSectors(DEFAULT_FARM_SECTORS);
      setSelectedSector('sector1');
    }
  }, [selectedGridCell]);

  // Update layoutConfig to use activeFarmSectors instead of FARM_SECTORS
  const layoutConfig = useMemo(() => {
    const sector = activeFarmSectors[selectedSector];
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
  }, [selectedSector, selectedPlant, activeFarmSectors]);

  
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
              child.material.needsUpdate = true;
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
      // Enhanced low-quality plant representation
      const plantGroup = new THREE.Group();
    const layout = PLANT_LAYOUTS[type];

      // Create stem
      const stemGeometry = new THREE.CylinderGeometry(
        layout.scale * 0.05,  // top radius
        layout.scale * 0.08,  // bottom radius
        layout.height,        // height
        6                     // segments
      );
      const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 }); // Dark green for stem
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = layout.height / 2;
      plantGroup.add(stem);

      // Create main foliage based on plant type
      switch(type) {
        case 'wheat':
          // Create wheat head
          const headGeometry = new THREE.ConeGeometry(
            layout.scale * 0.15,    // radius
            layout.height * 0.4,    // height
            8                       // segments
          );
          const headMaterial = new THREE.MeshBasicMaterial({ color: layout.color });
          const head = new THREE.Mesh(headGeometry, headMaterial);
          head.position.y = layout.height * 0.9;
          plantGroup.add(head);
          break;

        case 'corn':
          // Create corn leaves
          for (let i = 0; i < 4; i++) {
            const leafGeometry = new THREE.ConeGeometry(
              layout.scale * 0.2,
              layout.height * 0.6,
              4
            );
            const leafMaterial = new THREE.MeshBasicMaterial({ color: layout.color });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.y = layout.height * 0.6;
            leaf.rotation.x = Math.PI * 0.15;
            leaf.rotation.y = (Math.PI / 2) * i;
            plantGroup.add(leaf);
          }
          break;

        case 'soyabean':
        case 'peas':
          // Create bush-like structure
          for (let i = 0; i < 5; i++) {
            const leafGeometry = new THREE.SphereGeometry(
              layout.scale * 0.15,
              6,
              6
            );
            const leafMaterial = new THREE.MeshBasicMaterial({ color: layout.color });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.y = layout.height * 0.5 + Math.random() * 0.2;
            leaf.position.x = (Math.random() - 0.5) * 0.2;
            leaf.position.z = (Math.random() - 0.5) * 0.2;
            plantGroup.add(leaf);
          }
          break;

        case 'tomato':
          // Create tomato plant structure
          const mainFoliageGeometry = new THREE.SphereGeometry(
      layout.scale * 0.3,
            8,
            8
          );
          const tomatoFoliageMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
          const mainFoliage = new THREE.Mesh(mainFoliageGeometry, tomatoFoliageMaterial);
          mainFoliage.position.y = layout.height * 0.7;
          plantGroup.add(mainFoliage);

          // Add tomatoes
          for (let i = 0; i < 3; i++) {
            const tomatoGeometry = new THREE.SphereGeometry(
      layout.scale * 0.1,
              6,
              6
            );
            const tomatoMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
            const tomato = new THREE.Mesh(tomatoGeometry, tomatoMaterial);
            tomato.position.y = layout.height * 0.6 + (Math.random() - 0.5) * 0.2;
            tomato.position.x = (Math.random() - 0.5) * 0.4;
            tomato.position.z = (Math.random() - 0.5) * 0.4;
            plantGroup.add(tomato);
          }
          break;

        default:
          // Default plant shape
          const defaultFoliageGeometry = new THREE.ConeGeometry(
            layout.scale * 0.2,
            layout.height * 0.6,
            8
          );
          const defaultFoliageMaterial = new THREE.MeshBasicMaterial({ color: layout.color });
          const defaultFoliage = new THREE.Mesh(defaultFoliageGeometry, defaultFoliageMaterial);
          defaultFoliage.position.y = layout.height * 0.8;
          plantGroup.add(defaultFoliage);
      }

      return plantGroup;
  }
};

  // Modified createSprinkler with proper async loading
  const createSprinkler = async () => {
    if (isHighQuality) {
      return new Promise((resolve, reject) => {
        const loader = new GLTFLoader(loadingManagerRef.current);
        const textureLoader = new TextureLoader(loadingManagerRef.current);
        
        // Create a more detailed sprinkler model
        const sprinklerGroup = new THREE.Group();
        
        // Load metal textures
        const metalTexture = textureLoader.load(TEXTURE_URLS.sprinkler.metal);
        const metalNormalTexture = textureLoader.load(TEXTURE_URLS.sprinkler.metalNormal);
        
        // Create base
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.4, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({
          map: metalTexture,
          normalMap: metalNormalTexture,
          metalness: 0.8,
          roughness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        
        // Create stem
        const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 12);
        const stem = new THREE.Mesh(stemGeometry, baseMaterial.clone());
        stem.position.y = 0.8;
        stem.castShadow = true;
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const headMaterial = new THREE.MeshStandardMaterial({
          map: metalTexture,
          normalMap: metalNormalTexture,
          metalness: 0.9,
          roughness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.4;
        head.castShadow = true;
        
        // Create nozzles
        for (let i = 0; i < 6; i++) {
          const nozzleGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.1, 8);
          const nozzle = new THREE.Mesh(nozzleGeometry, headMaterial.clone());
          nozzle.position.y = 1.4;
          nozzle.rotation.x = Math.PI / 4;
          nozzle.rotation.y = (i / 6) * Math.PI * 2;
          nozzle.position.x = Math.cos(nozzle.rotation.y) * 0.2;
          nozzle.position.z = Math.sin(nozzle.rotation.y) * 0.2;
          nozzle.castShadow = true;
          sprinklerGroup.add(nozzle);
        }
        
        sprinklerGroup.add(base);
        sprinklerGroup.add(stem);
        sprinklerGroup.add(head);
        
        resolve(sprinklerGroup);
      });
    } else {
      // Low quality version
      const sprinklerGroup = new THREE.Group();
      
      // Simplified base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 0.3, 8),
        new THREE.MeshBasicMaterial({ color: 0x888888 })
      );
      
      // Simplified stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
        new THREE.MeshBasicMaterial({ color: 0x666666 })
      );
      stem.position.y = 0.6;
      
      // Simplified head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x444444 })
      );
      head.position.y = 1.2;
      
      sprinklerGroup.add(base);
      sprinklerGroup.add(stem);
      sprinklerGroup.add(head);
      
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


  // Modified ground creation with enhanced textures
  const createGround = (scene, size) => {
    const geometry = new THREE.PlaneGeometry(size, size, 100, 100);
    let material;

    if (isHighQuality) {
      const textureLoader = new TextureLoader(loadingManagerRef.current);
      
      // Load all ground textures
      const colorTexture = textureLoader.load(TEXTURE_URLS.ground.color);
      const normalTexture = textureLoader.load(TEXTURE_URLS.ground.normal);
      const roughnessTexture = textureLoader.load(TEXTURE_URLS.ground.roughness);
      
      // Configure texture settings
      [colorTexture, normalTexture, roughnessTexture].forEach(texture => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(size/10, size/10); // Adjust repeat based on ground size
      });

      material = new THREE.MeshStandardMaterial({ 
        map: colorTexture,
        normalMap: normalTexture,
        roughnessMap: roughnessTexture,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide 
      });
    } else {
      material = new THREE.MeshBasicMaterial({ 
        color: 0x567d46,
        side: THREE.DoubleSide 
      });
    }

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
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
      
      const sectorSize = activeFarmSectors[selectedSector].size;
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

  const createMeasurements = (scene, sectorSize, plantSpacing, sprinklerRadius, sprinklerInstances) => {
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
    if (sprinklerInstances) {
      sprinklerInstances.forEach(sprinkler => {
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
        const circleMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
      const circle = new THREE.Line(circleGeometry, circleMaterial);
        circle.position.copy(sprinkler.position);
      scene.add(circle);
      measurements.push(circle);

      // Add coverage radius label for the first sprinkler only
        if (sprinkler === sprinklerInstances[0]) {
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
    }

    return measurements;
  };

  // Add new function for creating metric overlays
  const createMetricOverlays = (scene, sectorSize, sprinklerInstances, plantInstances) => {
    const overlays = [];
    
    // Helper function to create text sprite with background
    const createInfoSprite = (message, position, scale = 1) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = '#4CAF50';
        context.lineWidth = 4;
        context.strokeRect(2, 2, canvas.width-4, canvas.height-4);
        
        // Draw text
        context.font = 'bold 24px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Handle multi-line text
        const lines = message.split('\n');
        lines.forEach((line, i) => {
            context.fillText(line, canvas.width/2, (canvas.height/(lines.length+1))*(i+1));
        });
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.scale.set(scale * 4, scale, 1);
        
        return sprite;
    };

    // Create arrow helper for distance indicators
    const createArrow = (start, end, color) => {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();

        const arrowHelper = new THREE.ArrowHelper(
            direction,
            start,
            length,
            color,
            length * 0.2, // Head length
            length * 0.1  // Head width
        );
        return arrowHelper;
    };

    // Calculate and display metrics for each sprinkler
    sprinklerInstances.forEach((sprinkler, index) => {
        const sprinklerPos = sprinkler.position;
        const plantsInRange = plantInstances.filter(plant => {
            const distance = plant.position.distanceTo(sprinklerPos);
            return distance <= 8; // 8m sprinkler radius
        });

        // Create coverage circle (border only)
        const segments = 64;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(theta) * 8, // 8m radius
                0.1,                 // Slightly above ground
                Math.sin(theta) * 8
            ));
        }
        const circleGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const circleMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const coverageCircle = new THREE.Line(circleGeometry, circleMaterial);
        coverageCircle.position.copy(sprinklerPos);
        scene.add(coverageCircle);
        overlays.push(coverageCircle);

        // Calculate coverage area
        const coverageArea = Math.PI * 64; // πr², r = 8m

        // Create info display
        const infoText = `Sprinkler #${index + 1}\n` +
                        `Plants in range: ${plantsInRange.length}\n` +
                        `Coverage area: ${coverageArea.toFixed(1)}m²\n` +
                        `Efficiency: ${((plantsInRange.length / coverageArea) * 100).toFixed(1)} plants/m²`;
        
        const infoSprite = createInfoSprite(
            infoText,
            new THREE.Vector3(sprinklerPos.x, 2, sprinklerPos.z),
            1.5
        );
        
        scene.add(infoSprite);
        overlays.push(infoSprite);

        // Draw arrow only to the nearest plant
        if (plantsInRange.length > 0) {
            const nearestPlant = plantsInRange.reduce((nearest, current) => {
                const currentDistance = current.position.distanceTo(sprinklerPos);
                const nearestDistance = nearest.position.distanceTo(sprinklerPos);
                return currentDistance < nearestDistance ? current : nearest;
            });

            const distance = nearestPlant.position.distanceTo(sprinklerPos);
            const startPos = new THREE.Vector3(sprinklerPos.x, 0.5, sprinklerPos.z);
            const endPos = new THREE.Vector3(nearestPlant.position.x, 0.5, nearestPlant.position.z);
            
            // Create arrow with black color
            const arrow = createArrow(startPos, endPos, 0x000000);
            scene.add(arrow);
            overlays.push(arrow);

            // Add distance label
            const midPoint = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);
            midPoint.y = 1;
            const distanceLabel = createInfoSprite(
                `${distance.toFixed(1)}m`,
                midPoint,
                0.5
            );
            scene.add(distanceLabel);
            overlays.push(distanceLabel);
        }
    });

    // Add sector summary with enhanced information
    const totalArea = sectorSize * sectorSize;
    const plantDensity = plantInstances.length / totalArea;
    const sprinklerDensity = sprinklerInstances.length / totalArea;
    
    const sectorInfo = `Field Summary\n` +
                      `Total Area: ${totalArea.toFixed(1)}m²\n` +
                      `Plant Count: ${plantInstances.length}\n` +
                      `Plant Density: ${plantDensity.toFixed(2)} plants/m²\n` +
                      `Sprinkler Count: ${sprinklerInstances.length}\n` +
                      `Coverage Ratio: ${(sprinklerInstances.length * Math.PI * 64 / totalArea).toFixed(2)}x`;
    
    const summarySprite = createInfoSprite(
        sectorInfo,
        new THREE.Vector3(0, 3, -sectorSize/2),
        2
    );
    scene.add(summarySprite);
    overlays.push(summarySprite);

    return overlays;
  };

  useEffect(() => {
    const isCompatible = checkSystemCompatibility();
    
    let cleanupFunctions = [];
    
    const setup = async () => {
        if (isHighQuality) {
            setIsLoading(true);
            
            // Clear existing content first
            if (sceneRef.current) {
                while(sceneRef.current.children.length > 0) { 
                    const object = sceneRef.current.children[0];
                    sceneRef.current.remove(object);
                    safeDispose(object);
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

        const ground = createGround(scene, activeFarmSectors[selectedSector].size);
        cleanupFunctions.push(() => {
            if (ground) {
                safeDispose(ground);
            }
        });

        try {
            const { plantInstances, sprinklerInstances } = await createFarmElements(scene, layoutConfig);
            plantsRef.current = plantInstances;
            sprinklersRef.current = sprinklerInstances;

            // Add metrics overlays if enabled
            let metricOverlays = [];
            if (showMetrics) {
                metricOverlays = createMetricOverlays(
                    scene,
                    activeFarmSectors[selectedSector].size,
                    sprinklerInstances,
                    plantInstances
                );
            }

            // Add cleanup for metric overlays
                cleanupFunctions.push(() => {
                metricOverlays.forEach(overlay => {
                    if (overlay.material) {
                        if (overlay.material.map) {
                            overlay.material.map.dispose();
                        }
                        overlay.material.dispose();
                    }
                    if (overlay.geometry) {
                        overlay.geometry.dispose();
                    }
                    scene.remove(overlay);
                });
            });
            
            if (isHighQuality) {
                setIsLoading(false);
            }
            
            cleanupFunctions.push(() => {
          if (plantInstances) {
                plantInstances.forEach(plant => {
              if (plant) {
                    if (isHighQuality) {
                        plant.traverse((child) => {
                    if (child && child.isMesh) {
                      safeDispose(child);
                            }
                        });
                    } else {
                  safeDispose(plant);
                }
                    }
                });
          }
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
            setIsLoading(false);
        }
    };

    setup();

    return () => {
        cancelAnimationFrame(frameIdRef.current);
      if (cleanupFunctions) {
        cleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Error during cleanup:', error);
          }
        });
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
        
      if (simulationRef.current && rendererRef.current) {
        simulationRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [selectedSector, selectedPlant, layoutConfig, soilComposition, isHighQuality, showMetrics]);


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
    const size = activeFarmSectors[selectedSector].size;
    
    const views = {
      top: [0, size, 0],
      side: [0, size/5, size],
      isometric: [size, size/2, size]
    };
    
    const [x, y, z] = views[viewType] || [0, size/2, 0];
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  };

  const styles = {
    loadingData: {
      padding: '10px',
      textAlign: 'center',
      color: '#666',
      fontStyle: 'italic',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      margin: '10px 0'
    },
    polygonPreview: {
      height: '400px',
      width: '100%',
      border: '1px solid #ccc',
      borderRadius: '4px',
      marginBottom: '20px'
    }
  };

  return (
    <div className="simulation-wrapper">
      <div className="simulation-content">
        {/* Update polygon preview container with proper styling */}
        <div className="polygon-preview-container">
          <h3>Field Boundary</h3>
          <div id="polygon-preview" style={styles.polygonPreview}></div>
        </div>

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
            {isDataLoading ? (
              <div style={styles.loadingData}>Loading soil data...</div>
            ) : (
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
            )}
          </div>
  
          <div className="simulation-controls">
            <select 
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="sector-select"
            >
              {sectorOptions.map(({ key, name, size }) => (
                <option key={key} value={key}>
                  {name} ({size}m)
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
            <button 
              onClick={() => setShowMetrics(!showMetrics)}
              className={showMetrics ? 'active' : ''}
            >
              {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
            </button>
          </div>
        </div>      
      </div>
    </div>
  );
};

export default FarmSimulation;