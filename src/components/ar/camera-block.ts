import * as THREE from "three";

let currentFacing: "environment" | "user" = "environment";
let stream: MediaStream | null = null;
let video: HTMLVideoElement | null = null;
let videoBgEl: HTMLVideoElement | null = null;
let videoTexture: THREE.VideoTexture | null = null;
let recorder: MediaRecorder | null = null;
let sceneRef: THREE.Scene | null = null;
let rendererRef: THREE.WebGLRenderer | null = null;

export function bindCameraUI(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  sceneRef = scene;
  rendererRef = renderer;

  const btnPhoto  = document.getElementById("btn-photo");
  const btnVideo  = document.getElementById("btn-video");
  const btnStop   = document.getElementById("btn-stop");
  const btnSwitch = document.getElementById("btn-switch");

  if (btnPhoto) btnPhoto.onclick = capturePhoto;
  if (btnVideo) btnVideo.onclick = startVideo;
  if (btnStop)  btnStop.onclick  = stopVideo;
  if (btnSwitch) btnSwitch.onclick = () => switchCamera(sceneRef!);
}

export async function startCamera(scene: THREE.Scene, facing: "environment" | "user" = "environment"): Promise<MediaStream> {
  currentFacing = facing;
  stopCamera();

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentFacing },
    audio: false
  });

  video = document.createElement("video");
  video.setAttribute("playsinline", "");
  video.muted = true;
  video.srcObject = stream;
  await video.play();

  videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  // Основной путь: используем видео как фон сцены
  try {
    if (scene) scene.background = videoTexture;
  } catch {}

  // Надёжный фоллбэк: HTMLVideo под канвасом (на случай, если видео-текстура не рисуется на некоторых устройствах)
  try {
    if (!videoBgEl) {
      videoBgEl = document.createElement("video");
      videoBgEl.setAttribute("playsinline", "");
      videoBgEl.muted = true;
      videoBgEl.autoplay = true;
      videoBgEl.style.position = "fixed";
      videoBgEl.style.top = "0";
      videoBgEl.style.left = "0";
      videoBgEl.style.width = "100vw";
      videoBgEl.style.height = "100vh";
      videoBgEl.style.objectFit = "cover";
      videoBgEl.style.zIndex = "9998";
      videoBgEl.style.display = "none"; // скрыт по умолчанию
      videoBgEl.id = "ar-bg-video";
      document.body.appendChild(videoBgEl);
    }
    videoBgEl.srcObject = stream;
    await videoBgEl.play();
  } catch {}
  return stream;
}

export async function switchCamera(scene: THREE.Scene): Promise<void> {
  currentFacing = currentFacing === "environment" ? "user" : "environment";
  await startCamera(scene, currentFacing);
  toastStatus(`Камера: ${currentFacing === "environment" ? "задняя" : "фронтальная"}`);
}

export function stopCamera(): void {
  try {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  } catch {}
  stream = null;
  videoTexture = null;
  video = null;
  try {
    if (videoBgEl) {
      videoBgEl.pause();
      if (videoBgEl.parentElement) videoBgEl.parentElement.removeChild(videoBgEl);
    }
  } catch {}
  videoBgEl = null;
}

// Управление видимостью HTML-видео фона (ползунок включаем только в fullscreen при необходимости)
export function setBackgroundVideoVisible(visible: boolean): void {
  try { if (videoBgEl) videoBgEl.style.display = visible ? "block" : "none"; } catch {}
}

export function capturePhoto(): void {
  if (!rendererRef) return;
  const dataURL = rendererRef.domElement.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "ar-photo.png";
  a.click();
}

export function startVideo(): void {
  if (!rendererRef) return;
  const canvasStream = rendererRef.domElement.captureStream(30);
  recorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
  recorder.ondataavailable = (e) => {
    const blob = new Blob([e.data], { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ar-video.webm";
    a.click();
    URL.revokeObjectURL(url);
  };
  recorder.start();
  toastStatus("Запись началась");
}

export function stopVideo(): void {
  if (recorder && recorder.state !== "inactive") {
    recorder.stop();
    toastStatus("Запись остановлена");
  }
}

export function toastStatus(text: string): void {
  const el = document.getElementById("status") as HTMLElement;
  if (!el) return;
  el.style.display = "block";
  el.textContent = text;
  clearTimeout((el as any)._t);
  (el as any)._t = setTimeout(() => (el.style.display = "none"), 2000);
}


