#version 100

attribute vec3 position;
attribute vec4 color;

uniform mat4 model;
varying vec4 vColor;

void main(void) {
    vColor = color;
    gl_Position = model * vec4(position, 1.0);
}
