import * as THREE from "three";

export interface BufPackedComponent {
  from: number;
  delta: number;
}

export interface BufAttributeDescriptor {
  id: string;
  componentSize: number;
  storageType:
    | "Float32Array"
    | "Uint32Array"
    | "Uint16Array"
    | "Uint8Array"
    | "Int32Array"
    | "Int16Array"
    | "Int8Array";
  needsPack: boolean;
  packedComponents?: BufPackedComponent[];
}

export interface BufSceneNode {
  name: string;
  parentIndex: number;
  vertexIndex: number;
  vertexCount: number;
  faceIndex: number;
  faceCount: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
  material?: unknown;
}

export interface BufHeader {
  vertexCount: number;
  indexCount: number;
  meshType?: "Mesh" | "LineSegments" | "Points";
  attributes: BufAttributeDescriptor[];
  sceneData?: BufSceneNode[];
}

export interface ParsedBufData {
  header: BufHeader;
  geometry: THREE.BufferGeometry;
  attributes: Record<string, TypedArray>;
}

type TypedArray =
  | Float32Array
  | Uint32Array
  | Uint16Array
  | Uint8Array
  | Int32Array
  | Int16Array
  | Int8Array;

const STORAGE_CTORS: Record<
  BufAttributeDescriptor["storageType"],
  {
    new (buffer: ArrayBuffer, byteOffset: number, length: number): TypedArray;
    BYTES_PER_ELEMENT: number;
  }
> = {
  Float32Array,
  Uint32Array,
  Uint16Array,
  Uint8Array,
  Int32Array,
  Int16Array,
  Int8Array,
};

const bufCache = new Map<string, Promise<ParsedBufData>>();

/**
 * Decodes Lusion's compact quantized binary `.buf` mesh/animation container format
 * into a ready-to-render `THREE.BufferGeometry` plus named attribute arrays.
 */
export function parseLusionBuf(arrayBuffer: ArrayBuffer): ParsedBufData {
  const jsonByteLength = new Uint32Array(arrayBuffer, 0, 1)[0];
  const headerText = new TextDecoder("utf-8").decode(
    new Uint8Array(arrayBuffer, 4, jsonByteLength)
  );
  const header = JSON.parse(headerText) as BufHeader;

  const { vertexCount, indexCount, attributes } = header;
  let byteOffset = 4 + jsonByteLength;

  const geometry = new THREE.BufferGeometry();
  const decodedMap: Record<string, TypedArray> = {};

  for (let i = 0; i < attributes.length; i += 1) {
    const attr = attributes[i];
    const itemCount = attr.id === "indices" ? indexCount : vertexCount;
    const Ctor = STORAGE_CTORS[attr.storageType];
    const elementCount = itemCount * attr.componentSize;
    const bpe = Ctor.BYTES_PER_ELEMENT;

    // Slice to guarantee proper typed-array alignment regardless of JSON header length
    const alignedSlice = arrayBuffer.slice(byteOffset, byteOffset + elementCount * bpe);
    const rawArray = new Ctor(alignedSlice, 0, elementCount);

    let finalArray: TypedArray = rawArray;
    if (attr.needsPack && attr.packedComponents) {
      const comps = attr.packedComponents;
      const compLen = comps.length;
      const isSigned = attr.storageType.startsWith("Int");
      const range = 2 ** (bpe * 8);
      const bias = isSigned ? range * 0.5 : 0;
      const invRange = 1 / range;
      const unpacked = new Float32Array(elementCount);

      let cursor = 0;
      for (let v = 0; v < itemCount; v += 1) {
        for (let c = 0; c < compLen; c += 1) {
          const spec = comps[c];
          unpacked[cursor] = (rawArray[cursor] + bias) * invRange * spec.delta + spec.from;
          cursor += 1;
        }
      }
      finalArray = unpacked;
    }

    decodedMap[attr.id] = finalArray;

    if (attr.id === "indices") {
      geometry.setIndex(new THREE.BufferAttribute(finalArray, 1));
    } else {
      geometry.setAttribute(attr.id, new THREE.BufferAttribute(finalArray, attr.componentSize));
    }

    byteOffset += elementCount * bpe;
  }

  geometry.computeBoundingSphere();
  return { header, geometry, attributes: decodedMap };
}

export function loadLusionBuf(url: string): Promise<ParsedBufData> {
  const existing = bufCache.get(url);
  if (existing) return existing;

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch .buf asset ${url} (HTTP ${res.status})`);
      }
      return res.arrayBuffer();
    })
    .then(parseLusionBuf);

  bufCache.set(url, promise);
  return promise;
}

export const loadBufGeometry = loadLusionBuf;

