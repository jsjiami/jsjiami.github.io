const sourceCode = document.querySelector('#code');
const outputCode = document.querySelector('#encode');
const inputLines = document.querySelector('#input-lines');
const outputLines = document.querySelector('#output-lines');
const resultEmpty = document.querySelector('#result-empty');
const encryptButton = document.querySelector('#obfuscate');
const resultStatus = document.querySelector('#result-status');
const resultStats = document.querySelector('#result-stats');
const sourceStats = document.querySelector('#source-stats');
const optionInputs = [...document.querySelectorAll('input[name="option"]')];
const presetButtons = [...document.querySelectorAll('[data-preset]')];
const toast = document.querySelector('#toast');
const toastText = document.querySelector('#toast-text');
let toastTimer;

const createLines = (value) => Array.from({ length: Math.max(1, value.split('\n').length) }, (_, i) => i + 1).join('<br>');

function updateSourceStats() {
  const lines = sourceCode.value.split('\n').length;
  inputLines.innerHTML = createLines(sourceCode.value);
  sourceStats.textContent = `${lines} LINES · ${sourceCode.value.length} CHARS`;
}

const presets = {
  light: new Set(['stringUnicode', 'memberExpression', 'renameLocals']),
  balanced: new Set([
    'stringArray',
    'stringReverse',
    'stringUnicode',
    'memberExpression',
    'numericLiteral',
    'binaryExpression',
    'booleanLiteral',
    'assignmentJunk',
    'zombieCode',
    'renameLocals'
  ]),
  maximum: new Set([
    'stringArray',
    'stringReverse',
    'stringUnicode',
    'memberExpression',
    'numericLiteral',
    'binaryExpression',
    'booleanLiteral',
    'assignmentJunk',
    'zombieCode',
    'controlFlow',
    'eval',
    'renameGlobals',
    'renameLocals',
    'compact'
  ])
};

function bundleOptions() {
  const active = new Set(optionInputs.filter((input) => input.checked).map((input) => input.value));
  return {
    stringArray: active.has('stringArray'),
    stringReverse: active.has('stringReverse'),
    stringUnicode: active.has('stringUnicode'),
    memberExpression: active.has('memberExpression'),
    numericLiteral: active.has('numericLiteral'),
    binaryExpression: active.has('binaryExpression'),
    booleanLiteral: active.has('booleanLiteral'),
    assignmentJunk: active.has('assignmentJunk'),
    zombieCode: active.has('zombieCode'),
    controlFlow: active.has('controlFlow'),
    eval: active.has('eval'),
    renameGlobals: active.has('renameGlobals'),
    renameLocals: active.has('renameLocals'),
    comments: active.has('comments'),
    compact: active.has('compact')
  };
}

function updateProfile(name = 'custom') {
  const active = optionInputs.filter((input) => input.checked).length;
  const value = Math.min(98, 36 + active * 3.4);
  const labels = { light: '轻度', balanced: '均衡', maximum: '最强', custom: '自定义' };
  const descriptions = { light: '适合快速处理', balanced: '推荐用于网页发布', maximum: '启用完整保护策略', custom: '当前为自定义配置' };
  document.querySelector('#profile-score').textContent = Math.round(value);
  document.querySelector('.cn-score-orb').style.background = `conic-gradient(var(--cyan) 0 ${value}%, #1b2936 ${value}%)`;
  document.querySelector('#profile-label').textContent = labels[name] || labels.custom;
  document.querySelector('#profile-description').textContent = descriptions[name] || descriptions.custom;
  document.querySelector('#module-count').textContent = `${active} / ${optionInputs.length}`;
  document.querySelector('#size-impact').textContent = `+${Math.round(active * 1.8)}%`;
  presetButtons.forEach((button) => button.classList.toggle('active', button.dataset.preset === name));
}

function applyPreset(name) {
  const preset = presets[name];
  optionInputs.forEach((input) => {
    input.checked = preset.has(input.value);
  });
  updateProfile(name);
}

function showToast(message) {
  toastText.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

sourceCode.addEventListener('input', updateSourceStats);
sourceCode.addEventListener('scroll', () => { inputLines.scrollTop = sourceCode.scrollTop; });
optionInputs.forEach((input) => input.addEventListener('change', () => updateProfile('custom')));
presetButtons.forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));

