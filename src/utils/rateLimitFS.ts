import { promises as fs, existsSync } from "fs";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let lastOperationTime = 0;
const rateLimitDuration = 500;

export const rateLimitedReadFile = async (
  filePath: string,
  encoding: BufferEncoding = "utf8",
): Promise<string> => {
  const now = Date.now();
  const timeSinceLastOperation = now - lastOperationTime;

  if (timeSinceLastOperation < rateLimitDuration) {
    await delay(rateLimitDuration - timeSinceLastOperation);
  }

  lastOperationTime = Date.now();
  return fs.readFile(filePath, encoding);
};

export const rateLimitedExistsSync = async (
  filePath: string,
): Promise<boolean> => {
  const now = Date.now();
  const timeSinceLastOperation = now - lastOperationTime;

  if (timeSinceLastOperation < rateLimitDuration) {
    await delay(rateLimitDuration - timeSinceLastOperation);
  }

  lastOperationTime = Date.now();
  return existsSync(filePath);
};
