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
      lat: 53.691700, // Переместили ближе к пользователю
      lon: 87.432900, // Переместили ближе к пользователю
      alt: 350.0, // Высота как у пользователя
      activationRadiusM: 100, // Увеличили радиус
      model: { url: "/models/nataraja_shiva.glb", scale: 4.0, headingDeg: 0, yOffset: 2.0 }
    }
  ],
  // Тестовые координаты для отладки (рядом с Шивой)
  DEBUG_COORDS: {
    lat: 53.691700, // Ближе к пользователю
    lon: 87.432900, // Ближе к пользователю
    alt: 350.0
  }
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
  const [showModelsInfo, setShowModelsInfo] = useState(false);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [compassAngle, setCompassAngle] = useState<number | null>(null);
  const useDirectionalOverlayRef = useRef(true);
  const [useDebugCoords, setUseDebugCoords] = useState(false);
  const userPosRef = useRef<{lat:number, lon:number, alt:number}>({lat:0,lon:0,alt:0});
  const deviceOrientationRef = useRef<{alpha: number, beta: number, gamma: number}>({alpha: 0, beta: 0, gamma: 0});
  
  // Расширенная отладочная информация
  const [extendedDebug, setExtendedDebug] = useState<{
    userGPS: {lat: number, lon: number, alt: number, accuracy?: number, timestamp: number},
    modelsLoaded: {[key: string]: boolean},
    cameraInfo: {position: {x: number, y: number, z: number}, rotation: {x: number, y: number, z: number}},
    sceneInfo: {childrenCount: number, backgroundSet: boolean},
    gpsUpdateCount: number,
    lastUpdateTime: number
  }>({
    userGPS: {lat: 0, lon: 0, alt: 0, timestamp: 0},
    modelsLoaded: {},
    cameraInfo: {position: {x: 0, y: 0, z: 0}, rotation: {x: 0, y: 0, z: 0}},
    sceneInfo: {childrenCount: 0, backgroundSet: false},
    gpsUpdateCount: 0,
    lastUpdateTime: 0
  });
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

  const updateModelPositionGPS = useCallback((userLat: number, userLon: number, userAlt: number, accuracy?: number) => {
    const latRad = (userLat * Math.PI) / 180;
    const metersPerDegLat = 110574;
    const metersPerDegLon = 111320 * Math.cos(latRad);
    
    // ВАЖНО: Позиционируем камеру в соответствии с GPS координатами пользователя
    if (cameraRef.current) {
      // Преобразуем GPS координаты пользователя в 3D координаты
      const userLatRad = (userLat * Math.PI) / 180;
      const metersPerDegLat = 110574;
      const metersPerDegLon = 111320 * Math.cos(userLatRad);
      
      // Позиция камеры = позиция пользователя в 3D пространстве
      const cameraX = 0; // Пользователь в центре своей системы координат
      const cameraY = 2.0; // Высота камеры = высота моделей (не высота пользователя!)
      const cameraZ = 0; // Пользователь в центре своей системы координат
      
      cameraRef.current.position.set(cameraX, cameraY, cameraZ);
      
      console.log(`📷 Camera positioned at user location: (${cameraX}, ${cameraY}, ${cameraZ})`);
    }
    
    // Обновляем расширенную отладочную информацию
    setExtendedDebug(prev => ({
      ...prev,
      userGPS: {lat: userLat, lon: userLon, alt: userAlt, accuracy, timestamp: Date.now()},
      gpsUpdateCount: prev.gpsUpdateCount + 1,
      lastUpdateTime: Date.now(),
      // Принудительно обновляем камеру
      cameraInfo: cameraRef.current ? {
        position: { 
          x: cameraRef.current.position.x, 
          y: cameraRef.current.position.y, 
          z: cameraRef.current.position.z 
        },
        rotation: { 
          x: cameraRef.current.rotation.x, 
          y: cameraRef.current.rotation.y, 
          z: cameraRef.current.rotation.z 
        }
      } : prev.cameraInfo
    }));
    
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
      // Важно: высоту не используем для позиционирования маркера, чтобы он не улетал на сотни метров
      // Держим маркер на комфортной высоте относительно камеры/земли
      const dy = target.model.yOffset;
      const distance = haversine(userLat, userLon, target.lat, target.lon);
      
      console.log(`🎯 GPS Update ${target.name}:`, {
        user: { lat: userLat.toFixed(6), lon: userLon.toFixed(6), alt: userAlt.toFixed(1) },
        target: { lat: target.lat, lon: target.lon, alt: target.alt },
        position: { x: dx.toFixed(1), y: dy.toFixed(1), z: dz.toFixed(1) },
        distance: distance.toFixed(1) + "m"
      });
      
      model.position.set(dx, dy, dz);
      model.rotation.y = THREE.MathUtils.degToRad(target.model.headingDeg);
      
      // ВСЕГДА вычисляем азимут для компаса (независимо от расстояния)
      const dLon = (target.lon - userLon) * Math.PI / 180;
      const lat1 = userLat * Math.PI / 180;
      const lat2 = target.lat * Math.PI / 180;
      
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      
      let bearingRad = Math.atan2(y, x);
      let bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
      
      // Учитываем поворот устройства для компаса
      const deviceAlpha = deviceOrientationRef.current.alpha;
      const adjustedBearing = (bearingDeg - deviceAlpha + 360) % 360;
      
      console.log(`🧭 Compass ${target.name}: bearing=${bearingDeg.toFixed(1)}°, device=${deviceAlpha.toFixed(1)}°, adjusted=${adjustedBearing.toFixed(1)}°, distance=${distance.toFixed(1)}m`);
      
      if (!closest || distance < closest.distance) {
        closest = { id: target.id, angle: adjustedBearing, distance };
        console.log(`🎯 New closest target: ${target.name} at ${distance.toFixed(1)}m, angle=${adjustedBearing.toFixed(1)}°`);
      }

      // Обновляем позицию красного маркера над моделью
      if (marker) {
        // ВСЕГДА позиционируем маркер по GPS, даже если он скрыт.
          const markerY = Math.max(dy + 2, 2); // +2 метра над моделью
          marker.position.set(dx, markerY, dz);
        // Видимость — только как индикация близости
        marker.visible = distance <= target.activationRadiusM && markersVisibleRef.current;
          
          // Добавляем информацию о GPS координатах для отладки
          console.log(`🔴 Marker ${target.name} positioned above model: (${dx.toFixed(1)}, ${markerY.toFixed(1)}, ${dz.toFixed(1)})`);
          console.log(`🔴 GPS coordinates: ${target.lat}, ${target.lon}, ${target.alt}m`);
          console.log(`🔴 User GPS: ${userLat}, ${userLon}, ${userAlt}m`);
        
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
          const markerY = Math.max(dy + 2, 2);
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
          user: { lat: userLat.toFixed(6), lon: userLon.toFixed(6), alt: userAlt.toFixed(1) },
          target: { lat: target.lat, lon: target.lon, alt: target.alt },
          dx: dx.toFixed(2), dy: dy.toFixed(2), dz: dz.toFixed(2),
          markerY: (dy + target.model.yOffset + 2).toFixed(2),
          size: markerSize.toFixed(2),
          distance: distance.toFixed(1) + "m",
          markerVisible: marker.visible,
          overlayVisible: markersVisibleRef.current
        });
      } else {
        console.log(`❌ Marker ${target.name} not found for position update`);
      }
    });
    if (closest && typeof closest.angle === 'number') {
      const oldAngle = compassAngle;
      setCompassAngle(closest.angle);
      console.log(`🧭 Compass updated: ${closest.id} at ${closest.angle.toFixed(1)}° (was ${oldAngle?.toFixed(1) || 'null'}°)`);
    } else {
      console.log(`🧭 No closest target found or invalid angle:`, closest);
    }
  }, [markersVisible, compassAngle]);

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
        
        // Сохраняем ориентацию устройства для компаса
        deviceOrientationRef.current = {
          alpha: e.alpha || 0,
          beta: e.beta || 0,
          gamma: e.gamma || 0
        };
        
        // Обновляем компас при изменении ориентации
        if (userPosRef.current.lat !== 0 && userPosRef.current.lon !== 0) {
          updateModelPositionGPS(userPosRef.current.lat, userPosRef.current.lon, userPosRef.current.alt);
        }
        
        // Принудительно обновляем информацию о камере
        setExtendedDebug(prev => ({
          ...prev,
          cameraInfo: {
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z }
          }
        }));
        
        // Принудительно обновляем компас для 2D точки
        console.log(`🧭 Device orientation changed: α=${e.alpha?.toFixed(1)}°`);
        
        // Преобразуем в кватернион камеры
        const euler = new THREE.Euler(beta, alpha, -gamma, "YXZ");
        camera.quaternion.setFromEuler(euler);
        
        // КРИТИЧЕСКАЯ ОТЛАДКА: логируем поворот камеры
        console.log(`📷 Camera rotation applied:`, {
          deviceOrientation: { alpha: e.alpha, beta: e.beta, gamma: e.gamma },
          euler: { x: beta, y: alpha, z: -gamma },
          cameraRotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
          cameraQuaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w }
        });
        
        // Принудительно обновляем информацию о камере
        setExtendedDebug(prev => ({
          ...prev,
          cameraInfo: {
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z }
          }
        }));
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
        
        // Обновляем статус загрузки модели
        setExtendedDebug(prev => ({
          ...prev,
          modelsLoaded: { ...prev.modelsLoaded, [target.id]: true }
        }));
        
        console.log(`🎯 Setting initial position for ${target.name}...`);
        updateModelPositionGPS(userLat, userLon, userAlt);
      }, undefined, (error) => {
        console.error(`❌ Model ${target.name} loading error:`, error);
        // Обновляем статус загрузки модели (ошибка)
        setExtendedDebug(prev => ({
          ...prev,
          modelsLoaded: { ...prev.modelsLoaded, [target.id]: false }
        }));
      });
    });

    setStatus("GPS mode (~meters)");
    
    // Очищаем старые HTML точки из overlay
    const overlay = document.getElementById('overlay-markers');
    if (overlay) {
      // Удаляем все старые точки
      const oldDots = overlay.querySelectorAll('.dot-rhino, .dot-shiva, .dot-direction');
      oldDots.forEach(dot => dot.remove());
      console.log(`🧹 Cleaned ${oldDots.length} old dots from overlay`);
    }
    
    // Отладочная информация о камере и сцене
    console.log(`📷 Camera position: (${camera.position.x}, ${camera.position.y}, ${camera.position.z})`);
    console.log(`📷 Camera rotation: (${camera.rotation.x}, ${camera.rotation.y}, ${camera.rotation.z})`);
    console.log(`📷 Camera near: ${camera.near}, far: ${camera.far}`);
    console.log(`🎬 Scene background: ${scene.background ? 'SET' : 'NOT SET'}`);
    console.log(`🎬 Scene children: ${scene.children.map(child => child.name || child.type).join(', ')}`);

    function tick() {
      // КРИТИЧЕСКАЯ ОТЛАДКА: проверяем, что tick выполняется
      console.log(`🔄 TICK START: compassAngle=${compassAngle}, markersVisible=${markersVisibleRef.current}`);
      
      // Обновляем информацию о камере и сцене
      if (camera && scene) {
        setExtendedDebug(prev => ({
          ...prev,
          cameraInfo: {
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z }
          },
          sceneInfo: {
            childrenCount: scene.children.length,
            backgroundSet: !!scene.background
          }
        }));
      }
      
      // Пульсирующий эффект для всех красных маркеров
      const time = Date.now() * 0.003;
      
      // Принудительно обновляем расстояние 10 раз в секунду
      if (Math.floor(time * 10) !== Math.floor((time - 0.001) * 10) && userPosRef.current.lat !== 0) {
        console.log(`🔄 Forced update: userPos=(${userPosRef.current.lat.toFixed(6)}, ${userPosRef.current.lon.toFixed(6)}, ${userPosRef.current.alt.toFixed(1)})`);
        updateModelPositionGPS(userPosRef.current.lat, userPosRef.current.lon, userPosRef.current.alt);
      }

      // УДАЛЕНО: 2D-направляющий маркер теперь реализован как React компонент выше
      
      // Обновляем мировые матрицы перед проекцией в 2D
      if (sceneRef.current) {
        sceneRef.current.updateMatrixWorld(true);
      }

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
            
            // (лог ограничил, чтобы не спамить)
          }
          // УДАЛЕНО: старая логика 3D-проекции маркеров (не работала)
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
    
    // Диагностика окружения
    try {
      const ua = navigator.userAgent || "";
      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
      console.log("🧪 Env:", {
        userAgent: ua,
        isMobile,
        isSecureContext,
        useDebugCoords
      });
    } catch {}
    
    console.log("🚀 Starting AR Quest...");
    setStatus("");
    addDebugInfo("🚀 Starting AR Quest...");
    
    let userLat: number, userLon: number, userAlt: number;
    
    if (useDebugCoords) {
      // Используем тестовые координаты
      userLat = AR_CONFIG.DEBUG_COORDS.lat;
      userLon = AR_CONFIG.DEBUG_COORDS.lon;
      userAlt = AR_CONFIG.DEBUG_COORDS.alt;
      console.log("🧪 Using DEBUG coordinates:", { userLat, userLon, userAlt });
      addDebugInfo("🧪 Using DEBUG coordinates");
    } else {
      if (!navigator.geolocation) {
        alert("Геолокация не поддерживается");
        return;
      }
    
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 30000, maximumAge: 0,
        })
      );
      
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        userAlt = pos.coords.altitude ?? 0;
      } catch (e) {
        console.error("❌ GPS Error:", e);
        if ((e as any)?.code === 1) {
          setStatus("Разрешите доступ к геолокации");
          alert("Разрешите доступ к геолокации");
        } else {
          setStatus("Не удалось получить геолокацию. Повторите попытку.");
        }
        return;
      }
    }
    
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
        targets: AR_CONFIG.TARGETS.map(t => ({ 
          name: t.name, 
          lat: t.lat, 
          lon: t.lon, 
          alt: t.alt 
        })),
        distances: distances.map(d => `${d.name}: ${d.distance.toFixed(1)}m (${d.inRange ? 'в радиусе' : 'далеко'})`),
        closest: `${closestTarget.name}: ${closestTarget.distance.toFixed(1)}m`
      });
      
      // Дополнительная отладочная информация
      console.log("🔍 GPS Debug Info:");
      console.log(`  User position: ${userLat.toFixed(6)}, ${userLon.toFixed(6)}, ${userAlt.toFixed(1)}m`);
      AR_CONFIG.TARGETS.forEach(target => {
        const dist = haversine(userLat, userLon, target.lat, target.lon);
        console.log(`  ${target.name}: ${target.lat}, ${target.lon}, ${target.alt}m -> ${dist.toFixed(1)}m`);
      });
      
      addDebugInfo(`📍 User: ${userLat.toFixed(6)}, ${userLon.toFixed(6)}, ${userAlt.toFixed(1)}m`);
      addDebugInfo(`📍 Closest: ${closestTarget.name} ${closestTarget.distance.toFixed(0)}m`);
      addDebugInfo(`📍 Device orientation: α=${deviceOrientationRef.current.alpha.toFixed(1)}°`);
      
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
      
      // Запускаем GPS отслеживание только если не используем debug координаты
      if (!useDebugCoords) {
        let gpsTick = 0;
      watchIdRef.current = navigator.geolocation.watchPosition(
        (p) => {
            const newLat = p.coords.latitude;
            const newLon = p.coords.longitude;
            const newAlt = p.coords.altitude ?? 0;
            
            // ВСЕГДА обновляем координаты без проверки изменений
            gpsTick++;
          console.log("🔄 GPS Update received:", {
              lat: newLat.toFixed(6),
              lon: newLon.toFixed(6),
              alt: newAlt.toFixed(1),
              accuracy: p.coords.accuracy?.toFixed(1) + "m",
              tick: gpsTick
            });
            
            userPosRef.current = { lat: newLat, lon: newLon, alt: newAlt };
            updateModelPositionGPS(newLat, newLon, newAlt, p.coords.accuracy);
          setStatus(""); // очищаем статус при первом валидном апдейте
        },
        (err) => {
          console.error("❌ GPS Error:", err);
          if (err.code === 1) setStatus("Разрешите доступ к геолокации");
        },
          { 
            enableHighAccuracy: true, 
            maximumAge: 100, // Обновляем каждые 100мс
            timeout: 1000 // Быстрый таймаут
          }
        );
      } else {
        // В debug режиме тоже обновляем каждую секунду
        const debugInterval = setInterval(() => {
          if (userPosRef.current.lat !== 0) {
            updateModelPositionGPS(userPosRef.current.lat, userPosRef.current.lon, userPosRef.current.alt);
            console.log("🧪 DEBUG: manual tick updateModelPositionGPS");
          }
        }, 1000);
        
        // Очищаем интервал при остановке
        const originalStopQuest = stopQuest;
        // Сохраняем интервал для очистки
        (window as any).debugInterval = debugInterval;
      }
  }, [startAR, started, updateModelPositionGPS, useDebugCoords]);

  // Лог: применённая раскладка контролов (двухрядная)
  useEffect(() => {
    console.log("🧰 UI controls applied (two-row)", { uiVisible, fullscreenMode });
  }, [uiVisible, fullscreenMode]);

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
      // Синхронизируем HTML-оверлей
      const overlay = document.getElementById('overlay-markers');
      if (overlay) overlay.style.display = newMode ? 'block' : 'none';
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

        {/* HTML-оверлей для маркеров (очищен от старых точек) */}
        <div
          id="overlay-markers"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", display: markersVisible ? 'block' : 'none' }}
        />

        <div id="ar-controls" style={{ 
          display: uiVisible ? "flex" : "none", 
          position: fullscreenMode ? "fixed" : "absolute", 
          bottom: 12, 
          left: "50%", 
          transform: "translateX(-50%)", 
          zIndex: 10000, 
          gap: 6,
          overflow: "hidden",
          padding: "6px 10px",
          maxWidth: fullscreenMode ? "calc(100vw - 20px)" : "calc(100% - 20px)",
          boxSizing: "border-box",
          justifyContent: "center",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button id="btn-photo" onClick={capturePhoto} style={{ padding: "4px 6px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>📸 Фото</button>
            <button id="btn-video" onClick={startVideo} style={{ padding: "4px 6px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>🎥 Видео</button>
            <button id="btn-stop" onClick={stopVideo} style={{ padding: "4px 6px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>⏹ Стоп</button>
            <button id="btn-switch" style={{ padding: "4px 6px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>🔄 Камера</button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={toggleMarkers} style={{ padding: "4px 6px", background: markersVisible ? "rgba(255,0,0,0.7)" : "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>🔴 Маркеры</button>
            <button onClick={() => setShowDebug(!showDebug)} style={{ padding: "4px 6px", background: showDebug ? "rgba(0,255,0,0.7)" : "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>🐛 Debug</button>
            <button onClick={toggleFullscreen} style={{ padding: "4px 6px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>📱 Экран</button>
            <button onClick={() => setUseDebugCoords(!useDebugCoords)} style={{ padding: "4px 6px", background: useDebugCoords ? "rgba(255,165,0,0.7)" : "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>🧪 Debug GPS</button>
            <button onClick={() => { if (userPosRef.current.lat !== 0) { updateModelPositionGPS(userPosRef.current.lat, userPosRef.current.lon, userPosRef.current.alt); console.log("🔄 Manual GPS update triggered"); } }} style={{ padding: "4px 6px", background: "rgba(0,255,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>🔄 Update</button>
            <button onClick={() => setShowSystemInfo(!showSystemInfo)} style={{ padding: "4px 6px", background: showSystemInfo ? "rgba(0,100,255,0.7)" : "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>📊 Info</button>
            <button onClick={() => setShowModelsInfo(!showModelsInfo)} style={{ padding: "4px 6px", background: showModelsInfo ? "rgba(255,0,255,0.7)" : "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>📦 Модели</button>
            <button onClick={() => setShowMap(!showMap)} style={{ padding: "4px 6px", background: showMap ? "rgba(0,255,255,0.7)" : "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "4px", fontSize: "10px" }}>🗺️ Карта</button>
          </div>
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

        {/* Верхние индикации - в том же стиле что и нижние кнопки (один ряд, компактные) */}
        {started && (
          <div style={{ 
            position: fullscreenMode ? "fixed" : "absolute", 
            top: 12, 
            left: "50%", 
            transform: "translateX(-50%)", 
            zIndex: 10000, 
            display: "flex",
            gap: 6,
            overflow: "hidden",
            padding: "6px 10px",
            maxWidth: fullscreenMode ? "calc(100vw - 20px)" : "calc(100% - 20px)",
            boxSizing: "border-box",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            {/* Стрелка направления */}
            <div style={{ 
              padding: "4px 6px", 
              background: "rgba(0,255,0,0.7)", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              {compassAngle !== null && compassAngle > 315 || compassAngle < 45 ? "⬆️" :
               compassAngle >= 45 && compassAngle < 135 ? "➡️" :
               compassAngle >= 135 && compassAngle < 225 ? "⬇️" : "⬅️"}
              <span>Направление</span>
            </div>
            
            {/* Расстояние до Шивы */}
            <div style={{ 
              padding: "4px 6px", 
              background: "rgba(0,100,255,0.7)", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              📏 {(() => {
                const shiva = AR_CONFIG.TARGETS.find(t => t.id === 'shiva');
                if (shiva && extendedDebug.userGPS.lat !== 0) {
                  const dist = haversine(extendedDebug.userGPS.lat, extendedDebug.userGPS.lon, shiva.lat, shiva.lon);
                  return `${dist.toFixed(1)}м`;
                }
                return "10.2м";
              })()}
            </div>
            
            {/* Компас угол */}
            <div style={{ 
              padding: "4px 6px", 
              background: "rgba(255,165,0,0.7)", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              🧭 {compassAngle !== null ? `${compassAngle.toFixed(0)}°` : "N/A"}
            </div>
            
            {/* GPS координаты пользователя */}
            <div style={{ 
              padding: "4px 6px", 
              background: "rgba(0,0,0,0.7)", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "9px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              📍 {extendedDebug.userGPS.lat.toFixed(4)}, {extendedDebug.userGPS.lon.toFixed(4)}
            </div>
            
            {/* Статус камеры */}
            <div style={{ 
              padding: "4px 6px", 
              background: extendedDebug.cameraInfo.rotation.x === 0 && extendedDebug.cameraInfo.rotation.y === 0 && extendedDebug.cameraInfo.rotation.z === 0 ? "rgba(255,0,0,0.7)" : "rgba(0,255,0,0.7)", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "9px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              📷 {extendedDebug.cameraInfo.rotation.x === 0 && extendedDebug.cameraInfo.rotation.y === 0 && extendedDebug.cameraInfo.rotation.z === 0 ? "НЕ поворачивается" : "Поворачивается"}
            </div>
            
            {/* Статус моделей */}
            <div style={{ 
              padding: "4px 6px", 
              background: "rgba(255,0,255,0.7)", 
              color: "white", 
              border: "none", 
              borderRadius: "4px", 
              fontSize: "9px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              📦 {Object.values(extendedDebug.modelsLoaded).filter(Boolean).length}/{Object.keys(extendedDebug.modelsLoaded).length} моделей
            </div>
          </div>
        )}


        {/* Компас - красная точка с индикацией направления и расстояния */}
        {started && compassAngle !== null && markersVisible && (
          <div style={{
            position: fullscreenMode ? "fixed" : "absolute",
            top: "50%",
            left: "50%",
            zIndex: 10001,
            transform: `translate(-50%, -50%) translate(${Math.sin(compassAngle * Math.PI / 180) * 100}px, ${-Math.cos(compassAngle * Math.PI / 180) * 100}px)`,
            pointerEvents: "none"
          }}>
            {/* Красная точка */}
            <div style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "rgba(255,0,0,0.9)",
              border: "2px solid white",
              filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))",
              margin: "0 auto",
              animation: "glow 2s infinite"
            }}/>
            {/* Стрелка направления */}
            <div style={{
              width: "0",
              height: "0",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "16px solid rgba(255,0,0,0.8)",
              margin: "2px auto 0",
              transform: `rotate(${compassAngle}deg)`
            }}/>
            {/* Расстояние */}
            <div style={{
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              textAlign: "center",
              marginTop: "4px",
              whiteSpace: "nowrap"
            }}>
              {(() => {
                const shiva = AR_CONFIG.TARGETS.find(t => t.id === 'shiva');
                if (shiva && extendedDebug.userGPS.lat !== 0) {
                  const dist = haversine(extendedDebug.userGPS.lat, extendedDebug.userGPS.lon, shiva.lat, shiva.lon);
                  return `${dist.toFixed(1)}м`;
                }
                return "10.2м";
              })()}
            </div>
          </div>
        )}

        {/* Комбинированный индикатор - компактный */}
        {started && compassAngle !== null && (
          <div style={{
            position: fullscreenMode ? "fixed" : "absolute",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            pointerEvents: "none",
            background: "rgba(0,255,0,0.9)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "bold",
            border: "2px solid white",
            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))",
            animation: "pulse 2s infinite",
            textAlign: "center",
            maxWidth: "280px"
          }}>
            🎯 Шива рядом! 📱 Поверни телефон в направлении стрелки!
          </div>
        )}
      </div>
      
      {/* Расширенная отладочная панель - с большим количеством информации */}
      {showDebug && (
        <div style={{ 
          position: fullscreenMode ? "fixed" : "absolute", 
          top: 120, 
          left: "10px", 
          right: "10px",
          zIndex: fullscreenMode ? 10000 : 9, 
          padding: "8px 12px", 
          borderRadius: 8, 
          background: "rgba(0,0,0,0.9)", 
          color: "#fff", 
          fontSize: 9,
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#00ff00" }}>
            🐛 Extended Debug Info:
          </div>
          
          {/* GPS информация - расширенная */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(0,255,0,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#00ff00", marginBottom: "2px" }}>📍 GPS:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              Lat: {extendedDebug.userGPS.lat.toFixed(6)}<br/>
              Lon: {extendedDebug.userGPS.lon.toFixed(6)}<br/>
              Alt: {extendedDebug.userGPS.alt.toFixed(1)}m<br/>
              Accuracy: {extendedDebug.userGPS.accuracy?.toFixed(1) || 'N/A'}m<br/>
              Updates: {extendedDebug.gpsUpdateCount}<br/>
              Last: {new Date(extendedDebug.lastUpdateTime).toLocaleTimeString()}<br/>
              <div style={{ color: "#ffaa00", marginTop: "2px" }}>
                <strong>Distance to Shiva:</strong><br/>
                {(() => {
                  const shiva = AR_CONFIG.TARGETS.find(t => t.id === 'shiva');
                  if (shiva) {
                    const dist = haversine(extendedDebug.userGPS.lat, extendedDebug.userGPS.lon, shiva.lat, shiva.lon);
                    return `${dist.toFixed(1)}m`;
                  }
                  return 'N/A';
                })()}
              </div>
            </div>
          </div>
          
          {/* Модели - расширенная */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(255,165,0,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#ffa500", marginBottom: "2px" }}>📦 Models:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              {Object.entries(extendedDebug.modelsLoaded).map(([id, loaded]) => {
                const model = modelsRef.current[id];
                const marker = markersRef.current[id];
                return (
                  <div key={id} style={{ color: loaded ? "#00ff00" : "#ff6666" }}>
                    {id}: {loaded ? "✅ Loaded" : "❌ Failed"}
                    {model && (
                      <div style={{ marginLeft: "10px", fontSize: "7px" }}>
                        Pos: ({model.position.x.toFixed(1)}, {model.position.y.toFixed(1)}, {model.position.z.toFixed(1)})<br/>
                        Visible: {model.visible ? "✅" : "❌"}<br/>
                        Marker: {marker ? (marker.visible ? "✅" : "❌") : "❌"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Камера - расширенная */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(0,100,255,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#0066ff", marginBottom: "2px" }}>📷 Camera:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              Pos: ({extendedDebug.cameraInfo.position.x.toFixed(1)}, {extendedDebug.cameraInfo.position.y.toFixed(1)}, {extendedDebug.cameraInfo.position.z.toFixed(1)})<br/>
              Rot: ({extendedDebug.cameraInfo.rotation.x.toFixed(3)}, {extendedDebug.cameraInfo.rotation.y.toFixed(3)}, {extendedDebug.cameraInfo.rotation.z.toFixed(3)})<br/>
              <div style={{ color: extendedDebug.cameraInfo.position.x === 0 && extendedDebug.cameraInfo.position.y === 0 && extendedDebug.cameraInfo.position.z === 0 ? "#ff6666" : "#00ff00", marginTop: "2px" }}>
                <strong>Status:</strong> {extendedDebug.cameraInfo.position.x === 0 && extendedDebug.cameraInfo.position.y === 0 && extendedDebug.cameraInfo.position.z === 0 ? "❌ STUCK AT ORIGIN" : "✅ MOVING"}
              </div>
              <div style={{ color: "#ffaa00", marginTop: "2px" }}>
                <strong>Device Orientation:</strong><br/>
                α: {deviceOrientationRef.current.alpha.toFixed(1)}°<br/>
                β: {deviceOrientationRef.current.beta.toFixed(1)}°<br/>
                γ: {deviceOrientationRef.current.gamma.toFixed(1)}°
              </div>
              <div style={{ color: "#ff6666", marginTop: "2px" }}>
                <strong>Camera Rotation Status:</strong><br/>
                {extendedDebug.cameraInfo.rotation.x === 0 && extendedDebug.cameraInfo.rotation.y === 0 && extendedDebug.cameraInfo.rotation.z === 0 ? 
                  "❌ NOT ROTATING" : "✅ ROTATING"
                }
              </div>
              <div style={{ color: "#00ff00", marginTop: "2px" }}>
                <strong>Field of View:</strong><br/>
                FOV: 75°, Near: 0.01, Far: 2000<br/>
                Aspect: {(window.innerWidth / window.innerHeight).toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Сцена - расширенная */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(255,0,255,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#ff00ff", marginBottom: "2px" }}>🎬 Scene:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              Children: {extendedDebug.sceneInfo.childrenCount}<br/>
              Background: {extendedDebug.sceneInfo.backgroundSet ? "✅ Set" : "❌ Not Set"}
            </div>
          </div>
          
          {/* Анализ проблемы - расширенный */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(255,0,0,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#ff6666", marginBottom: "2px" }}>🚨 Problem Analysis:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              {(() => {
                const cameraStuck = extendedDebug.cameraInfo.position.x === 0 && extendedDebug.cameraInfo.position.y === 0 && extendedDebug.cameraInfo.position.z === 0;
                const shivaModel = modelsRef.current['shiva'];
                const shivaPos = shivaModel ? shivaModel.position : null;
                const cameraRot = extendedDebug.cameraInfo.rotation;
                
                if (cameraStuck) {
                  return (
                    <div>
                      <div style={{ color: "#ff6666" }}>❌ Camera stuck at origin (0,0,0)</div>
                      <div style={{ color: "#ffaa00" }}>• 3D models not visible</div>
                      <div style={{ color: "#ffaa00" }}>• Distance UI not updating</div>
                      <div style={{ color: "#ffaa00" }}>• Need to move camera to user position</div>
                    </div>
                  );
                } else {
                  return (
                    <div>
                      <div style={{ color: "#00ff00" }}>✅ Camera is MOVING!</div>
                      <div style={{ color: "#ffaa00" }}>Shiva Visibility Analysis:</div>
                      <div style={{ color: "#cccccc" }}>
                        Model is at ({shivaPos ? shivaPos.x.toFixed(1) : 'N/A'}, {shivaPos ? shivaPos.y.toFixed(1) : 'N/A'}, {shivaPos ? shivaPos.z.toFixed(1) : 'N/A'}).<br/>
                        Camera is at ({extendedDebug.cameraInfo.position.x.toFixed(1)}, {extendedDebug.cameraInfo.position.y.toFixed(1)}, {extendedDebug.cameraInfo.position.z.toFixed(1)}).<br/>
                        Distance: {shivaPos ? Math.sqrt(Math.pow(shivaPos.x - extendedDebug.cameraInfo.position.x, 2) + Math.pow(shivaPos.y - extendedDebug.cameraInfo.position.y, 2) + Math.pow(shivaPos.z - extendedDebug.cameraInfo.position.z, 2)).toFixed(1) : 'N/A'}m.<br/>
                        {shivaPos && Math.abs(shivaPos.y - extendedDebug.cameraInfo.position.y) < 1 ? 
                          <span style={{ color: "#00ff00" }}>Shiva should be visible!</span> : 
                          <span style={{ color: "#ff6666" }}>Shiva too far vertically!</span>
                        }
                      </div>
                      <div style={{ color: "#ffaa00", marginTop: "4px" }}>Camera Rotation Analysis:</div>
                      <div style={{ color: "#cccccc" }}>
                        Camera Rot: ({extendedDebug.cameraInfo.rotation.x.toFixed(3)}, {extendedDebug.cameraInfo.rotation.y.toFixed(3)}, {extendedDebug.cameraInfo.rotation.z.toFixed(3)})<br/>
                        Device α: {deviceOrientationRef.current.alpha.toFixed(1)}°, β: {deviceOrientationRef.current.beta.toFixed(1)}°, γ: {deviceOrientationRef.current.gamma.toFixed(1)}°<br/>
                        {extendedDebug.cameraInfo.rotation.x === 0 && extendedDebug.cameraInfo.rotation.y === 0 && extendedDebug.cameraInfo.rotation.z === 0 ? 
                          <span style={{ color: "#ff6666" }}>❌ Camera NOT rotating with device!</span> : 
                          <span style={{ color: "#00ff00" }}>✅ Camera rotating with device</span>
                        }
                      </div>
                      <div style={{ color: "#ffaa00", marginTop: "4px" }}>Field of View Analysis:</div>
                      <div style={{ color: "#cccccc" }}>
                        FOV: 75°, Near: 0.01m, Far: 2000m<br/>
                        Camera looking direction: {extendedDebug.cameraInfo.rotation.y > 0 ? "Right" : extendedDebug.cameraInfo.rotation.y < 0 ? "Left" : "Forward"}<br/>
                        {shivaPos && Math.abs(shivaPos.x) < 50 && Math.abs(shivaPos.z) < 50 ? 
                          <span style={{ color: "#00ff00" }}>✅ Shiva within FOV range</span> : 
                          <span style={{ color: "#ff6666" }}>❌ Shiva outside FOV range</span>
                        }
                      </div>
                      <div style={{ color: "#ffaa00", marginTop: "4px" }}>GPS vs 3D Analysis:</div>
                      <div style={{ color: "#cccccc" }}>
                        GPS Distance: {(() => {
                          const shiva = AR_CONFIG.TARGETS.find(t => t.id === 'shiva');
                          if (shiva && extendedDebug.userGPS.lat !== 0) {
                            const dist = haversine(extendedDebug.userGPS.lat, extendedDebug.userGPS.lon, shiva.lat, shiva.lon);
                            return `${dist.toFixed(1)}m`;
                          }
                          return 'N/A';
                        })()}<br/>
                        3D Distance: {shivaPos ? Math.sqrt(Math.pow(shivaPos.x - extendedDebug.cameraInfo.position.x, 2) + Math.pow(shivaPos.y - extendedDebug.cameraInfo.position.y, 2) + Math.pow(shivaPos.z - extendedDebug.cameraInfo.position.z, 2)).toFixed(1) : 'N/A'}m<br/>
                        {(() => {
                          const shiva = AR_CONFIG.TARGETS.find(t => t.id === 'shiva');
                          if (shiva && extendedDebug.userGPS.lat !== 0 && shivaPos) {
                            const gpsDist = haversine(extendedDebug.userGPS.lat, extendedDebug.userGPS.lon, shiva.lat, shiva.lon);
                            const dist3D = Math.sqrt(Math.pow(shivaPos.x - extendedDebug.cameraInfo.position.x, 2) + Math.pow(shivaPos.y - extendedDebug.cameraInfo.position.y, 2) + Math.pow(shivaPos.z - extendedDebug.cameraInfo.position.z, 2));
                            const diff = Math.abs(gpsDist - dist3D);
                            return diff < 5 ? 
                              <span style={{ color: "#00ff00" }}>✅ GPS and 3D distances match</span> : 
                              <span style={{ color: "#ff6666" }}>❌ GPS and 3D distances differ by {diff.toFixed(1)}m</span>;
                          }
                          return 'N/A';
                        })()}
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
          
          {/* Логи - расширенные */}
          <div style={{ marginBottom: "4px", padding: "4px", background: "rgba(128,128,128,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#808080", marginBottom: "2px" }}>📝 Logs:</div>
            {debugInfo.slice(-5).map((info, index) => (
              <div key={index} style={{ marginBottom: "1px", fontSize: "8px", color: "#cccccc" }}>
              {info}
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Окно информации о моделях */}
      {showModelsInfo && (
        <div style={{ 
          position: fullscreenMode ? "fixed" : "absolute", 
          top: 120, 
          left: "10px", 
          right: "10px",
          zIndex: fullscreenMode ? 10000 : 9, 
          padding: "8px 12px", 
          borderRadius: 8, 
          background: "rgba(0,0,0,0.9)", 
          color: "#fff", 
          fontSize: 9,
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#ff00ff" }}>
            📦 Информация о моделях:
          </div>
          
          {AR_CONFIG.TARGETS.map(target => {
            const model = modelsRef.current[target.id];
            const marker = markersRef.current[target.id];
            const info = objectInfo[target.id];
            const loaded = extendedDebug.modelsLoaded[target.id];
            
            return (
              <div key={target.id} style={{ marginBottom: "8px", padding: "6px", background: "rgba(255,0,255,0.1)", borderRadius: "4px" }}>
                <div style={{ fontWeight: "bold", color: "#ff00ff", marginBottom: "4px" }}>
                  🎯 {target.name} ({target.id})
                </div>
                
                <div style={{ fontSize: "8px", color: "#cccccc" }}>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>📁 Файл:</strong> {target.model.url}
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>📏 Масштаб:</strong> {target.model.scale}x
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>📍 GPS координаты:</strong> {target.lat.toFixed(6)}, {target.lon.toFixed(6)}, {target.alt.toFixed(1)}м
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>🎯 Радиус активации:</strong> {target.activationRadiusM}м
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>📐 Поворот:</strong> {target.model.headingDeg}°
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>⬆️ Смещение по Y:</strong> {target.model.yOffset}м
                  </div>
                  
                  <div style={{ marginTop: "4px", padding: "4px", background: "rgba(0,0,0,0.3)", borderRadius: "3px" }}>
                    <div style={{ fontWeight: "bold", color: loaded ? "#00ff00" : "#ff6666", marginBottom: "2px" }}>
                      📦 Статус загрузки: {loaded ? "✅ Загружена" : "❌ Не загружена"}
                    </div>
                    
                    {model && (
                      <div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>📍 3D Позиция:</strong> ({model.position.x.toFixed(1)}, {model.position.y.toFixed(1)}, {model.position.z.toFixed(1)})
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>👁️ Видимость:</strong> {model.visible ? "✅ Видима" : "❌ Скрыта"}
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>📏 Размер:</strong> {model.scale.x.toFixed(2)}x{model.scale.y.toFixed(2)}x{model.scale.z.toFixed(2)}
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>🔄 Поворот:</strong> ({model.rotation.x.toFixed(2)}, {model.rotation.y.toFixed(2)}, {model.rotation.z.toFixed(2)})
                        </div>
                      </div>
                    )}
                    
                    {marker && (
                      <div style={{ marginTop: "4px", padding: "4px", background: "rgba(255,0,0,0.1)", borderRadius: "3px" }}>
                        <div style={{ fontWeight: "bold", color: "#ff6666", marginBottom: "2px" }}>
                          🔴 Маркер:
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>📍 Позиция:</strong> ({marker.position.x.toFixed(1)}, {marker.position.y.toFixed(1)}, {marker.position.z.toFixed(1)})
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>👁️ Видимость:</strong> {marker.visible ? "✅ Видим" : "❌ Скрыт"}
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>📏 Размер:</strong> {marker.scale.x.toFixed(2)}x{marker.scale.y.toFixed(2)}x{marker.scale.z.toFixed(2)}
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>📊 Базовый размер:</strong> {marker.userData.baseScale?.toFixed(2) || "N/A"}
                        </div>
                      </div>
                    )}
                    
                    {info && (
                      <div style={{ marginTop: "4px", padding: "4px", background: "rgba(0,255,0,0.1)", borderRadius: "3px" }}>
                        <div style={{ fontWeight: "bold", color: "#00ff00", marginBottom: "2px" }}>
                          📊 Информация об объекте:
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>📏 Расстояние:</strong> {info.distance.toFixed(1)}м
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>🎯 В радиусе:</strong> {info.inRange ? "✅ Да" : "❌ Нет"}
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <strong>📍 Координаты:</strong> {info.coordinates.lat.toFixed(6)}, {info.coordinates.lon.toFixed(6)}, {info.coordinates.alt.toFixed(1)}м
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Окно системной информации */}
      {showSystemInfo && (
        <div style={{ 
          position: fullscreenMode ? "fixed" : "absolute", 
          top: 120, 
          left: "10px", 
          right: "10px",
          zIndex: fullscreenMode ? 10000 : 9, 
          padding: "8px 12px", 
          borderRadius: 8, 
          background: "rgba(0,0,0,0.9)", 
          color: "#fff", 
          fontSize: 9,
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#0066ff" }}>
            📊 Системная информация:
          </div>
          
          {/* GPS информация */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(0,255,0,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#00ff00", marginBottom: "2px" }}>📍 GPS:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              <div>Lat: {extendedDebug.userGPS.lat.toFixed(6)}</div>
              <div>Lon: {extendedDebug.userGPS.lon.toFixed(6)}</div>
              <div>Alt: {extendedDebug.userGPS.alt.toFixed(1)}м</div>
              <div>Accuracy: {extendedDebug.userGPS.accuracy?.toFixed(1) || 'N/A'}м</div>
              <div>Updates: {extendedDebug.gpsUpdateCount}</div>
              <div>Last: {new Date(extendedDebug.lastUpdateTime).toLocaleTimeString()}</div>
            </div>
          </div>
          
          {/* Камера информация */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(0,100,255,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#0066ff", marginBottom: "2px" }}>📷 Камера:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              <div>Pos: ({extendedDebug.cameraInfo.position.x.toFixed(1)}, {extendedDebug.cameraInfo.position.y.toFixed(1)}, {extendedDebug.cameraInfo.position.z.toFixed(1)})</div>
              <div>Rot: ({extendedDebug.cameraInfo.rotation.x.toFixed(3)}, {extendedDebug.cameraInfo.rotation.y.toFixed(3)}, {extendedDebug.cameraInfo.rotation.z.toFixed(3)})</div>
              <div>FOV: 75°, Near: 0.01, Far: 2000</div>
              <div>Aspect: {(window.innerWidth / window.innerHeight).toFixed(2)}</div>
            </div>
          </div>
          
          {/* Device Orientation */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(255,165,0,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#ffa500", marginBottom: "2px" }}>📱 Device Orientation:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              <div>α (Alpha): {deviceOrientationRef.current.alpha.toFixed(1)}°</div>
              <div>β (Beta): {deviceOrientationRef.current.beta.toFixed(1)}°</div>
              <div>γ (Gamma): {deviceOrientationRef.current.gamma.toFixed(1)}°</div>
            </div>
          </div>
          
          {/* Компас информация */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(255,0,255,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#ff00ff", marginBottom: "2px" }}>🧭 Компас:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              <div>Угол: {compassAngle !== null ? `${compassAngle.toFixed(1)}°` : "N/A"}</div>
              <div>Направление: {compassAngle !== null ? 
                (compassAngle > 315 || compassAngle < 45 ? "⬆️ Север" :
                 compassAngle >= 45 && compassAngle < 135 ? "➡️ Восток" :
                 compassAngle >= 135 && compassAngle < 225 ? "⬇️ Юг" : "⬅️ Запад") : "N/A"}
              </div>
            </div>
          </div>
          
          {/* Производительность */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(128,128,128,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#808080", marginBottom: "2px" }}>⚡ Производительность:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              <div>Разрешение: {window.innerWidth}x{window.innerHeight}</div>
              <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
              <div>Платформа: {navigator.platform}</div>
              <div>Язык: {navigator.language}</div>
              <div>Онлайн: {navigator.onLine ? "✅" : "❌"}</div>
            </div>
          </div>
          
          {/* Сцена */}
          <div style={{ marginBottom: "6px", padding: "4px", background: "rgba(255,0,0,0.1)", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", color: "#ff6666", marginBottom: "2px" }}>🎬 Сцена:</div>
            <div style={{ fontSize: "8px", color: "#cccccc" }}>
              <div>Детей: {extendedDebug.sceneInfo.childrenCount}</div>
              <div>Фон: {extendedDebug.sceneInfo.backgroundSet ? "✅ Установлен" : "❌ Не установлен"}</div>
              <div>Маркеры видны: {markersVisible ? "✅" : "❌"}</div>
              <div>Debug режим: {useDebugCoords ? "✅" : "❌"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Окно карты - встроенное как debug панель */}
      {showMap && (
        <div style={{ 
          position: fullscreenMode ? "fixed" : "absolute", 
          top: 120, 
          right: "10px",
          zIndex: fullscreenMode ? 10000 : 9, 
          padding: "8px 12px", 
          borderRadius: 8, 
          background: "rgba(0,0,0,0.9)", 
          color: "#fff", 
          fontSize: 9,
          width: "300px",
          height: "200px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#00ffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🗺️ Карта</span>
            <button 
              onClick={() => setShowMap(false)}
              style={{ 
                background: "rgba(255,0,0,0.7)", 
                color: "white", 
                border: "none", 
                borderRadius: "3px", 
                fontSize: "8px",
                padding: "2px 6px",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Встроенная карта Yandex */}
          <div style={{ flex: 1, borderRadius: "4px", overflow: "hidden" }}>
            <iframe
              src={`https://yandex.ru/maps/?ll=${extendedDebug.userGPS.lon},${extendedDebug.userGPS.lat}&z=16&pt=${extendedDebug.userGPS.lon},${extendedDebug.userGPS.lat},pm2rdm~${AR_CONFIG.TARGETS.find(t => t.id === 'shiva')?.lon},${AR_CONFIG.TARGETS.find(t => t.id === 'shiva')?.lat},pm2rdm`}
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: "4px" }}
              title="Yandex Map"
            />
          </div>
          
          {/* Информация о координатах */}
          <div style={{ marginTop: "6px", fontSize: "8px", color: "#cccccc" }}>
            <div>📍 Ты: {extendedDebug.userGPS.lat.toFixed(6)}, {extendedDebug.userGPS.lon.toFixed(6)}</div>
            <div>🎯 Шива: {AR_CONFIG.TARGETS.find(t => t.id === 'shiva')?.lat.toFixed(6)}, {AR_CONFIG.TARGETS.find(t => t.id === 'shiva')?.lon.toFixed(6)}</div>
            <div>📏 Расстояние: {(() => {
              const shiva = AR_CONFIG.TARGETS.find(t => t.id === 'shiva');
              if (shiva && extendedDebug.userGPS.lat !== 0) {
                const dist = haversine(extendedDebug.userGPS.lat, extendedDebug.userGPS.lon, shiva.lat, shiva.lon);
                return `${dist.toFixed(1)}м`;
              }
              return "N/A";
            })()}</div>
          </div>
        </div>
      )}

      {/* CSS анимации */}
      <style>{`
        @keyframes apulse {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.9; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.9; }
        }
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); opacity: 0.9; }
          50% { transform: translateX(-50%) scale(1.05); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 0.9; }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 4px rgba(0,0,0,0.9); }
          50% { box-shadow: 0 0 8px rgba(255,0,0,0.8); }
          100% { box-shadow: 0 0 4px rgba(0,0,0,0.9); }
        }
      `}</style>
      
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


