#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec4 color;

uniform mat4 model;
out vec4 vColor;

void main(void) {
    vColor = color;
    gl_Position = model * vec4(position, 1.0);
}
