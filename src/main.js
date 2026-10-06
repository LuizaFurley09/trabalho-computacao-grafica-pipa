import WebGPU from '../lib/webgpu.js';
import {multiplyMat4, createIdentityMat4, createLookAtMat4, createOrthographicMat4} from '../lib/utils.js';
import {vertexShader, fragmentShader} from './shaders.js';

import {kitePositions, kiteColors, KITE_VERTEX_COUNT, fitaBasePositions, fita1Colors, fita2Colors, FITA_VERTEX_COUNT, computeTailModels} from './pipaCauda.js';

async function main() {
  const gpu = await WebGPU.createCanvas('#gpuCanvas', innerWidth, innerHeight, {
    clearColor: { r: 0.53, g: 0.81, b: 0.98, a: 1.0 },
    depth: false,
  });

  const program = gpu.createProgram(vertexShader, fragmentShader);

  const kiteShape  = gpu.createShape({
    buffers: [kitePositions, kiteColors],
    vertexCount: KITE_VERTEX_COUNT,
  });
  const fita1Shape = gpu.createShape({
    buffers: [fitaBasePositions, fita1Colors],
    vertexCount: FITA_VERTEX_COUNT,
  });
  const fita2Shape = gpu.createShape({
    buffers: [fitaBasePositions, fita2Colors],
    vertexCount: FITA_VERTEX_COUNT,
  });

  const uKite  = gpu.createUniform(program, new Float32Array(16));
  const uFita1 = gpu.createUniform(program, new Float32Array(16));
  const uFita2 = gpu.createUniform(program, new Float32Array(16));

  addEventListener('resize', () => {
    gpu.resize(innerWidth, innerHeight);
    gpu.context.configure({
      device: gpu.device, format: gpu.format, alphaMode: 'opaque',
    });
  });

  // Câmera FIXA - provisória
  const view = createLookAtMat4([0, 0, 3], [0, 0, 0], [0, 1, 0], true);

  const proj = createOrthographicMat4(-1.7, 1.7, -1.7, 1.7, 0.1, 100);
  const vp   = multiplyMat4(proj, view);

  const kiteModel = createIdentityMat4();

  const start = performance.now();

  function frame(now) {
    const t = (now - start) / 1000;

    const { fita1Model, fita2Model } = computeTailModels(t, 0, 0);

    gpu.writeBuffer(uKite.buffer,  multiplyMat4(vp, kiteModel));
    gpu.writeBuffer(uFita1.buffer, multiplyMat4(vp, fita1Model));
    gpu.writeBuffer(uFita2.buffer, multiplyMat4(vp, fita2Model));

    gpu.start();
    gpu.draw(program, kiteShape,  [uKite.bindGroup]);
    gpu.draw(program, fita1Shape, [uFita1.bindGroup]);
    gpu.draw(program, fita2Shape, [uFita2.bindGroup]);
    gpu.finish();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();