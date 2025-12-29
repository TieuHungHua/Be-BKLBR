export interface UploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  };
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}
