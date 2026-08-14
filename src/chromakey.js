/**
 * J1 Chroma Key Renderer & Video Animation Controller
 * Uses high-performance WebGL fragment shader for 60fps green screen removal
 * with despill suppression, smooth edge feathering, and state management.
 */

export class J1HeadController {
  constructor(canvasElement, imgElement = null, videoSrc = '/assets/videos/juanhead.mp4') {
    this.canvas = canvasElement;
    this.img = imgElement;
    this.videoSrc = videoSrc;
    this.video = document.createElement('video');
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.animationFrameId = null;
    this.isTalking = false;
    this.isLoaded = false;
    this.state = 'idle'; // 'idle' | 'thinking' | 'talking'

    // Chroma key parameters (tuned for standard green screen)
    this.keyColor = [0.05, 0.95, 0.15]; // [R, G, B] normalized
    this.similarity = 0.40;             // Threshold
    this.smoothness = 0.10;             // Edge softness
    this.spill = 0.60;                  // Green spill removal factor

    this.onStateChangeCallbacks = [];

    this._initVideo();
    this.setIdle();
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  _notifyState(state) {
    this.state = state;
    this.onStateChangeCallbacks.forEach(cb => cb(state));
  }

  setIdle() {
    this.isTalking = false;
    this._stopLoop();
    if (this.video && !this.video.paused) {
      try {
        this.video.pause();
      } catch (_) {}
    }
    if (this.canvas) this.canvas.style.display = 'none';
    if (this.img) this.img.style.display = 'block';
    this._notifyState('idle');
  }

  setThinking() {
    this.startTalking();
    this._notifyState('thinking');
  }

  setTalking() {
    this.startTalking();
  }

  stopTalking() {
    this.setIdle();
  }

  _initVideo() {
    this.video.crossOrigin = 'anonymous';
    this.video.playsInline = true;
    this.video.webkitPlaysInline = true;
    this.video.muted = true;
    this.video.defaultMuted = true;
    this.video.loop = true;
    this.video.preload = 'auto';
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('webkit-playsinline', '');
    this.video.setAttribute('muted', '');
    this.video.setAttribute('autoplay', '');
    this.video.src = this.videoSrc;

    // Handle initial load
    const handleInit = () => {
      if (!this.isLoaded) {
        this.isLoaded = true;
        this._setupWebGL();
      }
      if (!this.isTalking) {
        if (this.canvas) this.canvas.style.display = 'none';
        if (this.img) this.img.style.display = 'block';
      }
    };

    this.video.addEventListener('loadeddata', handleInit);
    this.video.addEventListener('canplay', handleInit);

    this.video.addEventListener('error', (e) => {
      console.warn('Video failed to load from ' + this.videoSrc + ', trying fallback paths...', e);
      if (!this.video.src.includes('/assets/videos/juanhead.mp4')) {
        this.video.src = '/assets/videos/juanhead.mp4';
      }
    });

    // Touch/click interaction to unlock video playback if needed
    const unlock = () => {
      if (this.video.paused && this.isTalking) {
        this.video.play().catch(() => {});
      }
    };
    document.addEventListener('click', unlock, { passive: true });
    document.addEventListener('touchstart', unlock, { passive: true });
  }

  _setupWebGL() {
    if (this.gl) return; // already initialized

    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    }) || this.canvas.getContext('experimental-webgl');

    if (!gl) {
      console.warn('WebGL not supported, falling back to 2D canvas');
      this._setup2DFallback();
      return;
    }

    this.gl = gl;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Advanced Chroma Key fragment shader with YUV color difference & green despill
    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform vec3 u_keyColor;
      uniform float u_similarity;
      uniform float u_smoothness;
      uniform float u_spill;

      vec3 rgb2yuv(vec3 rgb) {
        float y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        float u = -0.14713 * rgb.r - 0.28886 * rgb.g + 0.436 * rgb.b;
        float v = 0.615 * rgb.r - 0.51499 * rgb.g - 0.10001 * rgb.b;
        return vec3(y, u, v);
      }

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        
        vec3 yuv = rgb2yuv(color.rgb);
        vec3 keyYUV = rgb2yuv(u_keyColor);
        
        // Distance in UV chroma space
        float dist = distance(yuv.yz, keyYUV.yz);
        
        // Smooth edge mask
        float alpha = smoothstep(u_similarity, u_similarity + u_smoothness, dist);
        
