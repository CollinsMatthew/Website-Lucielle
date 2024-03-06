#version 100
precision lowp float;

const float CAM_FAR = 20.0;
const vec3 BACKGROUND = vec3(0.0, 0.0, 0.0);

const float PI = radians(180.0);

uniform float time;
uniform vec2 resolution;

in vec4 vColor;

vec3 artifactOffset;
mat3 artifactRotation;
vec3 artifactAxis;
vec3 camFwd;
vec3 camUp;

float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float rand(float n) {
    n = fract(n * 43758.5453);
    n *= n;
    return fract(n * 43758.5453);
}

float hash(float n) {
    return fract(abs(fract(n) * 43758.5453));
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u);
}

mat4 viewMatrix(vec3 dir, vec3 up) {
    vec3 f = normalize(dir);
    vec3 s = normalize(cross(f, up));
    return mat4(vec4(s, 0.0), vec4(cross(s, f), 0.0), vec4(-f, 0.0), vec4(0.0, 0.0, 0.0, 1));
}

mat3 rotationAlign(vec3 d, vec3 z) {
    vec3 v = cross(z, d);
    float c = dot(z, d);
    float k = 1.0 / (1.0 + c);
    return mat3(
    v.x * v.x * k + c,
    v.y * v.x * k - v.z,
    v.z * v.x * k + v.y,
    v.x * v.y * k + v.z,
    v.y * v.y * k + c,
    v.z * v.y * k - v.x,
    v.x * v.z * k - v.y,
    v.y * v.z * k + v.x,
    v.z * v.z * k + c
    );
}

float intersectPlane(vec3 origin, vec3 direction, vec3 point, vec3 normal) {
    return clamp(dot(point - origin, normal) / dot(direction, normal), -1.0, 9991999.0);
}

vec3 calcRay(vec2 uv, float fov, float aspect) {
    uv = uv * 2.0 - 1.0;
    float d = 1.0 / tan(radians(fov) * 0.5);
    return normalize(vec3(aspect * uv.x, uv.y, d));
}

vec2 getWave(vec2 position, vec2 dir, float speed, float frequency, float iTimeshift) {
    float x = dot(dir, position) * frequency + iTimeshift * speed;
    float wave = exp(sin(x) - 1.0);
    float dist = wave * cos(x);
    return vec2(wave, -dist);
}

float heightmap(vec2 worldPos) {
    const float scale = 0.06;

    vec2 p = worldPos * scale;
    vec2 p2 = (artifactOffset.xz - vec2(0.0, 1.0)) * scale;

    float d = (1.0 - smootherstep(0.0, 1.0, clamp(length(p2 - p) * 1.25, 0.0, 1.0))) * 0.87;
    float angle = 0.0;
    float freq = 5.0;
    float speed = 2.0;
    float weight = 1.9;
    float wave = 0.0;
    float waveScale = 0.0;

    vec2 dir;
    vec2 res;

    for (int i = 0; i < 5; i++) {
        dir = vec2(cos(angle), sin(angle));
        res = getWave(p, dir, speed, freq, time);
        p += dir * res.y * weight * 0.05;
        wave += res.x * weight - d;
        angle += 12.0;
        waveScale += weight;
        weight = mix(weight, 0.0, 0.2);
        freq *= 1.18;
        speed *= 1.06;
    }

    return wave * (1.0 / waveScale);
}

float octahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

void artifact(vec3 p, inout float currDist, inout vec3 glowColor, inout int id) {
    p -= artifactOffset;
    p = artifactRotation * p;
    float dist = octahedron(p, 0.8);
    const float glowDist = 4.8;
    if (dist < glowDist) {
        float d = dist + rand(dist) * 1.7;
        glowColor += vec3(0.75, 0.55, 0.45) * clamp(1.0 - pow((d * (1.0 / glowDist)), 5.0), 0.0, 1.0) * 0.035;
    }
    if (dist < currDist) {
        currDist = dist;
        id = 1;
    }
}

float objects(vec3 p, inout vec3 glowColor, inout int objId) {
    float dist = CAM_FAR;
    artifact(p, dist, glowColor, objId);
    return dist;
}

float artifactDist(vec3 p) {
    p -= artifactOffset;
    p = artifactRotation * p;
    return octahedron(p, 1.2);
}

float objectsDist(vec3 p) {
    return artifactDist(p);
}

vec3 objectsNormal(vec3 p, float eps) {
    vec2 h = vec2(eps, 0);
    return normalize(vec3(
    artifactDist(p + h.xyy) - artifactDist(p - h.xyy),
    eps * 2.0,
    artifactDist(p + h.yyx) - artifactDist(p - h.yyx)
    ));
}

vec3 objectsColor(int id, vec3 normal, vec3 ray) {
    return id == 1 ? vec3(0.85, 0.65, 0.55) * mix(0.8, 1.5, dot(normal, normalize(vec3(0.0, 1.0, 0.5))) * 0.5 + 0.5) :
    id == 2 ? vec3(0.85, 0.65, 0.55) * 1.5 :
    vec3(1.0, 1.0, 0.0);
}

