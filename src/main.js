import WebGPU from '../lib/webgpu.js';
import {multiplyMat4, createTranslationMat4, createRotationZMat4, createLookAtMat4, createOrthographicMat4} from '../lib/utils.js';
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

  function createViewMatrix(posy_object){
    const eye = [0, posy_object, 3];
    const at = [0, posy_object, 0];
    const up = [0, 1, 0];

    return createLookAtMat4(eye, at, up, true);
  }

  function createProjectionMatrix(){
    const aspect = gpu.canvas.width/gpu.canvas.height;
    const left = -1.7 * aspect;
    const right = -left;
    const bottom = -1.7;
    const top = -bottom;
    const near = 0.1;
    const far = 100;

    return createOrthographicMat4(left, right, bottom, top, near, far);
  }  

  const start = performance.now();
  const freq_Y = 0.5;
  const amp_Y = 0.3;
  const freq_rot = 0.7;
  const amp_rot = 0.15;
  const fase_rot = Math.PI / 3;


  function frame(now) {
    const t = (now - start) / 1000;
    const kiteY = amp_Y * Math.sin(2*Math.PI * freq_Y * t);
    const kiteRot = amp_rot * Math.sin(2*Math.PI * freq_rot * t + fase_rot);
    const kiteModel = multiplyMat4(createTranslationMat4(0, kiteY, 0), createRotationZMat4(kiteRot));
    const cameraFollow = 0.5;
    const frct_kiteY = cameraFollow * kiteY;
    const view = createViewMatrix(frct_kiteY);
    const proj = createProjectionMatrix();
    const vp   = multiplyMat4(proj, view);

    const { fita1Model, fita2Model } = computeTailModels(t, kiteY, kiteRot);

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