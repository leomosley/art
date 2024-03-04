import express, { Request, Response } from 'express';
import { Readable } from 'stream';
import axios from 'axios';
import { getFolders, getFrames } from '../frames';

interface StreamerOptions {
  flip: boolean;
}

interface Frame {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

let frames: string[] = [];

async function readFrameContent(frame: Frame): Promise<string> {
  try {
    const response = await axios.get(frame.url);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function loadFrames(framesPath: string): Promise<void> {
  try {
    const blob: Frame[] = await getFrames(framesPath);
    frames = [];

    for (const file of blob) {
      const content = await readFrameContent(file);
      frames.push(content);
    }
    frames.pop()
  } catch (error) {
    throw error;
  }
}

function streamer(stream: Readable, opts: StreamerOptions): NodeJS.Timer {
  let index = 0;

  return setInterval(() => {
    let char = opts.flip ? frames[index].split('').reverse().join('') : frames[index];
    stream.push('\x1b[2J\x1b[3J\x1b[H');
    stream.push(char);

    index = (index + 1) % frames.length;
  }, 70);
}

const validateQuery = ({ flip }: { flip?: string }) => ({
  flip: !!flip,
});

const router = express.Router()

router.get('/:path', async (req: Request, res: Response) => {
  const requestedPath: string = req.params.path;

  if (requestedPath === 'healthcheck') {
    res.status(200).json({ status: 'ok' });
    return;
  }

  try {    
    if (!requestedPath || requestedPath === '/') {
      throw new Error();
    }

    await loadFrames(requestedPath);
  } catch (error) {
    res.status(404).send(`Not a valid path. Select one of these frames: ${(await getFolders()).join('\n')}`);
    return;
  }

  const stream = new Readable();
  stream._read = function noop() {};
  stream.pipe(res);

  const interval: NodeJS.Timer = streamer(stream, validateQuery(req.query as { flip?: string }));

  req.on('close', () => {
    stream.destroy();
    clearInterval(interval as unknown as number);
  });
});

export default router;