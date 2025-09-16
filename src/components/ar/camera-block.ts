import * as THREE from "three";

let currentFacing: "environment" | "user" = "environment";
let stream: MediaStream | null = null;
let video: HTMLVideoElement | null = null;
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
  videoTexture.encoding = THREE.sRGBEncoding;

  if (scene) scene.background = videoTexture;
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
  const el = document.getElementById("status") as any;
  if (!el) return;
  el.style.display = "block";
  el.textContent = text;
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.display = "none"), 2000);
}


