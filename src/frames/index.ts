import { list } from "@vercel/blob";

interface Frame {
  size: number;
  uploadedAt: Date;
  pathname: string;
  url: string;
  downloadUrl: string;
}

export async function getFolders(): Promise<string[]> {
  try {
    const { folders } = await list({ mode: 'folded', prefix: 'art/frames/' });

    if (folders) {
      const foldersArray: string[] = folders.map(folder => folder.split('/').slice(-2)[0] as string);
      return foldersArray;
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
}

export async function getFrames(path: string): Promise<Frame[]> {
  try {
    const folders = await getFolders();
    if (folders.includes(path)) {
      const { blobs } = await list ({ prefix: `art/frames/${path}`});
      return blobs;
    } else {
      throw new Error('Frames not found.');
    }
  } catch (error) {
    throw error;
  }
}