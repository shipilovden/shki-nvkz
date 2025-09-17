"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { bindCameraUI, startCamera, stopCamera, setBackgroundVideoVisible } from "./camera-block";

const AR_CONFIG = {
  TARGETS: [
    { 
      id: "rhino", 
      name: "носорог",
      lat: 53.759072, 
      lon: 87.122719, 
      alt: 280.0, 
      activationRadiusM: 50,
      model: { url: "/models/southern_white_rhino.glb", scale: 2.0, headingDeg: 0, yOffset: 0.0 }
    },
    { 
      id: "shiva", 
      name: "Шива",
      lat: 53.691667, 
      lon: 87.432778, 
      alt: 389.0, 
      activationRadiusM: 50,
      model: { url: "/models/nataraja_shiva.glb", scale: 4.0, headingDeg: 0, yOffset: 2.0 }
    }
  ]
};

export function ARQuest(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string>("");
  const [uiVisible, setUiVisible] = useState(false);
  const [started, setStarted] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any | null>(null);
  const modelsRef = useRef<{[key: string]: THREE.Object3D}>({});
  const markersRef = useRef<{[key: string]: THREE.Object3D}>({});
  const videoStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [markersVisible, setMarkersVisible] = useState(true); // По умолчанию маркеры видны
  const markersVisibleRef = useRef(true);
  const [objectInfo, setObjectInfo] = useState<{[key: string]: {distance: number, inRange: boolean, coordinates: {lat: number, lon: number, alt: number}}}>({});
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [compassAngle, setCompassAngle] = useState<number | null>(null);
  const userPosRef = useRef<{lat:number, lon:number, alt:number}>({lat:0,lon:0,alt:0});
  // Авто-очистка статуса через 3 секунды, чтобы не залипал баннер
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 3000);
    return () => clearTimeout(t);
  }, [status]);

  // Функция для добавления отладочной информации
  const addDebugInfo = useCallback((message: string) => {
    setDebugInfo(prev => {
      const newInfo = [...prev, `${new Date().toLocaleTimeString()}: ${message}`];
      // Ограничиваем количество сообщений
      return newInfo.slice(-10);
    });
  }, []);

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
    const latRad = (userLat * Math.PI) / 180;
    const metersPerDegLat = 110574;
    const metersPerDegLon = 111320 * Math.cos(latRad);
    
    let closest: {id:string; angle:number; distance:number} | null = null as any;
    AR_CONFIG.TARGETS.forEach(target => {
      const model = modelsRef.current[target.id];
      const marker = markersRef.current[target.id];
      
      if (!model) {
        console.log(`❌ Model ${target.name} not loaded yet`);
        return;
      }
      
      const dx = (target.lon - userLon) * metersPerDegLon;
      const dz = (target.lat - userLat) * metersPerDegLat;
      const dy = (target.alt - userAlt) + target.model.yOffset;
      const distance = haversine(userLat, userLon, target.lat, target.lon);
      
      console.log(`🎯 GPS Update ${target.name}:`, {
        user: { lat: userLat.toFixed(6), lon: userLon.toFixed(6), alt: userAlt.toFixed(1) },
        target: { lat: target.lat, lon: target.lon, alt: target.alt },
        position: { x: dx.toFixed(1), y: dy.toFixed(1), z: dz.toFixed(1) },
        distance: distance.toFixed(1) + "m"
      });
      
      model.position.set(dx, dy, dz);
      model.rotation.y = THREE.MathUtils.degToRad(target.model.headingDeg);
      
      // Обновляем позицию красного маркера над моделью
      if (marker) {
        // Маркер появляется только если пользователь близко к объекту (менее 50 метров)
        if (distance <= target.activationRadiusM) {
          // Позиционируем маркер над моделью в реальном мире
          // Маркер должен следовать за GPS координатами объекта
          const markerY = Math.max(dy + target.model.yOffset + 2, 2); // +2 метра над моделью
          marker.position.set(dx, markerY, dz);
          // Форс-показ маркера в радиусе; переключатель действует как доп. фильтр
          marker.visible = markersVisibleRef.current; // уважает переключатель
          
          // Добавляем информацию о GPS координатах для отладки
          console.log(`🔴 Marker ${target.name} positioned above model: (${dx.toFixed(1)}, ${markerY.toFixed(1)}, ${dz.toFixed(1)})`);
          console.log(`🔴 GPS coordinates: ${target.lat}, ${target.lon}, ${target.alt}m`);
          console.log(`🔴 User GPS: ${userLat}, ${userLon}, ${userAlt}m`);
          // вычисляем азимут для компаса
          const y = Math.sin((target.lon - userLon) * Math.PI/180) * Math.cos(target.lat * Math.PI/180);
          const x = Math.cos(userLat * Math.PI/180) * Math.sin(target.lat * Math.PI/180) - Math.sin(userLat * Math.PI/180) * Math.cos(target.lat * Math.PI/180) * Math.cos((target.lon - userLon) * Math.PI/180);
          const bearingRad = Math.atan2(y, x);
          const bearingDeg = (bearingRad * 180/Math.PI + 360) % 360; // 0..360
          if (!closest || distance < closest.distance) closest = { id: target.id, angle: bearingDeg, distance };
        } else {
          // Скрываем маркер если далеко
          marker.visible = false;
        }
        
        // Размер маркера зависит от расстояния (чем дальше, тем меньше)
        const maxDistance = 1000; // максимальное расстояние для расчета размера
        const minSize = 0.5; // Увеличиваем минимальный размер
        const maxSize = 2.0; // Увеличиваем максимальный размер
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const markerSize = maxSize - (normalizedDistance * (maxSize - minSize));
        
        // Сохраняем базовый размер для пульсации
        marker.userData.baseScale = markerSize;
        marker.scale.setScalar(markerSize);
        if (distance <= target.activationRadiusM) {
          marker.visible = true && markersVisibleRef.current;
        }
        
        if (distance <= target.activationRadiusM) {
          const markerY = Math.max(dy + target.model.yOffset + 2, 2);
          console.log(`🔴 Marker ${target.name} updated: position=(${dx.toFixed(1)}, ${markerY.toFixed(1)}, ${dz.toFixed(1)}), size=${markerSize.toFixed(2)}, visible=${marker.visible}`);
          console.log(`🔴 Marker ${target.name} distance from camera: ${Math.sqrt(dx*dx + dy*dy + dz*dz).toFixed(1)}m`);
          addDebugInfo(`🔴 ${target.name}: GPS(${target.lat.toFixed(6)},${target.lon.toFixed(6)}) dist=${distance.toFixed(0)}m VISIBLE`);
        } else {
          console.log(`🔴 Marker ${target.name} hidden: distance=${distance.toFixed(1)}m > ${target.activationRadiusM}m`);
          addDebugInfo(`🔴 ${target.name}: HIDDEN (${distance.toFixed(0)}m > ${target.activationRadiusM}m)`);
        }
        
        // Обновляем информацию об объекте
        setObjectInfo((prev: any) => ({
          ...prev,
          [target.id]: {
            distance: distance,
            inRange: distance <= target.activationRadiusM,
            coordinates: { lat: target.lat, lon: target.lon, alt: target.alt }
          }
        }));
        
        console.log(`🔴 Marker ${target.name} updated:`, { 
          x: dx.toFixed(1), 
          y: (dy + 3).toFixed(1), 
          z: dz.toFixed(1),
          size: markerSize.toFixed(2),
          distance: distance.toFixed(1) + "m",
          visible: markersVisible
        });
      } else {
        console.log(`❌ Marker ${target.name} not found for position update`);
      }
    });
    if (closest && typeof closest.angle === 'number') setCompassAngle(closest.angle);
  }, [markersVisible]);

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

    // Подключаем DeviceOrientation для того, чтобы камера
    // вращалась при повороте телефона (не требуются гео-абсолютные сенсоры)
    // Простейшее управление ориентацией камеры через события устройства
    try {
      const handleOrientation = (e: any) => {
        const alpha = (e.alpha || 0) * (Math.PI/180);
        const beta = (e.beta || 0) * (Math.PI/180);
        const gamma = (e.gamma || 0) * (Math.PI/180);
        // Преобразуем в кватернион камеры
        const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
        camera.quaternion.setFromEuler(euler);
      };
      window.addEventListener("deviceorientation", handleOrientation, true);
      controlsRef.current = { dispose: () => window.removeEventListener("deviceorientation", handleOrientation, true) };
      addDebugInfo("🧭 DeviceOrientation активен");
    } catch {}

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    // Создаём маркеры для каждой модели
    AR_CONFIG.TARGETS.forEach(target => {
      const markerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.9, 
        depthTest: false, // всегда поверх видео
        depthWrite: false
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.renderOrder = 9999;
      // При создании не показываем маркер, пока не придёт первый GPS апдейт
      marker.position.set(0, 0, -5); // Временная позиция
      marker.visible = false;
      marker.userData.baseScale = 2.0; // Размер маркера
      marker.userData.targetId = target.id; // Добавляем ID цели для отладки
      marker.name = `MARKER_${target.id}`; // Добавляем имя для отладки
      scene.add(marker);
      markersRef.current[target.id] = marker;
      console.log(`🔴 Red marker for ${target.name} created (hidden until GPS update), inScene: ${scene.children.includes(marker)}`);
      addDebugInfo(`🔴 Marker ${target.name} created (hidden), size: 2.0, GPS MODE`);
    });
    
    console.log(`🔴 Total markers created: ${Object.keys(markersRef.current).length}`);
    console.log(`🔴 Scene children count: ${scene.children.length}`);
      addDebugInfo(`🔴 Total markers: ${Object.keys(markersRef.current).length}`);
      addDebugInfo(`🔴 GPS MODE: Markers follow GPS coordinates when distance < 50m`);
    
    // Тестовый маркер больше не нужен

    // Загружаем все модели
    const loader = new GLTFLoader();
    AR_CONFIG.TARGETS.forEach(target => {
      console.log(`📦 Loading model: ${target.name} - ${target.model.url}`);
      loader.load(target.model.url, (gltf) => {
        console.log(`✅ Model ${target.name} loaded successfully:`, gltf);
        const model = gltf.scene;
        model.traverse((o: any) => {
          if (o.isMesh) o.frustumCulled = false;
        });
        model.scale.setScalar(target.model.scale);
        scene.add(model);
        modelsRef.current[target.id] = model;
        console.log(`🎯 Setting initial position for ${target.name}...`);
        updateModelPositionGPS(userLat, userLon, userAlt);
      }, undefined, (error) => {
        console.error(`❌ Model ${target.name} loading error:`, error);
      });
    });

    setStatus("GPS mode (~meters)");
    
    // Отладочная информация о камере и сцене
    console.log(`📷 Camera position: (${camera.position.x}, ${camera.position.y}, ${camera.position.z})`);
    console.log(`📷 Camera rotation: (${camera.rotation.x}, ${camera.rotation.y}, ${camera.rotation.z})`);
    console.log(`📷 Camera near: ${camera.near}, far: ${camera.far}`);
    console.log(`🎬 Scene background: ${scene.background ? 'SET' : 'NOT SET'}`);
    console.log(`🎬 Scene children: ${scene.children.map(child => child.name || child.type).join(', ')}`);

    function tick() {
      // Пульсирующий эффект для всех красных маркеров
      const time = Date.now() * 0.003;
      
      // Тестовый маркер удалён
      
      AR_CONFIG.TARGETS.forEach(target => {
        const marker = markersRef.current[target.id];
        if (marker) {
          // Устанавливаем видимость маркера
          marker.visible = markersVisibleRef.current;
          
          if (markersVisible) {
            // Получаем базовый размер из userData
            const baseScale = marker.userData.baseScale || 0.5;
            const pulseScale = baseScale * (1 + Math.sin(time) * 0.3);
            const opacity = 0.6 + Math.sin(time * 1.5) * 0.2;
            marker.scale.setScalar(pulseScale);
            const material = (marker as THREE.Mesh).material as THREE.MeshBasicMaterial;
            material.opacity = opacity;
            
            // Логируем каждые 100 кадров для отладки
            if (Math.floor(time * 100) % 100 === 0) {
              console.log(`🔴 Marker ${target.name} pulsing: visible=${markersVisible}, scale=${pulseScale.toFixed(2)}, opacity=${opacity.toFixed(2)}, position=(${marker.position.x.toFixed(1)}, ${marker.position.y.toFixed(1)}, ${marker.position.z.toFixed(1)})`);
            }
          }
          // HTML-оверлей: синхронизируем 2D-точку с 3D-маркером (пульсация и видимость)
          const overlay = document.getElementById('overlay-markers');
          if (overlay && camera && renderer) {
            let dot = overlay.querySelector(`.dot-${target.id}`) as HTMLDivElement | null;
            if (!dot) {
              dot = document.createElement('div');
              dot.className = `dot-${target.id}`;
              Object.assign(dot.style, {
                position: 'absolute', width: '18px', height: '18px', borderRadius: '50%',
                background: 'rgba(255,0,0,0.85)', transform: 'translate(-50%, -50%)', display: 'none'
              } as CSSStyleDeclaration);
              overlay.appendChild(dot);
            }
            const v = new THREE.Vector3(marker.position.x, marker.position.y, marker.position.z).project(camera);
            const rectW = (canvasRef.current?.clientWidth || 1);
            const rectH = (canvasRef.current?.clientHeight || 1);
            const x = (v.x * 0.5 + 0.5) * rectW;
            const y = (-v.y * 0.5 + 0.5) * rectH;
            const inFront = v.z < 1 && v.z > -1;
            if (markersVisibleRef.current && inFront && marker.visible) {
              dot.style.left = `${x}px`;
              dot.style.top = `${y}px`;
              dot.style.display = 'block';
              // пульсация
              const size = 14 + Math.sin(time) * 6;
              dot.style.width = `${size}px`; dot.style.height = `${size}px`;
            } else {
              dot.style.display = 'none';
            }
          }
        } else {
          // Логируем каждые 100 кадров если маркер не найден
          if (Math.floor(time * 100) % 100 === 0) {
            console.log(`❌ Marker ${target.name} not found in markersRef!`);
          }
        }
      });
      
      if (controlsRef.current) controlsRef.current.update();
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
    setStatus("");
    addDebugInfo("🚀 Starting AR Quest...");
    
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 30000, maximumAge: 0,
        })
      );
      
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;
      const userAlt = pos.coords.altitude ?? 0;
      userPosRef.current = { lat: userLat, lon: userLon, alt: userAlt };
      
      // Проверяем расстояние до всех точек
      const distances = AR_CONFIG.TARGETS.map(target => ({
        name: target.name,
        distance: haversine(userLat, userLon, target.lat, target.lon),
        inRange: haversine(userLat, userLon, target.lat, target.lon) <= target.activationRadiusM
      }));
      
      const closestTarget = distances.reduce((closest, current) => 
        current.distance < closest.distance ? current : closest
      );
      
      console.log("📍 Location Check:", {
        user: { lat: userLat.toFixed(6), lon: userLon.toFixed(6), alt: userAlt.toFixed(1) },
        distances: distances.map(d => `${d.name}: ${d.distance.toFixed(1)}m (${d.inRange ? 'в радиусе' : 'далеко'})`),
        closest: `${closestTarget.name}: ${closestTarget.distance.toFixed(1)}m`
      });
      
      addDebugInfo(`📍 User: ${userLat.toFixed(6)}, ${userLon.toFixed(6)}, ${userAlt.toFixed(1)}m`);
      addDebugInfo(`📍 Closest: ${closestTarget.name} ${closestTarget.distance.toFixed(0)}m`);
      
      // Показываем статус с обеими дистанциями
      const statusText = distances.map(d => `${d.name}: ${d.distance.toFixed(1)}м`).join(', ');
      
      if (!distances.some(d => d.inRange)) {
        setStatus(`Удалено от всех точек. ${statusText}. Подойдите ближе (≤ 50м).`);
        console.log("❌ Too far from all target locations");
        return;
      }
      
      console.log("✅ Location approved, starting AR...");
      setStatus("");
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
          userPosRef.current = { lat: p.coords.latitude, lon: p.coords.longitude, alt: p.coords.altitude ?? 0 };
          updateModelPositionGPS(p.coords.latitude, p.coords.longitude, p.coords.altitude ?? 0);
          setStatus(""); // очищаем статус при первом валидном апдейте
        },
        (err) => {
          console.error("❌ GPS Error:", err);
          if (err.code === 1) setStatus("Разрешите доступ к геолокации");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
      );
    } catch (e) {
      console.error("❌ Start Quest Error:", e);
      // Только показываем сообщение, если действительно ошибка доступа
      if ((e as any)?.code === 1) { // PERMISSION_DENIED
        setStatus("Разрешите доступ к геолокации");
        alert("Разрешите доступ к геолокации");
      } else {
        setStatus("Не удалось получить геолокацию. Повторите попытку.");
      }
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

  // Полное завершение AR-квеста
  const stopQuest = useCallback(() => {
    try { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
    watchIdRef.current = null;
    try { stopCamera(); } catch {}
    try { rendererRef.current?.dispose(); } catch {}
    sceneRef.current = null; cameraRef.current = null; rendererRef.current = null;
    setStarted(false); setUiVisible(false); setFullscreenMode(false); setStatus("");
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
        setFullscreenMode(true);
        setBackgroundVideoVisible(true);
      } else {
        document.exitFullscreen?.();
        setFullscreenMode(false);
        setBackgroundVideoVisible(false);
      }
      console.log("📱 Fullscreen toggled");
    } catch {}
  }, []);

  const toggleMarkers = useCallback(() => {
    setMarkersVisible(prev => {
      const newMode = !prev;
      markersVisibleRef.current = newMode;
      console.log("🔴 Маркеры:", newMode ? "ON" : "OFF");
      addDebugInfo(`🔴 Маркеры: ${newMode ? "ON" : "OFF"}`);
      AR_CONFIG.TARGETS.forEach(target => {
        const marker = markersRef.current[target.id];
        if (marker) marker.visible = newMode;
      });
      return newMode;
    });
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
      <button 
        id="start-ar" 
        onClick={startQuest}
        style={{ display: started ? "none" : "block" }}
      >
        Начать AR квест
      </button>

      {/* AR viewport контейнер: маленький рядом с кнопкой, полноэкранный при режиме */}
      <div
        id="ar-viewport"
        style={{
          display: started ? "block" : "none",
          position: fullscreenMode ? "fixed" : "relative",
          top: fullscreenMode ? 0 : "auto",
          left: fullscreenMode ? 0 : "auto",
          width: fullscreenMode ? "100vw" : 360,
          height: fullscreenMode ? "100vh" : 220,
          marginTop: fullscreenMode ? 0 : 12,
          zIndex: fullscreenMode ? 9999 : "auto",
          borderRadius: fullscreenMode ? 0 : 8,
          overflow: "hidden",
          boxShadow: fullscreenMode ? "none" : "0 4px 18px rgba(0,0,0,0.3)",
        }}
      >
        <canvas 
          ref={canvasRef} 
          id="ar-canvas" 
          style={{ 
            width: "100%", 
            height: "100%",
            display: "block"
          }} 
        />

        {/* HTML-оверлей для маркеров (на случай, если WebGL-маркер не виден) */}
        <div
          id="overlay-markers"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        <div id="ar-controls" style={{ 
          display: uiVisible ? "flex" : "none", 
          position: fullscreenMode ? "fixed" : "absolute", 
          bottom: 12, 
          left: fullscreenMode ? "50%" : "50%", 
          transform: "translateX(-50%)", 
          zIndex: 10000, 
          gap: 4,
          overflowX: "hidden",
          padding: "0 10px",
          maxWidth: fullscreenMode ? "calc(100vw - 20px)" : "calc(100% - 20px)",
          boxSizing: "border-box",
          justifyContent: "center"
        }}>
        <button 
          id="btn-photo" 
          onClick={capturePhoto}
          style={{ padding: "6px 8px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px", whiteSpace: "nowrap" }}
        >
          📸 Фото
        </button>
        <button 
          id="btn-video" 
          onClick={startVideo}
          style={{ padding: "6px 8px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px", whiteSpace: "nowrap" }}
        >
          🎥 Видео
        </button>
        <button 
          id="btn-stop" 
          onClick={stopVideo}
          style={{ padding: "6px 8px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px", whiteSpace: "nowrap" }}
        >
          ⏹ Стоп
        </button>
        <button 
          id="btn-switch"
          style={{ padding: "6px 8px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px", whiteSpace: "nowrap" }}
        >
          🔄 Камера
        </button>
        <button 
          onClick={toggleMarkers} 
          style={{ 
            padding: "6px 8px", 
            background: markersVisible ? "rgba(255,0,0,0.7)" : "rgba(0,0,0,0.7)", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            fontSize: "10px",
            whiteSpace: "nowrap"
          }}
        >
          🔴 Маркеры
        </button>
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          style={{ 
            padding: "6px 8px", 
            background: showDebug ? "rgba(0,255,0,0.7)" : "rgba(0,0,0,0.7)", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            fontSize: "10px",
            whiteSpace: "nowrap"
          }}
        >
          🐛 Debug
        </button>
        <button 
          onClick={toggleFullscreen}
          style={{ padding: "6px 8px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px", whiteSpace: "nowrap" }}
        >
          📱 Полный экран
        </button>
        </div>

        {/* Локальный статус поверх viewport */}
        <div id="status" style={{ 
          position: fullscreenMode ? "fixed" : "absolute", 
          top: 12, 
          left: "50%", 
          transform: "translateX(-50%)", 
          zIndex: 10000, 
          padding: "6px 10px", 
          borderRadius: 8, 
          background: "rgba(0,0,0,.5)", 
          color: "#fff", 
          fontSize: 12, 
          display: status ? "block" : "none" 
        }}>{status}</div>

        {/* Информация об объектах */}
        {started && (
          <div style={{ 
            position: fullscreenMode ? "fixed" : "absolute", 
            top: 60, 
            left: "50%", 
            transform: "translateX(-50%)", 
            zIndex: 10000, 
            padding: "8px 12px", 
            borderRadius: 8, 
            background: "rgba(0,0,0,0.7)", 
            color: "#fff", 
            fontSize: 11,
            minWidth: 200,
            textAlign: "center"
          }}>
            {AR_CONFIG.TARGETS.map(target => {
              const info = objectInfo[target.id];
              if (!info) return null;
              return (
                <div key={target.id} style={{ marginBottom: 6, fontSize: 10 }}>
                  <div style={{ color: info.inRange ? "#00ff00" : "#ff6666", fontWeight: "bold" }}>
                    {target.name}: {info.distance.toFixed(1)}м
                    {info.inRange && <span style={{ color: "#00ff00", marginLeft: 8 }}>✓</span>}
                  </div>
                  <div style={{ color: "#cccccc", fontSize: 9, marginTop: 2 }}>
                    {info.coordinates.lat.toFixed(6)}, {info.coordinates.lon.toFixed(6)}, {info.coordinates.alt.toFixed(1)}м
                  </div>
                </div>
              );
            })}
            {compassAngle !== null && (
              <div style={{
                position: "absolute",
                top: -40,
                left: "50%",
                transform: `translateX(-50%) rotate(${compassAngle}deg)`,
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "14px solid rgba(255,0,0,0.9)",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))"
              }} />
            )}
          </div>
        )}
      </div>
      
      {/* Отладочная панель */}
      {showDebug && (
        <div style={{ 
          position: fullscreenMode ? "fixed" : "absolute", 
          top: 120, 
          left: "10px", 
          right: "10px",
          zIndex: fullscreenMode ? 10000 : 9, 
          padding: "8px 12px", 
          borderRadius: 8, 
          background: "rgba(0,0,0,0.8)", 
          color: "#fff", 
          fontSize: 10,
          maxHeight: "200px",
          overflowY: "auto"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#00ff00" }}>
            🐛 Debug Info:
          </div>
          {debugInfo.map((info, index) => (
            <div key={index} style={{ marginBottom: "2px", fontSize: "9px", color: "#cccccc" }}>
              {info}
            </div>
          ))}
        </div>
      )}
      
      {/* Кнопка выхода из полного экрана */}
      {fullscreenMode && (
        <button 
          onClick={toggleFullscreen}
          style={{ 
            position: "fixed", 
            top: 20, 
            right: 20, 
            zIndex: 10001, 
            padding: "8px 12px", 
            background: "rgba(0,0,0,0.7)", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            fontSize: "12px"
          }}
        >
          ✕ Выход
        </button>
      )}
      {!fullscreenMode && started && (
        <button
          onClick={stopQuest}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10001,
            padding: "6px 10px",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 10,
            marginTop: 6
          }}
        >
          ✕ Закрыть квест
        </button>
      )}
    </div>
  );
}

export default ARQuest;


