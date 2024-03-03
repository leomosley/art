import express, { Request, Response } from 'express';
import { promises as fs, Dirent } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

interface StreamerOptions {
  flip: boolean;
}

let frames: string[] = [];

async function loadFrames(framesPath: string): Promise<void> {
  try {
    const files: Dirent[] = await fs.readdir(framesPath, { withFileTypes: true });

    frames = [];

    for (const file of files) {
      const filePath = path.join(framesPath, file.name);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        const frame = await fs.readFile(filePath);
        frames.push(frame.toString());
      }
    }
  } catch (error) {
    console.error(`Error loading frames: ${error}`);
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
  const framesBasePath: string = path.join(__dirname, '../frames/');
  const framesPath: string = framesBasePath + requestedPath

  if (requestedPath === 'healthcheck') {
    res.status(200).json({ status: 'ok' });
    return;
  }

  if (
    req.headers &&
    req.headers['user-agent'] &&
    !req.headers['user-agent'].includes('curl')
  ) {
    res.writeHead(302, { Location: 'https://github.com/leomosley/art' });
    return res.end();
  }

  try {
    const framesDirectoryExists = await fs.access(framesPath)
      .then(() => true)
      .catch(() => false);
    
    if (
      !requestedPath || 
      requestedPath === '/' || 
      !framesDirectoryExists
    ) {
      return res.status(404).send('Frames directory not found');
    }
    
    await loadFrames(framesPath);
  } catch (err) {
    res.status(500);
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