        // Despill: suppress green reflection on edges/hair
        float g = color.g;
        float maxRB = max(color.r, color.b);
        if (g > maxRB) {
          color.g = mix(g, maxRB, u_spill);
        }
        
        // Output premultiplied alpha
        gl_FragColor = vec4(color.rgb * alpha, alpha);
      }
    `;

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    // Buffers for full-quad render
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      0, 0,
      1, 1,
      1, 0,
    ]), gl.STATIC_DRAW);

    const texAttr = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texAttr);
    gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 0, 0);

    // Texture setup
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.texture = texture;

    // Uniform locations
    this.uKeyColor = gl.getUniformLocation(program, 'u_keyColor');
    this.uSimilarity = gl.getUniformLocation(program, 'u_similarity');
    this.uSmoothness = gl.getUniformLocation(program, 'u_smoothness');
    this.uSpill = gl.getUniformLocation(program, 'u_spill');

    this._updateUniforms();
  }

  _updateUniforms() {
    if (!this.gl || !this.program) return;
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform3fv(this.uKeyColor, this.keyColor);
    gl.uniform1f(this.uSimilarity, this.similarity);
    gl.uniform1f(this.uSmoothness, this.smoothness);
    gl.uniform1f(this.uSpill, this.spill);
  }

  setParameters({ similarity, smoothness, spill, keyColor }) {
    if (similarity !== undefined) this.similarity = similarity;
    if (smoothness !== undefined) this.smoothness = smoothness;
    if (spill !== undefined) this.spill = spill;
    if (keyColor !== undefined) this.keyColor = keyColor;
    this._updateUniforms();
    if (!this.isTalking) {
      this._renderStaticFrame();
    }
  }

  _setup2DFallback() {
    this.ctx2d = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  _renderFrame() {
    if (!this.video || this.video.readyState < 2) return;

    if (this.video.videoWidth && this.video.videoHeight) {
      if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      }
    }

    const width = this.canvas.width || 480;
    const height = this.canvas.height || 270;

    if (this.gl) {
      const gl = this.gl;
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else if (this.ctx2d) {
      // 2D Canvas Fallback
      const ctx = this.ctx2d;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(this.video, 0, 0, width, height);

      const frame = ctx.getImageData(0, 0, width, height);
      const l = frame.data.length / 4;

      for (let i = 0; i < l; i++) {
        const r = frame.data[i * 4 + 0];
        const g = frame.data[i * 4 + 1];
        const b = frame.data[i * 4 + 2];

        if (g > 90 && g > r * 1.2 && g > b * 1.2) {
          frame.data[i * 4 + 3] = 0;
        }
      }
      ctx.putImageData(frame, 0, 0);
    }
  }

  _renderStaticFrame() {
    this._lastRenderedTime = -1;
    if (this.video.readyState >= 2) {
      this._renderFrame(true);
    } else {
      const onReady = () => {
        this._renderFrame(true);
        this.video.removeEventListener('loadeddata', onReady);
        this.video.removeEventListener('canplay', onReady);
      };
      this.video.addEventListener('loadeddata', onReady);
      this.video.addEventListener('canplay', onReady);
    }

    setTimeout(() => this._renderFrame(true), 50);
    setTimeout(() => this._renderFrame(true), 150);
    setTimeout(() => this._renderFrame(true), 300);
  }

  _startLoop() {
    if (this._isLoopRunning) return;
    this._isLoopRunning = true;

    const loop = () => {
      if (!this._isLoopRunning) return;
      this._renderFrame();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  _stopLoop() {
    this._isLoopRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Start talking animation (loops the video while AI is generating tokens)
   */
  startTalking() {
    this.isTalking = true;
    if (this.img) this.img.style.display = 'none';
    if (this.canvas) this.canvas.style.display = 'block';
    this._notifyState('talking');

    if (!this.gl) {
      this._setupWebGL();
    }

    try {
      const playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this._startLoop();
        }).catch((err) => {
          console.warn('Video play catch:', err);
          this._startLoop();
        });
      } else {
        this._startLoop();
      }
    } catch (_) {
      this._startLoop();
    }
  }

  /**
   * Stop talking animation (smoothly pauses video and resets back to idle image)
   */
  stopTalking() {
    this.setIdle();
  }

  /**
   * Interactive easter egg when user taps/clicks Juan's head
   */
  poke() {
    this.startTalking();
    setTimeout(() => {
      if (!this.isTalking) return;
      this.setIdle();
    }, 2000);
  }
}
