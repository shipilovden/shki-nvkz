"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { bindCameraUI, startCamera, stopCamera } from "./camera-block";

const AR_CONFIG = {
  TARGET: { lat: 53.691670, lon: 87.432858, alt: 389.0, activationRadiusM: 50 },
  MODEL: { url: "/models/nataraja_shiva.glb", scale: 2.0, headingDeg: 0, yOffset: 0.0 },
};

export function ARQuest(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uiVisible, setUiVisible] = useState(false);
  const [started, setStarted] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const dφ = ((lat2 - lat1) * Math.PI) / 180;
    const dλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const updateModelPositionGPS = useCallback((userLat: number, userLon: number, userAlt: number) => {
    const model = modelRef.current;
    if (!model) {
      console.log("❌ Model not loaded yet");
      return;
    }
    
    const latRad = (userLat * Math.PI) / 180;
    const metersPerDegLat = 110574;
    const metersPerDegLon = 111320 * Math.cos(latRad);
    const dx = (AR_CONFIG.TARGET.lon - userLon) * metersPerDegLon;
    const dz = (AR_CONFIG.TARGET.lat - userLat) * metersPerDegLat;
    const dy = (AR_CONFIG.TARGET.alt - userAlt) + AR_CONFIG.MODEL.yOffset;
    
    console.log("🎯 GPS Update:", {
      user: { lat: userLat.toFixed(6), lon: userLon.toFixed(6), alt: userAlt.toFixed(1) },
      target: { lat: AR_CONFIG.TARGET.lat, lon: AR_CONFIG.TARGET.lon, alt: AR_CONFIG.TARGET.alt },
      position: { x: dx.toFixed(1), y: dy.toFixed(1), z: dz.toFixed(1) },
      distance: haversine(userLat, userLon, AR_CONFIG.TARGET.lat, AR_CONFIG.TARGET.lon).toFixed(1) + "m"
    });
    
    model.position.set(dx, dy, dz);
    model.rotation.y = THREE.MathUtils.degToRad(AR_CONFIG.MODEL.headingDeg);
  }, []);

  const startAR = useCallback(async (userLat: number, userLon: number, userAlt: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Привязка UI кнопок камеры и запуск задней камеры как видео-фона
    bindCameraUI(scene, renderer);
    const stream = await startCamera(scene, "environment");
    videoStreamRef.current = stream;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    const loader = new GLTFLoader();
    console.log("📦 Loading model:", AR_CONFIG.MODEL.url);
    loader.load(AR_CONFIG.MODEL.url, (gltf) => {
      console.log("✅ Model loaded successfully:", gltf);
      const model = gltf.scene;
      model.traverse((o: any) => {
        if (o.isMesh) o.frustumCulled = false;
      });
      model.scale.setScalar(AR_CONFIG.MODEL.scale);
      scene.add(model);
      modelRef.current = model;
      console.log("🎯 Setting initial model position...");
      updateModelPositionGPS(userLat, userLon, userAlt);
    }, undefined, (error) => {
      console.error("❌ Model loading error:", error);
    });

    setStatus("GPS mode (~meters)");

    function tick() {
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();

    window.addEventListener("resize", () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    });
  }, [updateModelPositionGPS]);

  const startQuest = useCallback(async () => {
    if (started) return;
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается");
      return;
    }
    
    console.log("🚀 Starting AR Quest...");
    setStatus("Проверяем локацию...");
    
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 5000,
        })
      );
      
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;
      const userAlt = pos.coords.altitude ?? 0;
      const dist = haversine(userLat, userLon, AR_CONFIG.TARGET.lat, AR_CONFIG.TARGET.lon);
      
      console.log("📍 Location Check:", {
        user: { lat: userLat.toFixed(6), lon: userLon.toFixed(6), alt: userAlt.toFixed(1) },
        target: { lat: AR_CONFIG.TARGET.lat, lon: AR_CONFIG.TARGET.lon, alt: AR_CONFIG.TARGET.alt },
        distance: dist.toFixed(1) + "m",
        radius: AR_CONFIG.TARGET.activationRadiusM + "m",
        inRange: dist <= AR_CONFIG.TARGET.activationRadiusM
      });
      
      if (dist > AR_CONFIG.TARGET.activationRadiusM) {
        setStatus(`Удалено: ${dist.toFixed(1)}м. Подойдите ближе (≤ ${AR_CONFIG.TARGET.activationRadiusM}м).`);
        console.log("❌ Too far from target location");
        return;
      }
      
      console.log("✅ Location approved, starting AR...");
      setStatus("Запускаем камеру...");
      setStarted(true);
      setUiVisible(true);
      await startAR(userLat, userLon, userAlt);
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (p) => {
          console.log("🔄 GPS Update received:", {
            lat: p.coords.latitude.toFixed(6),
            lon: p.coords.longitude.toFixed(6),
            alt: (p.coords.altitude ?? 0).toFixed(1)
          });
          updateModelPositionGPS(p.coords.latitude, p.coords.longitude, p.coords.altitude ?? 0);
        },
        (err) => console.error("❌ GPS Error:", err),
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    } catch (e) {
      console.error("❌ Start Quest Error:", e);
      setStatus("Разрешите доступ к геолокации");
      alert("Разрешите доступ к геолокации");
    }
  }, [startAR, started, updateModelPositionGPS]);

  const capturePhoto = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    try {
      const dataURL = renderer.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataURL; a.download = "ar-photo.png"; a.click();
    } catch {}
  }, []);

  const startVideo = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const stream = renderer.domElement.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => {
      const blob = new Blob([e.data], { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "ar-video.webm"; a.click();
    };
    recorder.start();
    recorderRef.current = recorder;
  }, []);

  const stopVideo = useCallback(() => {
    try { recorderRef.current?.stop(); } catch {}
  }, []);

  useEffect(() => {
    return () => {
      try { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
      try { stopCamera(); } catch {}
      try { rendererRef.current?.dispose(); } catch {}
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button id="start-ar" onClick={startQuest}>Начать AR квест</button>

      <canvas ref={canvasRef} id="ar-canvas" style={{ display: started ? "block" : "none", width: "100vw", height: "100vh" }} />

      <div id="ar-controls" style={{ display: uiVisible ? "flex" : "none", position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9, gap: 8 }}>
        <button id="btn-photo" onClick={capturePhoto}>📸 Фото</button>
        <button id="btn-video" onClick={startVideo}>🎥 Видео</button>
        <button id="btn-stop" onClick={stopVideo}>⏹ Стоп</button>
        <button id="btn-switch">🔄 Камера</button>
      </div>

      <div id="status" style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 9, padding: "6px 10px", borderRadius: 8, background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 12, display: status ? "block" : "none" }}>{status}</div>
    </div>
  );
}

export default ARQuest;


