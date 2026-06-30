import { useEffect, useRef, type MutableRefObject } from 'react'

type BrainSceneProps = {
  progress: number
  pointer: { x: number; y: number }
  reducedMotion: boolean
  onSupportChange: (supported: boolean) => void
}

type RendererState = {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  buffer: WebGLBuffer
  count: number
  locations: {
    progress: WebGLUniformLocation | null
    time: WebGLUniformLocation | null
    pointer: WebGLUniformLocation | null
    resolution: WebGLUniformLocation | null
    pixelRatio: WebGLUniformLocation | null
  }
}

const vertexShaderSource = `#version 300 es
in vec4 a_particle;
uniform float u_progress;
uniform float u_time;
uniform vec2 u_pointer;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
out float v_heat;
out float v_seed;

mat3 rotateX(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat3(1.0,0.0,0.0,0.0,c,-s,0.0,s,c);
}

mat3 rotateY(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat3(c,0.0,s,0.0,1.0,0.0,-s,0.0,c);
}

void main() {
  vec3 p = a_particle.xyz;
  float seed = a_particle.w;
  float dataPhase = smoothstep(0.18, 0.4, u_progress) * (1.0 - smoothstep(0.42, 0.54, u_progress));
  float riskPhase = smoothstep(0.38, 0.58, u_progress) * (1.0 - smoothstep(0.62, 0.74, u_progress));
  float corePhase = smoothstep(0.58, 0.8, u_progress) * (1.0 - smoothstep(0.84, 0.94, u_progress));
  float execPhase = smoothstep(0.78, 1.0, u_progress);
  float breathing = sin(u_time * 1.8 + seed * 6.2831) * 0.035;
  float pulse = sin(length(p.xy) * 9.0 - u_time * 4.0) * 0.07 * corePhase;

  p *= 1.0 + breathing + pulse;
  p.z += dataPhase * 0.45 * sin(seed * 23.0 + u_time * 1.7);
  p.x *= 1.0 - execPhase * 0.08;
  p.y *= 1.0 - execPhase * 0.06;

  float angleY = u_time * 0.06 + u_progress * 2.75 + u_pointer.x * 0.14;
  float angleX = -0.15 + u_pointer.y * 0.09 + riskPhase * 0.28 - corePhase * 0.18;
  vec3 rp = rotateY(angleY) * rotateX(angleX) * p;

  float cameraZ = mix(4.8, 3.35, smoothstep(0.18, 0.42, u_progress));
  cameraZ = mix(cameraZ, 2.55, smoothstep(0.58, 0.76, u_progress));
  cameraZ = mix(cameraZ, 4.95, execPhase);
  float perspective = 2.25 / (cameraZ - rp.z);
  vec2 projected = rp.xy * perspective;
  projected.x *= u_resolution.y / u_resolution.x;

  v_heat = riskPhase * smoothstep(0.15, 0.98, sin(seed * 35.0 + rp.x * 3.0 + rp.y * 4.0) * 0.5 + 0.5);
  v_heat = max(v_heat, execPhase * 0.55);
  v_seed = seed;

  gl_Position = vec4(projected, 0.0, 1.0);
  gl_PointSize = (0.82 + dataPhase * 0.28 + corePhase * 0.22 + execPhase * 0.24 + v_heat * 0.42) * u_pixelRatio;
}
`

const fragmentShaderSource = `#version 300 es
precision highp float;
in float v_heat;
in float v_seed;
uniform float u_progress;
out vec4 outColor;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.08, d);
  vec3 cyan = vec3(0.22, 0.74, 0.98);
  vec3 blue = vec3(0.10, 0.23, 0.62);
  vec3 green = vec3(0.13, 0.90, 0.63);
  vec3 amber = vec3(0.96, 0.62, 0.04);
  vec3 red = vec3(1.0, 0.12, 0.27);
  vec3 platinum = vec3(0.82, 0.88, 0.92);
  vec3 gold = vec3(1.0, 0.78, 0.34);
  float riskPhase = smoothstep(0.4, 0.58, u_progress) * (1.0 - smoothstep(0.62, 0.76, u_progress));
  float execPhase = smoothstep(0.8, 1.0, u_progress);
  vec3 base = mix(blue, cyan, fract(v_seed * 13.7));
  base = mix(base, green, smoothstep(0.18, 0.42, u_progress) * 0.36);
  base = mix(base, mix(amber, red, smoothstep(0.62, 0.92, v_heat)), riskPhase * v_heat);
  base = mix(base, mix(platinum, gold, fract(v_seed * 9.0)), execPhase * 0.82);
  float sceneOpacity = mix(0.34, 0.46, smoothstep(0.18, 0.9, u_progress));
  outColor = vec4(base * 0.82, alpha * sceneOpacity * (0.78 + v_heat * 0.18));
}
`

