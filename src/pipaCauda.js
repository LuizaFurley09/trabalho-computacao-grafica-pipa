import {createTranslationMat4, createRotationZMat4, multiplyMat4} from '../lib/utils.js';

export const kitePositions = new Float32Array([
   0.0,  0.70, 0.0, 1.0,
  -0.4,  0.00, 0.0, 1.0,
   0.0, -0.70, 0.0, 1.0, 
   0.0,  0.70, 0.0, 1.0,   
   0.0, -0.70, 0.0, 1.0,
   0.4,  0.00, 0.0, 1.0,
]);

const VERMELHO = [0.93, 0.11, 0.14, 1.0];
const AMARELO  = [1.00, 0.83, 0.10, 1.0];

export const kiteColors = new Float32Array([
  ...VERMELHO, ...VERMELHO, ...VERMELHO,
  ...AMARELO,  ...AMARELO,  ...AMARELO,
]);

export const KITE_VERTEX_COUNT = 6;

export const fitaBasePositions = new Float32Array([
  -0.06,  0.00, 0.0, 1.0,
   0.06,  0.00, 0.0, 1.0,
   0.00, -0.35, 0.0, 1.0,
]);

const LARANJA = [1.00, 0.55, 0.15, 1.0];

export const fita1Colors = new Float32Array([...LARANJA, ...LARANJA, ...LARANJA]);
export const fita2Colors = new Float32Array([...LARANJA, ...LARANJA, ...LARANJA]);

export const FITA_VERTEX_COUNT = 3;

export const KITE_BOTTOM_LOCAL = -0.70;
export const TAIL_ATTACH_DY    = 0.02;
const FITA_TIP_LOCAL_Y         = -0.35;

const F1_AMPL = 0.35;
const F1_FREQ = 2.6;
const F1_FASE = 0.0;

const F2_AMPL = 0.50;
const F2_FREQ = 4.1;
const F2_FASE = Math.PI * 0.7;

const ROT_FOLLOW   = 0.60;
const ROT_TAU      = 0.25;
const VEL_TAU      = 0.10;
const VEL_REF      = 0.60;
const VEL_BOOST    = 0.40;

const state = { init: false, t: 0, y: 0, lagRot: 0, vel: 0 };

function updateState(t, kiteY, kiteRot) {
  if (!state.init) {
    Object.assign(state, { init: true, t, y: kiteY, lagRot: kiteRot, vel: 0 });
    return;
  }
  const dt = Math.min(Math.max(t - state.t, 0), 0.05);
  if (dt > 0) {
    const vy = (kiteY - state.y) / dt;
    const aVel = 1 - Math.exp(-dt / VEL_TAU);
    const aRot = 1 - Math.exp(-dt / ROT_TAU);
    state.vel    += (vy - state.vel) * aVel;
    state.lagRot += (kiteRot - state.lagRot) * aRot;
  }
  state.t = t;
  state.y = kiteY;
}

export function computeTailModels(t, kiteY = 0, kiteRot = 0, kiteX = 0) {
  updateState(t, kiteY, kiteRot);

  const speed = Math.min(Math.abs(state.vel) / VEL_REF, 1);
  const boost = 1 + VEL_BOOST * speed;

  const localY = KITE_BOTTOM_LOCAL + TAIL_ATTACH_DY;
  const cosK = Math.cos(kiteRot);
  const sinK = Math.sin(kiteRot);
  const anchor1X = kiteX - sinK * localY;
  const anchor1Y = kiteY + cosK * localY;

  const fita1Rot =
    ROT_FOLLOW * state.lagRot +
    boost * F1_AMPL * Math.sin(F1_FREQ * t + F1_FASE);

  const fita1Model = multiplyMat4(
    createTranslationMat4(anchor1X, anchor1Y, 0),
    createRotationZMat4(fita1Rot),
  );

  const cos1 = Math.cos(fita1Rot);
  const sin1 = Math.sin(fita1Rot);
  const tip1X = anchor1X - sin1 * FITA_TIP_LOCAL_Y;
  const tip1Y = anchor1Y + cos1 * FITA_TIP_LOCAL_Y;

  const fita2Rot =
    fita1Rot +
    boost * F2_AMPL * Math.sin(F2_FREQ * t + F2_FASE);

  const fita2Model = multiplyMat4(
    createTranslationMat4(tip1X, tip1Y, 0),
    createRotationZMat4(fita2Rot),
  );

  return { fita1Model, fita2Model };
}