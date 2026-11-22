import { beforeAll } from "bun:test";
import { HookOptions } from "node:test";

export const beforeAllReturning = async <T>(callback: () => Promise<T>, options?: HookOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    beforeAll(async () => {
      try {
        resolve(await callback());
      } catch(e) {
        reject(e);
        return;
      }
    }, options);
  });
}
