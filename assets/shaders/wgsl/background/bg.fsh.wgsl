@group(0) @binding(0)
var<uniform> time: f32;

@group(0) @binding(0)
var<uniform> resolution: vec2<f32>;

@fragment
// fn mainImage(@builtin(frag_coord) fragCoord: vec4<f32>) -> @location(0) vec4<f32>
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
    var uv = fragCoord.xy / resolution;
    var s = sin(time);
    var c = cos(time);

    var artifactRotation: mat3x3<f32> = mat3x3<f32>(
        vec3<f32>(c, 0.0, s),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(-s, 0.0, c)
    ) * rotationAlign(vec3<f32>(0.0, 1.0, 0.0), vec3<f32>(s * 0.2, 1.0, c * 0.2 + 0.3));
    var artifactOffset = vec3<f32>(s * 0.4, c * 0.3 - 1.7, -6.0);

    var camFwd: vec3<f32> = vec3<f32>(0.0, 0.7 + noise(time * 0.8 + 4.0) * 0.08 - 0.04, 1.0);
    var camUp: vec3<f32> = vec3<f32>(noise(time * 1.2) * 0.02 - 0.01, 1.0, 0.0);

    var color: vec3<f32> = march(uv, vec3<f32>(0.0, 1.9, 1.0)) - (length(uv - vec2<f32>(0.5)) - 0.3) * 0.05;
    return vec4<f32>(color, 1.0);
}

fn smootherstep(edge0: f32, edge1: f32, x: f32) -> f32 {
    var t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

fn rand(n: f32) -> f32 {
    var n1 = fract(n * 43758.5453);
    n1 = n1 * n1;
    return fract(n1 * 43758.5453);
}

fn hash(n: f32) -> f32 {
    return fract(abs(fract(n) * 43758.5453));
}

fn noise(x: f32) -> f32 {
    var i = floor(x);
    var f = fract(x);
    var u = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), u);
}

fn viewMatrix(dir: vec3<f32>, up: vec3<f32>) -> mat4x4<f32> {
    var f = normalize(dir);
    var s = normalize(cross(f, up));
    return mat4x4<f32>(
        vec4<f32>(s, 0.0),
        vec4<f32>(cross(s, f), 0.0),
        vec4<f32>(-f, 0.0),
        vec4<f32>(0.0, 0.0, 0.0, 1.0)
    );
}

fn rotationAlign(d: vec3<f32>, z: vec3<f32>) -> mat3x3<f32> {
    var v = cross(z, d);
    var c = dot(z, d);
    var k = 1.0 / (1.0 + c);
    return mat3x3<f32>(
        vec3<f32>(v.x * v.x * k + c, v.y * v.x * k - v.z, v.z * v.x * k + v.y),
        vec3<f32>(v.x * v.y * k + v.z, v.y * v.y * k + c, v.z * v.y * k - v.x),
        vec3<f32>(v.x * v.z * k - v.y, v.y * v.z * k + v.x, v.z * v.z * k + c)
    );
}

fn intersectPlane(origin: vec3<f32>, direction: vec3<f32>, pointt: vec3<f32>, normal: vec3<f32>) -> f32 {
    return clamp(dot(pointt - origin, normal) / dot(direction, normal), -1.0, 9991999.0);
}

fn calcRay(uv: vec2<f32>, fov: f32, aspect: f32) -> vec3<f32> {
    var uv1 = uv * 2.0 - 1.0;
    var d = 1.0 / tan(radians(fov) * 0.5);
    return normalize(vec3<f32>(aspect * uv1.x, uv1.y, d));
}

fn getWave(position: vec2<f32>, dir: vec2<f32>, speed: f32, frequency: f32, iTimeshift: f32) -> vec2<f32> {
    var x = dot(dir, position) * frequency + iTimeshift * speed;
    var wave = exp(sin(x) - 1.0);
    var dist = wave * cos(x);
    return vec2<f32>(wave, -dist);
}

