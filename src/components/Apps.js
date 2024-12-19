import React, { useState, useRef, useEffect } from 'react';
import { Viewer } from 'resium';
import { Cartesian3, Color, Ion, PerspectiveOffCenterFrustum, Math as CesiumMath } from '@cesium/engine';
import '@cesium/engine/Source/Widget/CesiumWidget.css';

// Ensure proper Cesium Ion configuration
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjY2ZiMDNkMC1lYzBjLTQwODEtOWI3NS05Mjg5ODBkZGEyMzQiLCJpZCI6MjUxNzk4LCJpYXQiOjE3MzA0NzA3NzJ9.Jiz1WnO9HeCSQp8HWg1vhxudo6NxbxRjPQm5zKqxAYw';

// Optional: Add error boundary
const CesiumErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Cesium Error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return <div>Error loading Cesium resources. Please check console for details.</div>;
  }

  return children;
};

const Maps3D = () => {
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Disable Cesium's default error handling
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Log errors
      originalConsoleError(...args);
      
      // Capture specific error messages
      if (args[0] && typeof args[0] === 'string') {
        setError(args[0]);
      }
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    const initializeCesium = async () => {
      try {
        // Verify Ion access token
        if (!Ion.defaultAccessToken || Ion.defaultAccessToken === 'YOUR_CESIUM_ION_ACCESS_TOKEN') {
          throw new Error('Cesium Ion access token is not set');
        }

        // If using viewer ref
        if (viewerRef.current) {
          const viewer = viewerRef.current.cesiumElement;

          if (viewer && viewer.camera) {
            // Create a custom perspective off-center frustum
            const frustum = new PerspectiveOffCenterFrustum({
              left: -1.0,
              right: 1.0,
              top: 1.0,
              bottom: -1.0,
              near: 1.0,
              far: 10000000.0
            });

            // Set the camera frustum
            viewer.camera.frustum = frustum;

            // Set up the camera view
            viewer.camera.setView({
              destination: Cartesian3.fromDegrees(-74.0064, 40.7142, 2000),
              orientation: {
                heading: CesiumMath.toRadians(0.0),
                pitch: CesiumMath.toRadians(-90.0),
                roll: 0.0
              }
            });

            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Cesium initialization error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeCesium();
  }, []);

  if (error) {
    return (
      <div>
        <h2>Error Loading Cesium</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading Cesium...</div>;
  }

  return (
    <CesiumErrorBoundary>
      <Viewer
        ref={viewerRef}
        full
        scene3DOnly
        timeline={false}
        animation={false}
      />
    </CesiumErrorBoundary>
  );
};

export default Maps3D;