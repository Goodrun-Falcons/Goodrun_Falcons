import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Plenty to show what was handed over, and keeps uploads far under the backend's 5 MB cap.
const MAX_SIDE_PX = 1600;
const JPEG_QUALITY = 0.7;

/**
 * Re-encodes a photo from the camera or library as a JPEG the backend will accept.
 * Library photos are often HEIC (iPhone's default), which the backend rejects — it checks
 * the file's actual bytes, not just its name. Large photos are scaled down on the way.
 * Returns the new file's URI.
 */
export async function toUploadableJpeg(uri: string): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const longest = Math.max(original.width, original.height);
  const image =
    longest > MAX_SIDE_PX
      ? await ImageManipulator.manipulate(original)
          .resize(
            original.width >= original.height ? { width: MAX_SIDE_PX } : { height: MAX_SIDE_PX }
          )
          .renderAsync()
      : original;
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return saved.uri;
}
