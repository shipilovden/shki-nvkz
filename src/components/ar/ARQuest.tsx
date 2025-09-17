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
  ],
  // Тестовые координаты для отладки (рядом с Шивой)
  DEBUG_COORDS: {
    lat: 53.691667, // Точно на Шиве
    lon: 87.432778,
    alt: 389.0
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
  const [compassAngle, setCompassAngle] = useState<number | null>(null);
  const useDirectionalOverlayRef = useRef(true);
  const [useDebugCoords, setUseDebugCoords] = useState(false);
  const userPosRef = useRef<{lat:number, lon:number, alt:number}>({lat:0,lon:0,alt:0});
  const deviceOrientationRef = useRef<{alpha: number, beta: number, gamma: number}>({alpha: 0, beta: 0, gamma: 0});
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
        
        // Принудительно обновляем компас для 2D точки
        console.log(`🧭 Device orientation changed: α=${e.alpha?.toFixed(1)}°`);
        
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
      
      // Принудительно обновляем расстояние 10 раз в секунду
      if (Math.floor(time * 10) !== Math.floor((time - 0.001) * 10) && userPosRef.current.lat !== 0) {
        console.log(`🔄 Forced update: userPos=(${userPosRef.current.lat.toFixed(6)}, ${userPosRef.current.lon.toFixed(6)}, ${userPosRef.current.alt.toFixed(1)})`);
        updateModelPositionGPS(userPosRef.current.lat, userPosRef.current.lon, userPosRef.current.alt);
      }

      // Обновляем 2D-направляющий маркер по азимуту ближайшей цели.
      // Это гарантирует, что точка двигается при повороте телефона, даже если 3D-проекция недоступна.
      try {
        const overlayRoot = document.getElementById('overlay-markers');
        console.log(`🔍 Overlay check: overlayRoot=${!!overlayRoot}, markersVisible=${markersVisibleRef.current}, compassAngle=${compassAngle}, useDirectional=${useDirectionalOverlayRef.current}`);
        
        if (overlayRoot && typeof compassAngle === 'number' && useDirectionalOverlayRef.current) {
          let dirDot = overlayRoot.querySelector('.dot-direction') as HTMLDivElement | null;
          if (!dirDot) {
            dirDot = document.createElement('div');
            dirDot.className = 'dot-direction';
            Object.assign(dirDot.style, {
              position: 'absolute', width: '20px', height: '20px', borderRadius: '50%',
              background: 'rgba(255,0,0,0.9)', transform: 'translate(-50%, -50%)',
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))', display: 'none', pointerEvents: 'none',
              border: '2px solid white', zIndex: '10000'
            } as CSSStyleDeclaration);
            overlayRoot.appendChild(dirDot);
            console.log(`🔴 Created new direction dot`);
          }
          // Доп. подпись для мобильной отладки
          let dirLabel = overlayRoot.querySelector('.dot-direction-label') as HTMLDivElement | null;
          if (!dirLabel) {
            dirLabel = document.createElement('div');
            dirLabel.className = 'dot-direction-label';
            Object.assign(dirLabel.style, {
              position: 'absolute', color: '#0f0', fontSize: '10px', transform: 'translate(-50%, -120%)',
              textShadow: '0 0 4px rgba(0,0,0,0.8)', pointerEvents: 'none', display: 'none', zIndex: '10001'
            } as CSSStyleDeclaration);
            overlayRoot.appendChild(dirLabel);
          }

          // гарантируем, что слой включен
          (overlayRoot as HTMLElement).style.display = 'block';
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            // Радиус круга для позиции точки (немного меньше половины меньшей из сторон)
            const radius = Math.min(rect.width, rect.height) * 0.35;
            // compassAngle уже скорректирован относительно ориентации устройства: 0 – прямо вперёд
            const angleRad = (compassAngle as number) * Math.PI / 180;
            // 0° — вверх. Для экранных координат: X вправо, Y вниз
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            // Для некоторых устройств оси могут быть инвертированы — используем синус/косинус как компас
            const x = cx + radius * Math.sin(angleRad);
            const y = cy - radius * Math.cos(angleRad);
            dirDot.style.left = `${x}px`;
            dirDot.style.top = `${y}px`;
            dirDot.style.display = 'block';
            if (dirLabel) { dirLabel.style.left = `${x}px`; dirLabel.style.top = `${y}px`; dirLabel.textContent = `${compassAngle?.toFixed(0)}°`; dirLabel.style.display = 'block'; }
            
            // Логируем каждые 30 кадров
            if (Math.floor(time * 30) % 30 === 0) {
              console.log(`🔴 DIR DOT compassXY: angle=${compassAngle.toFixed(1)}°, rad=${angleRad.toFixed(3)}, x=${x.toFixed(1)}, y=${y.toFixed(1)}, radius=${radius.toFixed(1)}, w=${rect.width}, h=${rect.height}`);
            }
          }
        }
      } catch (e) {
        console.error(`❌ Direction dot error:`, e);
      }
      
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
            
            // Используем позицию маркера напрямую (он уже правильно позиционирован в updateModelPositionGPS)
            if (marker && markersVisibleRef.current) {
              // Обновляем мировые матрицы перед получением позиции
              scene.updateMatrixWorld(true);
              
              const worldPosition = new THREE.Vector3();
              marker.getWorldPosition(worldPosition);
              
              // Проекция 3D координат на 2D экран с учетом поворота камеры
              const screenPosition = worldPosition.clone().project(camera);
              
              // Проверяем, что объект перед камерой (z < 1 означает перед камерой)
              if (screenPosition.z < 1) {
                const canvas = canvasRef.current;
                if (canvas) {
                  const rect = canvas.getBoundingClientRect();
                  const x = (screenPosition.x * 0.5 + 0.5) * rect.width;
                  const y = (-screenPosition.y * 0.5 + 0.5) * rect.height;
                  
                  // Проверяем, что точка в пределах экрана (с небольшим запасом)
                  const margin = 50;
                  const inViewport = x >= -margin && x <= rect.width + margin && 
                                   y >= -margin && y <= rect.height + margin;
                  
                  if (inViewport && marker.visible) {
                    dot.style.left = `${x}px`;
                    dot.style.top = `${y}px`;
                    dot.style.display = 'block';
                    // пульсация (CSS-анимация для стабильности)
                    dot.style.animation = 'apulse 1s infinite ease-in-out';
                    dot.style.width = '16px'; 
                    dot.style.height = '16px';
                    
                    // Логируем позицию для отладки (реже, чтобы не спамить)
                    if (Math.floor(time * 30) % 30 === 0) { // каждые 30 кадров
                      const logMsg = `🔴 MARKER screenXY: x=${x.toFixed(1)}, y=${y.toFixed(1)} | worldXYZ: ${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)}, ${worldPosition.z.toFixed(1)} | z=${screenPosition.z.toFixed(3)} | visible=${marker.visible}`;
                      console.log(logMsg);
                      addDebugInfo(logMsg);
                    }
                  } else {
                    dot.style.display = 'none';
                  }
                }
              } else {
                dot.style.display = 'none';
                // Логируем когда объект за камерой
                if (Math.floor(time * 60) % 60 === 0) { // каждые 60 кадров
                  const logMsg = `🔴 Overlay ${target.name}: behind camera, z=${screenPosition.z.toFixed(3)}`;
                  console.log(logMsg);
                  addDebugInfo(logMsg);
                }
              }
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
            updateModelPositionGPS(newLat, newLon, newAlt);
            setStatus(""); // очищаем статус при первом валидном апдейте
          },
          (err) => {
            console.error("❌ GPS Error:", err);
            if (err.code === 1) setStatus("Разрешите доступ к геолокации");
          },
          { 
            enableHighAccuracy: true, 
            maximumAge: 0, // НЕ кэшируем, всегда свежие данные
            timeout: 3000 
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

        {/* HTML-оверлей для маркеров (на случай, если WebGL-маркер не виден) */}
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

        {/* Информация об объектах */}
        {started && (
          <div style={{ 
            position: fullscreenMode ? "fixed" : "absolute", 
            top: 48, 
            left: 12, 
            zIndex: 10000, 
            padding: "8px 12px", 
            borderRadius: 8, 
            background: "rgba(0,0,0,0.7)", 
            color: "#fff", 
            fontSize: 11,
            minWidth: 200
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
          </div>
        )}

        {/* Компас в левом верхнем углу (отдельно от блока инфо, чтобы не перекрывался) */}
        {started && compassAngle !== null && (
          <div style={{
            position: fullscreenMode ? "fixed" : "absolute",
            top: 10,
            left: 10,
            zIndex: 10001,
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: "20px solid rgba(255,0,0,0.95)",
            transform: `rotate(${compassAngle}deg)`,
            transformOrigin: "50% 100%",
            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.9))",
            pointerEvents: "none"
          }}/>
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

      {/* CSS анимация пульса для оверлея */}
      <style>{`
        @keyframes apulse {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.9; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.9; }
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


