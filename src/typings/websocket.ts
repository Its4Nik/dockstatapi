import type { Readable, Transform } from "stream";
import type internal from "stream";

interface streams {
  statsStream: Readable;
  splitStream: internal.Transform;
}

interface logStreamData {
  timestamp: string;
  level: string;
  message: string;
  file: string;
  line: number;
}

export { streams, logStreamData };
