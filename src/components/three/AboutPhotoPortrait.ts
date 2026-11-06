/** Photo-derived particle bas-relief, used only by the About scene.
 * Source: Jithin's explicitly supplied portrait. The public derivative contains
 * positions/luminance only, not the original JPEG, its EXIF or a claimed 3D scan.
 */
export interface AboutPhotoPortrait { samples: Float32Array; count: number }

export async function loadAboutPhotoPortrait(signal: AbortSignal): Promise<AboutPhotoPortrait> {
  const response = await fetch("/about-media/jithin-portrait.ply", { signal });
  if (!response.ok) throw new Error(`Portrait request failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  // Standard binary PLY also imports into a TouchDesigner File SOP. This is
  // a portable point-cloud asset, not a TouchDesigner-generated .toe project.
  const header = new TextDecoder().decode(buffer.slice(0, 1024));
  const end = header.indexOf("end_header\n");
  const count = Number(header.match(/element vertex (\d+)\n/)?.[1]);
  if (!header.startsWith("ply\nformat binary_little_endian 1.0\n") || end < 0
    || count < 8192 || count > 65536 || !Number.isInteger(count)
    || !header.includes("property float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nproperty uchar alpha\n")
    || buffer.byteLength !== end + 11 + count * 16) throw new Error("Invalid portrait PLY");
  const view = new DataView(buffer, end + 11);
  const samples = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    samples[i * 4] = view.getFloat32(i * 16, true);
    samples[i * 4 + 1] = view.getFloat32(i * 16 + 4, true);
    samples[i * 4 + 2] = view.getFloat32(i * 16 + 8, true);
    samples[i * 4 + 3] = view.getUint8(i * 16 + 12) / 255;
  }
  for (let i = 0; i < samples.length; i += 4) {
    if (!Number.isFinite(samples[i]) || !Number.isFinite(samples[i + 1]) || !Number.isFinite(samples[i + 2])
      || Math.abs(samples[i]) > 3 || Math.abs(samples[i + 1]) > 3 || Math.abs(samples[i + 2]) > 1
      || !(samples[i + 3] >= 0 && samples[i + 3] <= 1)) throw new Error("Invalid portrait sample");
  }
  return { samples, count };
}

/** Progressive random ordering preserves the whole face at every quality tier.
 * Roster selections change a restrained viewing angle, never the user's identity.
 */
export function sampleAboutPhotoPortrait(data: AboutPhotoPortrait, count: number, variation = 0) {
  const positions = new Float32Array(count * 3), shades = new Float32Array(count);
  const yaw = ((variation % 3) - 1) * .035, c = Math.cos(yaw), s = Math.sin(yaw);
  for (let i = 0; i < count; i++) {
    const at = (i % data.count) * 4, x = data.samples[at], z = data.samples[at + 2];
    positions[i * 3] = x * c + z * s;
    positions[i * 3 + 1] = data.samples[at + 1];
    positions[i * 3 + 2] = -x * s + z * c;
    shades[i] = data.samples[at + 3];
  }
  return { positions, shades };
}
