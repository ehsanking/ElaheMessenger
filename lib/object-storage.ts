import path from "path";
import { mkdir, readFile, writeFile, stat } from "fs/promises";
import crypto from "crypto";

const storageRoot = path.join(process.cwd(), process.env.OBJECT_STORAGE_ROOT || 'object_storage');
const privateBucket = process.env.OBJECT_STORAGE_PRIVATE_BUCKET || 'private';

export const getObjectStorageMode = () => (process.env.OBJECT_STORAGE_DRIVER || 'local').toLowerCase();
export const getObjectStorageRoot = () => storageRoot;

const resolveKeyPath = (bucket: string, key: string) => path.join(storageRoot, bucket, key);

export const putPrivateObject = async (key: string, buffer: Buffer) => {
  const target = resolveKeyPath(privateBucket, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
  return {
    key,
    bucket: privateBucket,
    etag: crypto.createHash('sha256').update(buffer).digest('hex'),
    storageUrl: `object://${privateBucket}/${key}`,
  };
};

export const getPrivateObject = async (key: string) => readFile(resolveKeyPath(privateBucket, key));
export const statPrivateObject = async (key: string) => stat(resolveKeyPath(privateBucket, key));
export const getPrivateObjectPath = (key: string) => resolveKeyPath(privateBucket, key);
