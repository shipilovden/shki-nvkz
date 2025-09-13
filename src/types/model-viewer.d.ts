declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': {
      src?: string;
      alt?: string;
      style?: React.CSSProperties;
      'camera-controls'?: boolean;
      'auto-rotate'?: boolean;
      exposure?: number;
      'shadow-intensity'?: number;
      'environment-image'?: string;
      loading?: string;
      onLoad?: () => void;
      onError?: (event: any) => void;
      vr?: boolean;
      ar?: boolean;
      'ar-modes'?: string;
      'ar-scale'?: string;
      'ar-placement'?: string;
      'interaction-policy'?: string;
      'touch-action'?: string;
      'disable-zoom'?: boolean;
      'disable-pan'?: boolean;
      'disable-tap'?: boolean;
      'camera-orbit'?: string;
      'field-of-view'?: string;
      ref?: React.Ref<any>;
      children?: React.ReactNode;
    };
  }
}

declare global {
  interface Window {
    modelViewer: any;
  }
}
