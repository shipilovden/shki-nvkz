export interface ARModel {
  id: string;
  name: string;
  description: string;
  file: File | null;
  fileUrl: string;
  qrCodeUrl: string;
  arUrl: string;
  createdAt: Date;
  fileSize: number;
  fileType: string;
}

export interface ARUploaderProps {
  onModelUpload: (model: ARModel) => void;
  ngrokUrl?: string;
}

export interface ARViewerProps {
  model: ARModel;
}

export interface ARCardProps {
  model: ARModel;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}