const compileShader = (gl: WebGL2RenderingContext, source: string, type: number) => {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Shader oluşturulamadı')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader derlenemedi')
  }
  return shader
}

const createProgram = (gl: WebGL2RenderingContext) => {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (!program) throw new Error('WebGL programı oluşturulamadı')
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.bindAttribLocation(program, 0, 'a_particle')
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'WebGL programı linklenemedi')
  }
  return program
}

const particleCount = () => {
  if (window.innerWidth < 640) return 5500
  if (window.innerWidth < 1024) return 12000
  return 24000
}

const generateBrainParticles = (count: number) => {
  const data = new Float32Array(count * 4)
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1
    const u = Math.random()
    const v = Math.random()
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * v - 1)
    const lobe = 0.68 + Math.random() * 0.42
    const groove = 1 - 0.12 * Math.sin(theta * 5.0) * Math.sin(phi * 4.0)
    const x = side * (0.34 + Math.sin(phi) * Math.cos(theta) * 0.62 * lobe) * groove
    const y = Math.cos(phi) * 0.78 * lobe + Math.sin(theta * 3.0) * 0.045
    const z = Math.sin(phi) * Math.sin(theta) * 0.72 * lobe - Math.abs(x) * 0.08
    const stem = Math.random() < 0.08
    data[i * 4] = stem ? (Math.random() - 0.5) * 0.28 : x
    data[i * 4 + 1] = stem ? -0.64 - Math.random() * 0.32 : y
    data[i * 4 + 2] = stem ? (Math.random() - 0.5) * 0.18 : z
    data[i * 4 + 3] = Math.random()
  }
  return data
}

const setupRenderer = (canvas: HTMLCanvasElement): RendererState | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })
  if (!gl) return null
  const program = createProgram(gl)
  const buffer = gl.createBuffer()
  if (!buffer) throw new Error('Particle buffer oluşturulamadı')
  const count = particleCount()
  const particles = generateBrainParticles(count)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, particles, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.disable(gl.DEPTH_TEST)
  return {
    gl,
    program,
    buffer,
    count,
    locations: {
      progress: gl.getUniformLocation(program, 'u_progress'),
      time: gl.getUniformLocation(program, 'u_time'),
      pointer: gl.getUniformLocation(program, 'u_pointer'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      pixelRatio: gl.getUniformLocation(program, 'u_pixelRatio'),
    },
  }
}

const resizeCanvas = (canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = Math.max(Math.floor(canvas.clientWidth * dpr), 1)
  const height = Math.max(Math.floor(canvas.clientHeight * dpr), 1)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  gl.viewport(0, 0, width, height)
  return dpr
}

export function BrainScene({ progress, pointer, reducedMotion, onSupportChange }: BrainSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<RendererState | null>(null)
  const progressRef = useRef(progress)
  const pointerRef = useRef(pointer)
  const supportRef = useRef(onSupportChange)

  useEffect(() => {
    progressRef.current = progress
    pointerRef.current = pointer
    supportRef.current = onSupportChange
  }, [progress, pointer, onSupportChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    let animation = 0

    try {
      const state = setupRenderer(canvas)
      stateRef.current = state
      if (!state) {
        supportRef.current(false)
        return undefined
      }
      supportRef.current(true)
      const startedAt = performance.now()
      let lastFrame = 0
      const minFrameMs = window.innerWidth < 1024 ? 1000 / 30 : 1000 / 60

      const render = (now: number) => {
        animation = window.requestAnimationFrame(render)
        if (document.hidden || now - lastFrame < minFrameMs) return
        lastFrame = now
        const activeState = stateRef.current
        if (!activeState) return
        const { gl, program, locations, count } = activeState
        const dpr = resizeCanvas(canvas, gl)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(program)
        gl.uniform1f(locations.progress, progressRef.current)
        gl.uniform1f(locations.time, reducedMotion ? 0 : (performance.now() - startedAt) / 1000)
        gl.uniform2f(locations.pointer, pointerRef.current.x, pointerRef.current.y)
        gl.uniform2f(locations.resolution, canvas.width, canvas.height)
        gl.uniform1f(locations.pixelRatio, dpr)
        gl.drawArrays(gl.POINTS, 0, count)
      }

      animation = window.requestAnimationFrame(render)
    } catch {
      supportRef.current(false)
    }

    return () => {
      window.cancelAnimationFrame(animation)
      const state = stateRef.current
      if (state) {
        state.gl.deleteBuffer(state.buffer)
        state.gl.deleteProgram(state.program)
      }
      stateRef.current = null
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef as MutableRefObject<HTMLCanvasElement>} className="akop-intel-canvas" aria-hidden="true" />
}
