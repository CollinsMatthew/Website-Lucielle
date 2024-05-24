export async function init() {
    const canvas = document.querySelector("#shader-background");

    /* TODO: ...
    const wgpuContext = canvas.getContext("webgpu");
    if (wgpuContext !== null) {
        initWGPU(canvas, wgpuContext);
        return;
    }*/

    let context;
    const wglVersion =
    (context = (canvas.getContext("experimental-webgl2") || canvas.getContext("webgl2"))) != null ? 2 :
    (context = (canvas.getContext("experimental-webgl" ) || canvas.getContext("webgl" ))) != null ? 1 : 0;
    if (wglVersion !== 0) initGL(canvas, context, wglVersion);
    else console.warn("couldn't find webgpu nor webgl, so no-no fancy shader-background. :(");
}

async function initGL(canvas, context, wglVersion) {
    console.info(`detected wgl ${wglVersion} meow`);

    const positions = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, positions);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([
        -1.0,  1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0,  1.0, 0.0
    ]), context.STATIC_DRAW);

    const colors = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, colors);
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 1.0, 0.0, 1.0
    ]), context.STATIC_DRAW);

    const elements_indices = [3, 2, 1, 3, 1, 0];
    const elements = context.createBuffer();
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, elements);
    context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements_indices), context.STATIC_DRAW);

    const es_key = wglVersion === 2 ? "es3" : "es1";

    const vertex_shader = context.createShader(context.VERTEX_SHADER);
    let vertex_shader_code = "";
    await fetch(`./assets/shaders/glsl/${es_key}/background/bg.vsh.glsl`)
        .then(response => response.text())
        .then(text => vertex_shader_code = text)
        .catch(error => console.error(error));
    context.shaderSource(vertex_shader, vertex_shader_code);
    context.compileShader(vertex_shader);
    let vertex_shader_log = context.getShaderInfoLog(vertex_shader);
    if (vertex_shader_log == null || vertex_shader_log.trim().length === 0) {
        console.info("vertex shader loaded.");
    } else console.warn(`vertex shader couldn't be loaded! (${vertex_shader_log})`);

    let fragment_shader_code = "";
    await fetch(`./assets/shaders/glsl/${es_key}/background/bg.fsh.glsl`)
        .then(response => response.text())
        .then(text => fragment_shader_code = text)
        .catch(error => console.error(error));
    const fragment_shader = context.createShader(context.FRAGMENT_SHADER);
    context.shaderSource(fragment_shader, fragment_shader_code);
    context.compileShader(fragment_shader);
    let fragment_shader_log = context.getShaderInfoLog(fragment_shader);
    if (fragment_shader_log == null || fragment_shader_log.trim().length === 0) {
        console.info("fragment shader loaded.");
    } else console.warn(`fragment shader couldn't be loaded! (${fragment_shader_log})`);

    const shaderProgram = context.createProgram();
    context.attachShader(shaderProgram, vertex_shader);
    context.attachShader(shaderProgram, fragment_shader);
    context.linkProgram(shaderProgram);
    if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS))
        console.warn("shaders couldn't be linked! :(");
    context.useProgram(shaderProgram);

    const position = context.getAttribLocation(shaderProgram, "position");
    context.enableVertexAttribArray(position);
    context.bindBuffer(context.ARRAY_BUFFER, positions);
    context.vertexAttribPointer(position, 3, context.FLOAT, false, 0, 0);

    const color = context.getAttribLocation(shaderProgram, "color");
    context.enableVertexAttribArray(color);
    context.bindBuffer(context.ARRAY_BUFFER, colors);
    context.vertexAttribPointer(color, 4, context.FLOAT, false, 0, 0);

    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, elements);

    context.clearColor(0.0, 0.0, 0.0, 1.0);
    context.clear(context.COLOR_BUFFER_BIT);
    context.enable(context.DEPTH_TEST);

    const unimloc_matrix = context.getUniformLocation(shaderProgram, "model");
    const default_matrix = new Float32Array([1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]);

    const unimloc_time = context.getUniformLocation(shaderProgram, "time");
    const unimloc_res = context.getUniformLocation(shaderProgram, "resolution");

    function renderLoop(time) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        context.uniformMatrix4fv(unimloc_matrix, false, default_matrix);

        context.uniform1f(unimloc_time, time / 1000.0);
        context.uniform2fv(unimloc_res, [canvas.width, canvas.height]);

        context.viewport(0, 0, canvas.width, canvas.height);
        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        context.drawElements(context.TRIANGLES, elements_indices.length, context.UNSIGNED_SHORT, 0);

        window.requestAnimationFrame(renderLoop);
    };

    window.requestAnimationFrame(renderLoop);
}


async function initWGPU(canvas, context) {
    console.info("detected wgpu");

    async function fallback() {
        console.info("falling back to gl");
        let context;
        const wglVersion = (context = (canvas.getContext("experimental-webgl2") || canvas.getContext("webgl2"))) != null ? 2 : (context = (canvas.getContext("experimental-webgl") || canvas.getContext("webgl"))) != null ? 1 : 0;
        if (wglVersion !== 0) initGL(canvas, context, wglVersion);
        else console.warn("couldn't find webgl, so no-no fancy shader-background. :(");
    }

    if (!navigator.gpu) {
        console.info("wgpu context exists but is not supported.");
        fallback();
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.warn("couldn't find any adapters");
        fallback();
        return;
    }

    const device = await adapter.requestDevice();
    if (!device) {
        console.warn("couldn't find any devices");
        fallback();
        return;
    }

    let shaders = "";
    await fetch("./assets/shaders/wgsl/background/bg.vsh.wgsl")
        .then(response => response.text())
        .then(data => shaders += data)
        .catch(error => console.error(error));
    shaders += '\n';
    await fetch("./assets/shaders/wgsl/background/bg.fsh.wgsl")
        .then(response => response.text())
        .then(data => shaders += data)
        .catch(error => console.error(error));
    const shaderModule = device.createShaderModule({code: shaders});

    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
    });

    const vertices = new Float32Array([1.0, 1.0, 1.0, 1.0]);

    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

    const renderPipeline = device.createRenderPipeline({
        vertex: {
            module: shaderModule,
            entryPoint: 'vertex_main',
            buffers: [{
                attributes: [{
                    shaderLocation: 0, // position
                    offset: 0,
                    format: 'float32x4'
                }, {
                    shaderLocation: 1, // color
                    offset: 16,
                    format: 'float32x4'
                }],
                arrayStride: 32,
                stepMode: 'vertex'
            }]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: navigator.gpu.getPreferredCanvasFormat()
            }]
        },
        primitive: {
            topology: 'triangle-list'
        },
        layout: 'auto'
    });
    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
            clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
            loadOp: 'clear',
            storeOp: 'store',
            view: context.getCurrentTexture().createView()
        }]
    });

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(3);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
}