void marchObjects(vec3 eye, vec3 ray, float wDepth, inout vec4 color) {
    float dist = 0.0;
    int id;
    vec3 rayPos = eye;
    float depth = CAM_FAR;
    for (int i = 0; i < 30; i++) { // i < 100
        dist = objects(rayPos, color.rgb, id);
        depth = distance(rayPos, eye);
        if (depth > wDepth || dist < 0.01) break;
        rayPos += ray * dist;
    }
    color = dist < 0.01 ? vec4(objectsColor(id, objectsNormal(rayPos, 0.01), ray), depth) : color;
}

vec3 waterColor(vec3 ray, vec3 normal, vec3 p) {
    vec3 color = vec3(0.0);
    float fogDist = length(p - vec3(0.0, 0.0, -6.0));
    float dist = 0.0;
    int objId = 0;
    vec3 refl = reflect(ray, normal);
    vec3 rayPos = p + refl * dist;

    if (length(p.xz - artifactOffset.xz) < 8.5 && dot(refl, normalize(artifactOffset - p)) > -0.25) {
        for (int i = 0; i < 40; i++) {
            dist = objects(rayPos, color, objId);
            if (dist < 0.01) {
                color = objectsColor(objId, objectsNormal(rayPos, 0.001), rayPos);
                break;
            }
            rayPos += refl * dist;
        }
    }

    float fresnel = 0.04 + 0.9 * pow(1.0 - max(0.0, dot(-normal, ray)), 7.0);
    float d = length(artifactOffset - p);
    const float r = 14.0;
    float atten = clamp(1.0 - (d * d) / (r * r), 0.0, 1.0);
    atten *= atten;

    vec3 point = vec3(0.75, 0.55, 0.45) * atten * (1.0 + fresnel) * 0.07;
    vec3 ambient = dot(normal, normalize(vec3(0.0, 1.0, 0.5))) * max(fresnel, 0.06) * vec3(0.1, 0.5, 1.0) * 0.85;
    float fog = smootherstep(25.0, 6.0, fogDist) * (1.0 / (fogDist * 0.1));

    return color + (point + ambient) * fog;
}

vec3 waterNormal(vec2 p, float eps) {
    vec2 h = vec2(eps, 0.0);
    return normalize(vec3(
    heightmap(p - h.xy) - heightmap(p + h.xy),
    eps * 2.0,
    heightmap(p - h.yx) - heightmap(p + h.yx)
    ));
}

void marchWater(vec3 eye, vec3 ray, inout vec4 color) {
    const vec3 planeNorm = vec3(0.0, 1.0, 0.0);
    const float depth = 3.0;
    float ceilDist = intersectPlane(eye, ray, vec3(0.0, 0.0, 0.0), planeNorm);
    vec3 normal = vec3(0.0);

    if (dot(planeNorm, ray) > -0.05) {
        color = vec4(vec3(0.0), CAM_FAR);
        return;
    }

    float height = 0.0;
    vec3 rayPos = eye + ray * ceilDist;
    for (int i = 0; i < 30; i++) { // i < 80
        height = heightmap(rayPos.xz) * depth - depth;
        if (rayPos.y - height < 0.1) {
            color.w = distance(rayPos, eye);
            vec3 normPos = (eye + ray * color.w);
            color.rgb = waterColor(ray, waterNormal(normPos.xz, 0.005), normPos);
            return;
        }
        rayPos += ray * max(rayPos.y - height, 0.1);
    }

    color = vec4(vec3(0.0), CAM_FAR);
}

vec3 march(vec2 uv, vec3 camPos) {
    mat4 vm = viewMatrix(camFwd, camUp);
    vec3 ray = (vm * vec4(calcRay(uv, 80.0, resolution.x / resolution.y), 1.0)).xyz;
    vec4 color = vec4(BACKGROUND, CAM_FAR);
    vec3 waterColor;
    marchWater(camPos, ray, color);
    marchObjects(camPos, ray, color.w, color);
    return color.rgb;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord * (vec2(1.0) / resolution.xy);

    float s = sin(time);
    float c = cos(time);
    artifactRotation = mat3(c, 0, s, 0, 1, 0, -s, 0, c) * rotationAlign(vec3(0.0, 1.0, 0.0), vec3(s * 0.2, 1.0, c * 0.2 + 0.3));
    artifactOffset = vec3(s * 0.4, c * 0.3 - 1.7, -6.0);

    camFwd = vec3(0.0, 0.7 + noise(time * 0.8 + 4.0) * 0.08 - 0.04, 1.0);
    camUp = vec3(noise(time * 1.2) * 0.02 - 0.01, 1.0, 0.0);

    fragColor = vec4(march(uv, vec3(0.0, 1.9, 1.0)) - (length(uv - 0.5) - 0.3) * 0.05, 1.0);
}

void main(void) {
    gl_FragColor = vColor;
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