fn heightmap(worldPos: vec2<f32>) -> f32 {
    let scale: f32 = 0.06;

    var p = worldPos * scale;
    var p2 = (artifactOffset.xz - vec2<f32>(0.0, 1.0)) * scale;

    var d = (1.0 - smootherstep(0.0, 1.0, clamp(length(p2 - p) * 1.25, 0.0, 1.0))) * 0.87;
    var angle: f32 = 0.0;
    var freq: f32 = 5.0;
    var speed: f32 = 2.0;
    var weight: f32 = 1.9;
    var wave: f32 = 0.0;
    var waveScale: f32 = 0.0;

    var dir: vec2<f32>;
    var res: vec2<f32>;

    for (var i: i32 = 0; i < 5; i = i + 1) {
        dir = vec2<f32>(cos(angle), sin(angle));
        res = getWave(p, dir, speed, freq, time);
        p = p + dir * res.y * weight * 0.05;
        wave = wave + res.x * weight - d;
        angle = angle + 12.0;
        waveScale = waveScale + weight;
        weight = mix(weight, 0.0, 0.2);
        freq = freq * 1.18;
        speed = speed * 1.06;
    }

    return wave * (1.0 / waveScale);
}

fn octahedron(p: vec3<f32>, s: f32) -> f32 {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

fn artifact(p: vec3<f32>, currDist: f32, glowColor: vec3<f32>, id: i32) {
    p = p - artifactOffset;
    p = artifactRotation * p;
    var dist = octahedron(p, 0.8);
    let glowDist: f32 = 4.8;
    if (dist < glowDist) {
        var d = dist + rand(dist) * 1.7;
        glowColor = glowColor + vec3<f32>(0.75, 0.55, 0.45) * clamp(1.0 - pow((d * (1.0 / glowDist)), 5.0), 0.0, 1.0) * 0.035;
    }
    if (dist < currDist) {
        currDist = dist;
        id = 1;
    }
}

fn objects(p: vec3<f32>, glowColor: vec3<f32>, objId: i32) -> f32 {
    var dist: f32 = CAM_FAR;
    artifact(p, dist, glowColor, objId);
    return dist;
}

fn artifactDist(p: vec3<f32>) -> f32 {
    p = p - artifactOffset;
    p = artifactRotation * p;
    return octahedron(p, 1.2);
}

fn objectsDist(p: vec3<f32>) -> f32 {
    return artifactDist(p);
}

fn objectsNormal(p: vec3<f32>, eps: f32) -> vec3<f32> {
    var h = vec2<f32>(eps, 0.0);
    return normalize(vec3<f32>(
        artifactDist(p + h.xxx) - artifactDist(p - h.xxx),
        eps * 2.0,
        artifactDist(p + h.yyy) - artifactDist(p - h.yyy)
    ));
}

fn objectsColor(id: i32, normal: vec3<f32>, ray: vec3<f32>) -> vec3<f32> {
    if (id == 1) { return vec3<f32>(0.85, 0.65, 0.55) * mix(0.8, 1.5, dot(normal, normalize(vec3<f32>(0.0, 1.0, 0.5))) * 0.5 + 0.5); }
    if (id == 2) { return vec3<f32>(0.85, 0.65, 0.55) * 1.5; }
    return vec3<f32>(1.0, 1.0, 0.0);
}

fn marchObjects(eye: vec3<f32>, ray: vec3<f32>, wDepth: f32, color: vec4<f32>) -> vec4<f32> {
    var dist: f32 = 0.0;
    var id: i32;
    var rayPos: vec3<f32> = eye;
    var depth: f32 = CAM_FAR;
    for (var i: i32 = 0; i < 30; i = i + 1) {
        dist = objects(rayPos, color.rgb, id);
        depth = distance(rayPos, eye);
        if (depth > wDepth || dist < 0.01) {
            break;
        }
        rayPos = rayPos + ray * dist;
    }
    
    if (dist < 0.01) {
        return vec4<f32>(objectsColor(id, objectsNormal(rayPos, 0.01), ray), depth);
    }
    
    return color;
}

fn waterColor(ray: vec3<f32>, normal: vec3<f32>, p: vec3<f32>) -> vec3<f32> {
    var color: vec3<f32> = vec3<f32>(0.0);
    var fogDist: f32 = length(p - vec3<f32>(0.0, 0.0, -6.0));
    var dist: f32 = 0.0;
    var objId: i32 = 0;
    var refl: vec3<f32> = reflect(ray, normal);
    var rayPos: vec3<f32> = p + refl * dist;

    if (length(p.xz - artifactOffset.xz) < 8.5 && dot(refl, normalize(artifactOffset - p)) > -0.25) {
        for (var i: i32 = 0; i < 40; i = i + 1) {
            dist = objects(rayPos, color, objId);
            if (dist < 0.01) {
                color = objectsColor(objId, objectsNormal(rayPos, 0.001), rayPos);
                break;
            }
            rayPos = rayPos + refl * dist;
        }
    }

    var fresnel: f32 = 0.04 + 0.9 * pow(1.0 - max(0.0, dot(-normal, ray)), 7.0);
    var d: f32 = length(artifactOffset - p);
    const r: f32 = 14.0;
    var atten: f32 = clamp(1.0 - (d * d) / (r * r), 0.0, 1.0);
    atten = atten * atten;

    var pointt: vec3<f32> = vec3<f32>(0.75, 0.55, 0.45) * atten * (1.0 + fresnel) * 0.07;
    var ambient: vec3<f32> = dot(normal, normalize(vec3<f32>(0.0, 1.0, 0.5))) * max(fresnel, 0.06) * vec3<f32>(0.1, 0.5, 1.0) * 0.85;
    var fog: f32 = smootherstep(25.0, 6.0, fogDist) * (1.0 / (fogDist * 0.1));

    return color + (pointt + ambient) * fog;
}

fn waterNormal(p: vec2<f32>, eps: f32) -> vec3<f32> {
    var h: vec2<f32> = vec2<f32>(eps, 0.0);
    return normalize(vec3<f32>(
        heightmap(p - h.xy) - heightmap(p + h.xy),
        eps * 2.0,
        heightmap(p - h.yx) - heightmap(p + h.yx)
    ));
}

fn marchWater(eye: vec3<f32>, ray: vec3<f32>, color: vec4<f32>) -> vec4<f32> {
    let planeNorm: vec3<f32> = vec3<f32>(0.0, 1.0, 0.0);
    let depth: f32 = 3.0;
    var ceilDist: f32 = intersectPlane(eye, ray, vec3<f32>(0.0, 0.0, 0.0), planeNorm);
    var normal: vec3<f32> = vec3<f32>(0.0);

    if (dot(planeNorm, ray) > -0.05) {
        return vec4<f32>(vec3<f32>(0.0), CAM_FAR);
    }

    var height: f32 = 0.0;
    var rayPos: vec3<f32> = eye + ray * ceilDist;
    for (var i: i32 = 0; i < 30; i = i + 1) {
        height = heightmap(rayPos.xz) * depth - depth;
        if (rayPos.y - height < 0.1) {
            color.w = distance(rayPos, eye);
            var normPos: vec3<f32> = (eye + ray * color.w);
            color.rgb = waterColor(ray, waterNormal(normPos.xz, 0.005), normPos);
            return color;
        }
        rayPos = rayPos + ray * max(rayPos.y - height, 0.1);
    }

    return vec4<f32>(vec3<f32>(0.0), CAM_FAR);
}

fn march(uv: vec2<f32>, camPos: vec3<f32>) -> vec3<f32> {
    var vm: mat4x4<f32> = viewMatrix(camFwd, camUp);
    var ray: vec3<f32> = (vm * vec4<f32>(calcRay(uv, 80.0, resolution.x / resolution.y), 1.0)).xyz;
    var color: vec4<f32> = vec4<f32>(BACKGROUND, CAM_FAR);
    var waterColor: vec3<f32>;
    color = marchWater(camPos, ray, color);
    color = marchObjects(camPos, ray, color.w, color);
    return color.rgb;
}
