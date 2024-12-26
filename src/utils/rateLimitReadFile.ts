import { promises as fs } from "fs";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let lastReadTime = 0;
const rateLimitDuration = 500;

export const rateLimitedReadFile = async (
  filePath: string,
  encoding: BufferEncoding = "utf8",
): Promise<string> => {
  const now = Date.now();
  const timeSinceLastRead = now - lastReadTime;

  if (timeSinceLastRead < rateLimitDuration) {
    await delay(rateLimitDuration - timeSinceLastRead);
  }

  lastReadTime = Date.now();
  return fs.readFile(filePath, encoding);
};
