"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button, Row, Icon } from "@once-ui-system/core";

interface ArCameraControlsProps {
  arActive: boolean;
  modelViewerRef: React.RefObject<HTMLElement>;
}

export default function ArCameraControls({ arActive, modelViewerRef }: ArCameraControlsProps) {
  const [recording, setRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Запрос разрешений на камеру
  useEffect(() => {
    if (arActive) {
      requestCameraPermission();
    } else {
      stopCamera();
    }
  }, [arActive]);

  const requestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('Camera permission granted, stream:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      streamRef.current = stream;
      setHasPermission(true);
      console.log('hasPermission set to true');
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setHasPermission(false);
  };

  // Создание canvas с объединением камеры и 3D
  const createCompositeCanvas = () => {
    if (!canvasRef.current || !videoRef.current || !modelViewerRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const modelViewer = modelViewerRef.current;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры canvas
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Рисуем видео камеры как фон
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Получаем 3D рендер из model-viewer
    const modelViewerCanvas = modelViewer.querySelector('canvas');
    if (modelViewerCanvas) {
      // Рисуем 3D поверх видео
      ctx.drawImage(modelViewerCanvas, 0, 0, canvas.width, canvas.height);
    }
  };

  // Снимок (фото)
  const takeScreenshot = () => {
    if (!hasPermission) return;

    createCompositeCanvas();
    
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/png');
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.download = `ar-screenshot-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
  };

  // Начало записи видео
  const startVideoRecording = async () => {
    if (!hasPermission || !streamRef.current) return;

    try {
      // Создаем MediaStream для canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Получаем stream с canvas
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // Объединяем с аудио если есть
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => canvasStream.addTrack(track));

      chunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `ar-video-${Date.now()}.webm`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      // Запускаем рендер в canvas
      const renderLoop = () => {
        if (recording) {
          createCompositeCanvas();
          requestAnimationFrame(renderLoop);
        }
      };
      renderLoop();

    } catch (error) {
      console.error('Ошибка записи видео:', error);
    }
  };

  // Остановка записи видео
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Переключение записи
  const toggleVideoRecording = () => {
    if (recording) {
      stopVideoRecording();
    } else {
      startVideoRecording();
    }
  };

  // Отладочная информация
  console.log('ArCameraControls render:', { arActive, hasPermission });

  if (!arActive || !hasPermission) {
    return null;
  }

  return (
    <>
      {/* Скрытые элементы для записи */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Кнопки управления */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        {/* Кнопка фото */}
        <Button
          variant="secondary"
          size="s"
          onClick={takeScreenshot}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
          title="Сделать фото"
        >
          <Icon name="image" size="s" />
        </Button>

        {/* Кнопка записи видео */}
        <Button
          variant="secondary"
          size="s"
          onClick={toggleVideoRecording}
          style={{
            backgroundColor: recording ? '#ff4444' : 'rgba(255, 255, 255, 0.9)',
            border: recording ? '1px solid #ff4444' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: recording ? '55px' : '60px',
            height: recording ? '55px' : '60px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            animation: recording ? 'pulse 1s infinite' : 'none'
          }}
          title={recording ? "Остановить запись" : "Начать запись"}
        >
          {recording ? (
            <div style={{ width: '15px', height: '15px', backgroundColor: '#ffffff', borderRadius: '3px' }} />
          ) : (
            <div style={{ 
              width: '0', 
              height: '0', 
              borderLeft: '15px solid #ff4444', 
              borderTop: '10px solid transparent', 
              borderBottom: '10px solid transparent' 
            }} />
          )}
        </Button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
