[[block]]
struct Uniforms {
    model: mat4x4<f32>;
    time: f32;
    resolution: vec2<f32>;
};

[[group(0), binding(0)]]
var<uniform> uniforms: Uniforms;

[[location(0)]]
var<in> position: vec3<f32>;
[[location(1)]]
var<in> color: vec4<f32>;

[[location(0)]]
var<out> vColor: vec4<f32>;

[[stage(vertex)]]
fn main() -> void {
    vColor = color;
    gl_Position = (uniforms.model * vec4<f32>(position, 1.0));
}