document.querySelector('#clear-btn').addEventListener('click', () => {
  sourceCode.value = '';
  updateSourceStats();
  sourceCode.focus();
  showToast('源代码已清空');
});

document.querySelector('#upload-btn').addEventListener('click', () => document.querySelector('#file-input').click());
document.querySelector('#file-input').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return showToast('文件不能超过 2MB');
  sourceCode.value = await file.text();
  updateSourceStats();
  showToast(`已导入 ${file.name}`);
});

document.querySelector('#reset-options').addEventListener('click', () => {
  applyPreset('balanced');
  showToast('已恢复默认配置');
});

encryptButton.addEventListener('click', () => {
  const code = sourceCode.value.trim();
  if (!code) {
    sourceCode.focus();
    showToast('请先输入 JavaScript 代码');
    return;
  }
  const workspaceShell = document.querySelector('.workspace-shell');
  const pipelineSteps = [...document.querySelectorAll('.workspace-pipeline span')];
  workspaceShell.classList.remove('complete');
  workspaceShell.classList.add('processing');
  pipelineSteps.forEach((step) => step.classList.remove('current'));
  pipelineSteps[1]?.classList.add('done');
  pipelineSteps[2]?.classList.add('current');
  encryptButton.classList.add('loading');
  resultStatus.textContent = 'PROCESSING';
  setTimeout(() => {
    try {
      const engine = window.JavaScriptObfuscatorLite;
      if (!engine || typeof engine.obfuscate !== 'function') {
        throw new Error('混淆引擎未加载，请刷新页面重试');
      }
      const result = engine.obfuscate(code, bundleOptions());
      if (!result) throw new Error('无法混淆此代码，请检查语法');
      outputCode.value = result;
      outputLines.innerHTML = createLines(result);
      resultEmpty.classList.add('hidden');
      resultStatus.textContent = 'COMPLETE';
      resultStats.textContent = `${result.split('\n').length} LINES · ${result.length} CHARS`;
      encryptButton.classList.remove('loading');
      workspaceShell.classList.remove('processing');
      workspaceShell.classList.add('complete');
      pipelineSteps[2]?.classList.remove('current');
      pipelineSteps[2]?.classList.add('done');
      setTimeout(() => workspaceShell.classList.remove('complete'), 900);
      showToast('JS 加密完成');
      if (window.innerWidth < 1180) document.querySelector('#result-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      resultStatus.textContent = 'ERROR';
      resultEmpty.classList.remove('hidden');
      encryptButton.classList.remove('loading');
      workspaceShell.classList.remove('processing');
      pipelineSteps[2]?.classList.remove('current');
      showToast(error.message || '无法混淆此代码');
    }
  }, 720);
});

document.querySelector('#copy-btn').addEventListener('click', async () => {
  if (resultEmpty.classList.contains('hidden') === false) return showToast('暂无可复制结果');
  try {
    await navigator.clipboard.writeText(outputCode.value);
  } catch {
    outputCode.select();
    document.execCommand('copy');
  }
  showToast('加密结果已复制');
});

document.querySelector('#save-btn').addEventListener('click', () => {
  if (!resultEmpty.classList.contains('hidden')) return showToast('暂无可保存结果');
  const blob = new Blob([outputCode.value], { type: 'text/javascript;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'encrypted.js';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('已生成 encrypted.js');
});

document.querySelector('.menu-button').addEventListener('click', (event) => {
  const nav = document.querySelector('.nav');
  const open = nav.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', () => document.querySelector('.nav').classList.remove('open')));

window.addEventListener('load', () => {
  const pageLoader = document.querySelector('#page-loader');
  window.setTimeout(() => {
    document.body.classList.remove('is-loading');
    pageLoader?.classList.add('is-complete');
  }, 320);
}, { once: true });

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#session-id').textContent = `${Math.random().toString(16).slice(2,6).toUpperCase()}—${Math.random().toString(16).slice(2,6).toUpperCase()}`;
updateSourceStats();
applyPreset('balanced');

// Visual system V2: interactive obfuscation reactor.
const pointerHalo = document.querySelector('#pointer-halo');
const reactor = document.querySelector('#reactor');
const reactorCanvas = document.querySelector('#reactor-canvas');
const entropyReadout = document.querySelector('#entropy-readout');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (pointerHalo && !prefersReducedMotion) {
  window.addEventListener('pointermove', (event) => {
    pointerHalo.style.transform = `translate(${event.clientX - 215}px, ${event.clientY - 215}px)`;
  }, { passive: true });
}

if (reactor && reactorCanvas) {
  const reactorContext = reactorCanvas.getContext('2d');
  const reactorNodes = Array.from({ length: 38 }, (_, index) => ({
    angle: (index / 38) * Math.PI * 2 + (index % 4) * .13,
    radius: .21 + ((index * 17) % 29) / 100,
    speed: .000015 + (index % 7) * .000002,
    size: index % 9 === 0 ? 1.8 : .75,
    offset: ((index * 31) % 100) / 100
  }));
  let reactorWidth = 0;
  let reactorHeight = 0;
  let reactorPixelRatio = 1;
  let pointerX = 0;
  let pointerY = 0;

  const resizeReactor = () => {
    const bounds = reactorCanvas.getBoundingClientRect();
    reactorPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    reactorWidth = bounds.width;
    reactorHeight = bounds.height;
    reactorCanvas.width = Math.round(reactorWidth * reactorPixelRatio);
    reactorCanvas.height = Math.round(reactorHeight * reactorPixelRatio);
    reactorContext.setTransform(reactorPixelRatio, 0, 0, reactorPixelRatio, 0, 0);
  };

  const drawReactor = (time = 0) => {
    const width = reactorWidth;
    const height = reactorHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height);
    reactorContext.clearRect(0, 0, width, height);
    reactorContext.save();
    reactorContext.translate(pointerX * 5, pointerY * 5);

    const points = reactorNodes.map((node) => {
      const phase = node.angle + time * node.speed * (node.offset > .5 ? 1 : -1);
      return {
        x: centerX + Math.cos(phase) * scale * node.radius,
        y: centerY + Math.sin(phase) * scale * node.radius,
        size: node.size,
        pulse: .45 + Math.sin(time * .0015 + node.offset * 8) * .25
      };
    });

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < scale * .13) {
          reactorContext.beginPath();
          reactorContext.moveTo(points[i].x, points[i].y);
          reactorContext.lineTo(points[j].x, points[j].y);
          reactorContext.strokeStyle = `rgba(70, 222, 241, ${(.13 - distance / scale) * 1.8})`;
          reactorContext.lineWidth = .5;
          reactorContext.stroke();
        }
      }
    }

    points.forEach((point, index) => {
      reactorContext.beginPath();
      reactorContext.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      reactorContext.fillStyle = index % 7 === 0
        ? `rgba(144, 98, 255, ${point.pulse + .2})`
        : `rgba(58, 242, 255, ${point.pulse})`;
      reactorContext.fill();
      if (point.size > 1) {
        reactorContext.beginPath();
        reactorContext.arc(point.x, point.y, 5, 0, Math.PI * 2);
        reactorContext.strokeStyle = 'rgba(58, 242, 255, .13)';
        reactorContext.stroke();
      }
    });

    reactorContext.restore();
    if (!prefersReducedMotion) requestAnimationFrame(drawReactor);
  };

  reactor.addEventListener('pointermove', (event) => {
    const bounds = reactor.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - .5;
    pointerY = (event.clientY - bounds.top) / bounds.height - .5;
    reactor.style.transform = `perspective(1000px) rotateX(${-pointerY * 2.6}deg) rotateY(${pointerX * 2.6}deg)`;
  }, { passive: true });
  reactor.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
    reactor.style.transform = '';
  });

  resizeReactor();
  new ResizeObserver(resizeReactor).observe(reactorCanvas);
  drawReactor();

  if (!prefersReducedMotion && entropyReadout) {
    setInterval(() => {
      entropyReadout.textContent = `${(92.3 + Math.random() * 1.1).toFixed(1)}%`;
    }, 1800);
  }
}

const revealTargets = [
  ...document.querySelectorAll('.section-heading, .workspace-shell, .capability-intro, .capability-grid article, .tool-links a')
];
revealTargets.forEach((element, index) => {
  element.dataset.reveal = '';
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
});

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .09, rootMargin: '0px 0px -40px' });
  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add('revealed'));
}
