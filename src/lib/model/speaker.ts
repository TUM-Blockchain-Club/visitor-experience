export interface ImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: string | null;
  width: number;
  height: number;
  size: number;
  sizeInBytes: number;
  url: string;
}

export interface ProfilePicture {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail: ImageFormat;
    large: ImageFormat;
    medium: ImageFormat;
    small: ImageFormat;
    [key: string]: ImageFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: never | null;
  createdat: string;
  updatedat: string;
  publishedat: string;
}

export interface Speaker {
  id: number;
  documentId: string;
  name: string;
  company_name: string;
  url: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  position: string;
  profile_photo?: ProfilePicture | null;
}