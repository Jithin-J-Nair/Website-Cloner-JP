/** Reader for the archived About geometry container: uint32 JSON-byte length,
 * JSON schema, followed by tightly packed attribute arrays. No executable source
 * bundle is loaded. DataView supports unaligned attribute offsets safely. */
interface Attribute { id: string; needsPack: boolean; componentSize: number; storageType: string; packedComponents?: { from: number; delta: number }[] }
export function decodeAboutSourceBuffer(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 8 || buffer.byteLength > 4_000_000) throw new Error("Invalid About geometry size");
  const length = view.getUint32(0, true);
  if (length < 16 || length > 32_768 || length + 4 >= buffer.byteLength) throw new Error("Invalid About geometry header");
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, length))) as {
    vertexCount: number; indexCount: number; attributes: Attribute[];
  };
  if (!Number.isInteger(header.vertexCount) || header.vertexCount < 1 || header.vertexCount > 100_000
    || !Number.isInteger(header.indexCount) || header.indexCount < 0 || header.indexCount > 300_000
    || !Array.isArray(header.attributes) || header.attributes.length > 16) throw new Error("Invalid About geometry schema");
  const attributes: Record<string, Float32Array> = {};
  let offset = 4 + length;
  for (const attr of header.attributes) {
    const { id, componentSize: components, storageType: type } = attr;
    if (Object.hasOwn(attributes, id)) throw new Error("Duplicate About attribute");
    if (!["position", "nShade", "CP", "indices", "Cd"].includes(id)
      || !Number.isInteger(components) || components < 1 || components > 4) throw new Error("Unsupported About attribute");
    const bytes = type === "Float32Array" ? 4 : type === "Uint16Array" || type === "Int16Array" ? 2 : type === "Uint8Array" ? 1 : 0;
    const count = (id === "indices" ? header.indexCount : header.vertexCount) * components;
    if (!bytes || offset + count * bytes > buffer.byteLength) throw new Error("Truncated About attribute");
    const data = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const at = offset + i * bytes;
      let value = type === "Float32Array" ? view.getFloat32(at, true) : type === "Uint16Array" ? view.getUint16(at, true)
        : type === "Int16Array" ? view.getInt16(at, true) : view.getUint8(at);
      if (attr.needsPack) {
        const range = attr.packedComponents?.[i % components];
        if (!range || !Number.isFinite(range.from + range.delta)) throw new Error("Invalid About quantization");
        value = range.from + range.delta * (type === "Int16Array" ? (value + 32768) / 65535 : value / (bytes === 1 ? 255 : 65535));
      }
      if (!Number.isFinite(value)) throw new Error("Nonfinite About vertex");
      data[i] = value;
    }
    attributes[id] = data; offset += count * bytes;
  }
  if (offset !== buffer.byteLength || !attributes.position) throw new Error("Invalid About attribute layout");
  return { count: header.vertexCount, attributes };
}
