export const vertexShader = /* wgsl */ `
struct Uniforms {
  mvp: mat4x4f,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0)      color: vec4f,
};

@vertex
fn main(
  @location(0) position: vec4f,
  @location(1) color:    vec4f,
) -> VertexOutput {
  var out: VertexOutput;
  out.pos   = u.mvp * position;
  out.color = color;
  return out;
}
`;

export const fragmentShader = /* wgsl */ `
@fragment
fn main(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}
`;