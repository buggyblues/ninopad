const year = document.querySelector('[data-year]');
const releaseLinks = document.querySelectorAll('[data-release-link]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (year) year.textContent = new Date().getFullYear();

// Language persistence
document.querySelectorAll('[data-lang-switch]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const href = btn.getAttribute('href') || '';
    const isEn = href.includes('/en');
    try {
      localStorage.setItem('ninopad_lang', isEn ? 'en' : 'zh');
    } catch (_) {}
  });
});

fetch('https://api.github.com/repos/buggyblues/ninopad/releases/latest', {
  headers: { Accept: 'application/vnd.github+json' }
})
  .then((response) => response.ok ? response.json() : Promise.reject(new Error('No release')))
  .then((release) => {
    const dmg = release.assets?.find((asset) => asset.name.toLowerCase().endsWith('.dmg'));
    const href = dmg?.browser_download_url || release.html_url;
    releaseLinks.forEach((link) => { link.href = href; });
  })
  .catch(() => {
    releaseLinks.forEach((link) => {
      link.href = 'https://github.com/buggyblues/ninopad/releases';
    });
  });

const initPlatformDownloads = () => {
  const pickers = [...document.querySelectorAll('[data-platform-download]')];
  if (!pickers.length) return;

  const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
  const isIPad = /iPad/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const initialPlatform = isIPhone ? 'iphone' : isIPad ? 'ipad' : /Mac/.test(navigator.platform) ? 'mac' : 'iphone';

  const select = (platform) => {
    pickers.forEach((picker) => {
      picker.querySelectorAll('[data-download-platform]').forEach((tab) => {
        const selected = tab.dataset.downloadPlatform === platform;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      picker.querySelectorAll('[data-download-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.downloadPanel !== platform;
      });
    });
  };

  pickers.forEach((picker) => {
    const tablist = picker.querySelector('[role="tablist"]');
    const tabs = [...tablist.querySelectorAll('[data-download-platform]')];
    tablist.hidden = false;
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab.dataset.downloadPlatform));
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next].dataset.downloadPlatform);
        tabs[next].focus();
      });
    });
  });
  select(initialPlatform);
};
initPlatformDownloads();

const initMobileNav = () => {
  const toggle = document.querySelector('[data-mobile-nav-toggle]');
  const drawer = document.querySelector('[data-mobile-drawer]');
  const backdrop = document.querySelector('[data-mobile-drawer-backdrop]');
  const links = document.querySelectorAll('[data-mobile-nav-link]');
  if (!toggle || !drawer) return;

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    if (backdrop) backdrop.setAttribute('aria-hidden', String(!open));
  };

  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('nav-open');
    setOpen(!isOpen);
  });

  if (backdrop) {
    backdrop.addEventListener('click', () => setOpen(false));
  }

  links.forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && document.body.classList.contains('nav-open')) {
      setOpen(false);
    }
  }, { passive: true });
};
initMobileNav();

const initLayoutTabs = () => {
  const tabs = Array.from(document.querySelectorAll('.knob-tick[data-image]'));
  const nodeItems = Array.from(document.querySelectorAll('.knob-node-item'));
  const panel = document.querySelector('#layout-panel');
  const preview = document.querySelector('[data-layout-image]');
  const name = document.querySelector('[data-layout-name]');
  const description = document.querySelector('[data-layout-description]');
  const tutorialLinks = document.querySelectorAll('[data-layout-guide]');
  const ledIndex = document.querySelector('[data-led-index]');
  const ledBody = document.querySelector('.led-screen-body');
  const caption = preview?.nextElementSibling;
  const animTargets = [preview, ledBody, caption].filter(Boolean);

  const knob = document.querySelector('#layout-knob');
  const knobBody = knob?.querySelector('.knob-dial-body');
  const knobMount = document.querySelector('.knob-rotary-mount');
  const knobIcon = document.querySelector('[data-knob-icon]');
  const knobHubName = document.querySelector('[data-knob-hub-name]');

  if (!tabs.length || !panel || !preview || !name || !description) return;

  const isEn = document.documentElement.lang === 'en';

  const dismissInvitation = () => {
    if (knob && knob.classList.contains('is-inviting')) {
      knob.classList.remove('is-inviting');
      if (knobBody) {
        knobBody.style.animation = 'none';
      }
    }
  };

  const preload = () => {
    [...new Set(tabs.map((tab) => tab.dataset.image))].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(preload);
  else window.setTimeout(preload, 500);

  const getAngleForIndex = (index, total = tabs.length) => {
    if (total <= 1) return 0;
    return -135 + (index / (total - 1)) * 270;
  };

  const layoutPerimeterNodes = () => {
    if (!knobMount || !nodeItems.length) return;
    const mountWidth = knobMount.clientWidth;
    const radius = Math.max(68, mountWidth / 2 - (mountWidth < 260 ? 10 : 14));

    nodeItems.forEach((item, index) => {
      const angle = getAngleForIndex(index, tabs.length);
      const tick = item.querySelector('.knob-tick');
      if (tick) {
        tick.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translate(0, -${radius}px)`;
      }
    });
  };

  layoutPerimeterNodes();

  const commit = (tab) => {
    preview.src = tab.dataset.image;
    preview.alt = tab.dataset.alt;
    name.textContent = tab.dataset.name;
    description.textContent = tab.dataset.description;
    panel.setAttribute('aria-labelledby', tab.id);
  };

  const updateKnobReadout = (tab, index, total) => {
    if (knobIcon && tab.dataset.icon) {
      knobIcon.src = tab.dataset.icon;
    }
    if (knobHubName) knobHubName.textContent = tab.dataset.name;
    if (ledIndex) {
      const cur = String(index + 1).padStart(2, '0');
      const tot = String(total).padStart(2, '0');
      ledIndex.textContent = `${cur} / ${tot}`;
    }
    if (knob) {
      knob.setAttribute('aria-valuenow', String(index + 1));
      knob.setAttribute('aria-valuemax', String(total));
      knob.setAttribute('aria-valuetext', tab.dataset.name);
    }
    nodeItems.forEach((node, i) => {
      node.classList.toggle('is-active', i === index);
    });
  };

  const select = (tab, animateKnob = true, moveFocus = false) => {
    if (!tab) return;
    const index = tabs.indexOf(tab);
    if (index === -1) return;

    dismissInvitation();

    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });

    if (moveFocus) tab.focus();

    tutorialLinks.forEach((link) => {
      link.href = tab.dataset.blogHref;
      link.setAttribute('aria-label', isEn ? `Read ${tab.dataset.name} Layout Guide` : `阅读${tab.dataset.name}布局教程`);
      if (link.hasAttribute('data-layout-guide-label')) {
        link.textContent = isEn ? `Read ${tab.dataset.name} Layout Tutorial →` : `阅读${tab.dataset.name}布局教程 →`;
      }
    });

    updateKnobReadout(tab, index, tabs.length);

    const targetAngle = getAngleForIndex(index, tabs.length);
    if (knobBody) {
      if (animateKnob && window.gsap && !prefersReducedMotion) {
        window.gsap.killTweensOf(knobBody);
        window.gsap.to(knobBody, {
          rotation: targetAngle,
          duration: 0.35,
          ease: 'back.out(1.4)'
        });
      } else {
        knobBody.style.transform = `rotate(${targetAngle}deg)`;
      }
    }

    if (!window.gsap || prefersReducedMotion) {
      commit(tab);
      return;
    }

    window.gsap.killTweensOf(animTargets);
    window.gsap.to(animTargets, {
      autoAlpha: 0,
      y: 8,
      duration: .14,
      ease: 'power2.in',
      onComplete: () => {
        commit(tab);
        window.gsap.fromTo(animTargets, {
          autoAlpha: 0,
          y: 10
        }, {
          autoAlpha: 1,
          y: 0,
          duration: .3,
          stagger: .02,
          ease: 'power3.out',
          clearProps: 'transform'
        });
      }
    });
  };

  const step = (delta) => {
    const currentSelected = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
    const currentIndex = tabs.indexOf(currentSelected);
    const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
    select(tabs[nextIndex], true);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  // Knob Drag & Tap Interaction
  if (knob && knobBody) {
    let isDragging = false;
    let didDragMove = false;
    let startX = 0;
    let startY = 0;
    let pointerDownTime = 0;

    const onPointerDown = (e) => {
      dismissInvitation();
      isDragging = true;
      didDragMove = false;
      startX = e.clientX;
      startY = e.clientY;
      pointerDownTime = Date.now();
      knob.setPointerCapture?.(e.pointerId);
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
    };

    const updateDrag = (e) => {
      if (!isDragging) return;
      const rect = knob.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let deg = rad * (180 / Math.PI) + 90;
      while (deg > 180) deg -= 360;
      while (deg < -180) deg += 360;

      const clampedDeg = Math.max(-135, Math.min(135, deg));
      const progress = (clampedDeg + 135) / 270;
      const targetIndex = Math.max(0, Math.min(tabs.length - 1, Math.round(progress * (tabs.length - 1))));
      const targetTab = tabs[targetIndex];

      knobBody.style.transform = `rotate(${clampedDeg}deg)`;

      if (targetTab && targetTab.getAttribute('aria-selected') !== 'true') {
        select(targetTab, false);
        if (navigator.vibrate) navigator.vibrate(6);
      }
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > 6) {
        didDragMove = true;
        e.preventDefault();
        updateDrag(e);
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      window.removeEventListener('pointermove', onPointerMove);

      const duration = Date.now() - pointerDownTime;
      if (!didDragMove && duration < 500) {
        // Tapped on the knob without dragging -> switch to next layout!
        step(1);
        return;
      }

      const currentSelected = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
      const currentIndex = tabs.indexOf(currentSelected);
      const snapAngle = getAngleForIndex(currentIndex, tabs.length);

      if (window.gsap && !prefersReducedMotion) {
        window.gsap.to(knobBody, {
          rotation: snapAngle,
          duration: 0.28,
          ease: 'back.out(1.5)'
        });
      } else {
        knobBody.style.transform = `rotate(${snapAngle}deg)`;
      }
    };

    knob.addEventListener('pointerdown', onPointerDown);

    // Mouse wheel on knob
    const onWheel = (e) => {
      dismissInvitation();
      e.preventDefault();
      step(e.deltaY > 0 ? 1 : -1);
    };
    knob.addEventListener('wheel', onWheel, { passive: false });
    knob.addEventListener('mouseenter', dismissInvitation, { once: true });
  }

  // Keyboard navigation on knob & tabs
  knob?.addEventListener('keydown', (event) => {
    dismissInvitation();
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      if (tabs.length) select(tabs[0], true);
    } else if (event.key === 'End') {
      event.preventDefault();
      if (tabs.length) select(tabs[tabs.length - 1], true);
    }
  });

  // Swipe gesture on preview frame
  const previewFrame = document.querySelector('.layout-preview-frame');
  if (previewFrame) {
    let touchStartX = 0;
    let touchStartY = 0;
    previewFrame.addEventListener('touchstart', (e) => {
      dismissInvitation();
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    previewFrame.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          step(dx < 0 ? 1 : -1);
        }
      }
    }, { passive: true });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      dismissInvitation();
      select(tab, true);
    });
    tab.addEventListener('keydown', (event) => {
      dismissInvitation();
      const index = tabs.indexOf(tab);
      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      select(tabs[nextIndex], true, true);
    });
  });

  // Select initial tab
  const initial = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
  select(initial, false);

  window.addEventListener('resize', () => {
    layoutPerimeterNodes();
  }, { passive: true });
};

const initRemoteShowcase = () => {
  const tabs = Array.from(document.querySelectorAll('.remote-nav-item'));
  const panel = document.querySelector('#remote-panel');
  const img = document.querySelector('[data-remote-display-img]');
  const tag = document.querySelector('[data-remote-display-tag]');
  const title = document.querySelector('[data-remote-display-title]');
  const desc = document.querySelector('[data-remote-display-desc]');
  if (!tabs.length || !panel || !img || !title || !desc) return;

  const preload = () => {
    tabs.forEach((tab) => {
      const src = tab.dataset.remoteImg;
      if (src) {
        const image = new Image();
        image.src = src;
      }
    });
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(preload);
  else window.setTimeout(preload, 500);

  const selectTab = (tab) => {
    if (!tab) return;
    tabs.forEach((t) => {
      const isCurrent = t === tab;
      t.classList.toggle('is-active', isCurrent);
      t.setAttribute('aria-selected', String(isCurrent));
      t.tabIndex = isCurrent ? 0 : -1;
    });

    if (!window.gsap || prefersReducedMotion) {
      img.src = tab.dataset.remoteImg;
      img.alt = tab.dataset.remoteTitle || '';
      if (tag) tag.innerHTML = `<span class="badge-dot"></span> ${tab.dataset.remoteTag || ''}`;
      title.textContent = tab.dataset.remoteTitle || '';
      desc.textContent = tab.dataset.remoteDesc || '';
      panel.setAttribute('aria-labelledby', tab.id);
      return;
    }

    window.gsap.killTweensOf([img, title, desc]);
    window.gsap.to([img, title, desc], {
      autoAlpha: 0,
      scale: 0.98,
      duration: 0.14,
      ease: 'power2.in',
      onComplete: () => {
        img.src = tab.dataset.remoteImg;
        img.alt = tab.dataset.remoteTitle || '';
        if (tag) tag.innerHTML = `<span class="badge-dot"></span> ${tab.dataset.remoteTag || ''}`;
        title.textContent = tab.dataset.remoteTitle || '';
        desc.textContent = tab.dataset.remoteDesc || '';
        panel.setAttribute('aria-labelledby', tab.id);

        window.gsap.to([img, title, desc], {
          autoAlpha: 1,
          scale: 1,
          duration: 0.22,
          ease: 'power2.out'
        });
      }
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[nextIndex].focus();
      selectTab(tabs[nextIndex]);
    });
  });
};

const initTypewriter = (gsap) => {
  const target = document.querySelector('[data-typewriter]');
  const caret = document.querySelector('.type-caret');
  if (!target) return;

  const isEn = document.documentElement.lang === 'en';
  const phrases = isEn ? [
    'Your Mac Control Deck,',
    'Adaptive Video Editing,',
    'Low-Latency Screen Mirror,',
    'Voice & Text Injection,',
    'Custom Tactile Dials,'
  ] : [
    '随心全能小键盘，',
    '剪辑调色自适应，',
    '桌面镜像低延迟，',
    '语音文字速输入，',
    '手势组件随心设，'
  ];

  if (prefersReducedMotion) {
    target.textContent = phrases[0];
    if (caret) caret.style.display = 'none';
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  if (caret) {
    gsap.to(caret, {
      autoAlpha: .08,
      duration: .42,
      ease: 'steps(1)',
      repeat: -1,
      yoyo: true
    });
  }

  const tick = () => {
    const current = phrases[phraseIndex];
    if (isDeleting) {
      charIndex--;
      target.textContent = current.substring(0, charIndex);
    } else {
      charIndex++;
      target.textContent = current.substring(0, charIndex);
    }

    let speed = isDeleting ? 42 : 90;

    if (!isDeleting && charIndex === current.length) {
      speed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      speed = 380;
    }

    setTimeout(tick, speed);
  };

  setTimeout(tick, 350);
};

const initLookingPanda = (gsap) => {
  const panda = document.querySelector('.look-panda');
  const motionLayer = document.querySelector('.look-panda-motion');
  const pupils = Array.from(document.querySelectorAll('.look-pupil'));
  if (!panda || !motionLayer || pupils.length !== 2) return;
  panda.classList.add('is-ready');
  if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

  gsap.set(pupils, { transformOrigin: '50% 50%' });
  gsap.to(motionLayer, {
    keyframes: [
      { yPercent: 0, rotation: 0, duration: .55 },
      { yPercent: -1.7, rotation: -.65, duration: .75 },
      { yPercent: -3.1, rotation: .2, duration: .85 },
      { yPercent: -2, rotation: .75, duration: .72 },
      { yPercent: -.6, rotation: .25, duration: .78 },
      { yPercent: 0, rotation: 0, duration: .65 }
    ],
    ease: 'sine.inOut',
    repeat: -1
  });

  gsap.timeline({ repeat: -1, repeatDelay: 2.4 })
    .to(pupils, { scaleY: .72, duration: .05, ease: 'power1.in' })
    .to(pupils, { scaleY: .12, duration: .055, ease: 'power1.in' })
    .to(pupils, { scaleY: .65, duration: .06, ease: 'power1.out' })
    .to(pupils, { scaleY: 1, duration: .08, ease: 'power1.out' })
    .to(pupils, { scaleY: .82, duration: .05, delay: .12 })
    .to(pupils, { scaleY: 1, duration: .08 });

  const pupilMoves = pupils.map((pupil) => ({
    x: gsap.quickTo(pupil, 'x', { duration: .2, ease: 'power3.out' }),
    y: gsap.quickTo(pupil, 'y', { duration: .2, ease: 'power3.out' })
  }));
  const pandaX = gsap.quickTo(panda, 'x', { duration: .45, ease: 'power3.out' });
  const pandaY = gsap.quickTo(panda, 'y', { duration: .45, ease: 'power3.out' });
  const pandaRotation = gsap.quickTo(panda, 'rotation', { duration: .5, ease: 'power3.out' });
  const clampX = gsap.utils.clamp(-7, 7);
  const clampY = gsap.utils.clamp(-6, 6);
  let eyeCenters = [];

  const measureEyes = () => {
    eyeCenters = pupils.map((pupil) => {
      const rect = pupil.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
  };
  measureEyes();

  let queued = false;
  let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const renderPointer = () => {
    queued = false;
    pupilMoves.forEach((move, index) => {
      const center = eyeCenters[index];
      const dx = pointer.x - center.x;
      const dy = pointer.y - center.y;
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(7, Math.hypot(dx, dy) / 42);
      move.x(Math.cos(angle) * distance);
      move.y(Math.sin(angle) * distance);
    });
    const normalizedX = pointer.x / window.innerWidth - .5;
    const normalizedY = pointer.y / window.innerHeight - .5;
    pandaX(clampX(normalizedX * 14));
    pandaY(clampY(normalizedY * 12));
    pandaRotation(normalizedX * 2.2);
  };
  const onPointerMove = (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(renderPointer);
    }
  };
  const reset = () => {
    pupilMoves.forEach((move) => { move.x(0); move.y(0); });
    pandaX(0);
    pandaY(0);
    pandaRotation(0);
  };
  const onPointerOut = (event) => {
    if (!event.relatedTarget) reset();
  };
  const onResize = () => {
    measureEyes();
    reset();
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerout', onPointerOut);
  window.addEventListener('resize', onResize, { passive: true });
};

const initRoleCarousel = (gsap) => {
  const section = document.querySelector('.scenarios-section');
  const tabs = Array.from(document.querySelectorAll('[data-role-index]'));
  const panels = Array.from(document.querySelectorAll('.role-panel'));
  const figures = Array.from(document.querySelectorAll('.role-figure'));
  if (!section || tabs.length !== panels.length || tabs.length !== figures.length) return;

  let current = 0;
  let timer = null;
  let transition = null;
  let isVisible = false;
  let isHovered = false;
  let hasInteracted = false;

  const syncState = (index) => {
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel, panelIndex) => {
      const selected = panelIndex === index;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-hidden', String(!selected));
      panel.inert = !selected;
    });
    figures.forEach((figure, figureIndex) => {
      figure.classList.toggle('is-active', figureIndex === index);
    });
  };

  const schedule = () => {
    timer?.kill();
    timer = null;
    if (!gsap || prefersReducedMotion || !isVisible || document.hidden || isHovered || hasInteracted) return;
    timer = gsap.delayedCall(7, () => select((current + 1) % tabs.length));
  };

  const select = (index, moveFocus = false) => {
    if (index === current) {
      if (moveFocus) tabs[index].focus();
      schedule();
      return;
    }

    const previous = current;
    current = index;
    if (moveFocus) tabs[index].focus();
    transition?.kill();
    if (gsap) gsap.set([...panels, ...figures], { clearProps: 'all' });
    syncState(previous);

    if (!gsap || prefersReducedMotion) {
      syncState(index);
      schedule();
      return;
    }

    const outgoing = [panels[previous], figures[previous]];
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels[index].classList.add('is-active');
    panels[index].setAttribute('aria-hidden', 'false');
    panels[index].inert = false;
    panels[previous].inert = true;
    figures[index].classList.add('is-active');

    transition = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        panels[previous].classList.remove('is-active');
        panels[previous].setAttribute('aria-hidden', 'true');
        figures[previous].classList.remove('is-active');
        gsap.set(outgoing, { clearProps: 'all' });
        transition = null;
      }
    });
    transition
      .to(panels[previous], { autoAlpha: 0, x: -18, duration: .22 }, 0)
      .to(figures[previous], { autoAlpha: 0, xPercent: -7, rotation: -3, duration: .24 }, 0)
      .fromTo(panels[index], { autoAlpha: 0, x: 22 }, { autoAlpha: 1, x: 0, duration: .42 }, .1)
      .fromTo(figures[index], {
        autoAlpha: 0,
        xPercent: 10,
        yPercent: 4,
        rotation: 5,
        scale: .9
      }, {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        scale: 1,
        duration: .58,
        ease: 'back.out(1.55)'
      }, .08);
    schedule();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { hasInteracted = true; select(index); });
    tab.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      hasInteracted = true;
      select(nextIndex, true);
    });
  });

  syncState(current);
  section.addEventListener('pointerenter', () => { isHovered = true; schedule(); });
  section.addEventListener('pointerleave', () => { isHovered = false; schedule(); });
  section.addEventListener('focusin', () => { hasInteracted = true; schedule(); });

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting && entry.intersectionRatio >= .28;
    schedule();
  }, { threshold: [.28] });
  observer.observe(section);
  document.addEventListener('visibilitychange', schedule);
};

const initMotion = () => {
  const panda = document.querySelector('.look-panda');
  if (!window.gsap) {
    panda?.classList.add('is-ready');
    initRoleCarousel(null);
    return;
  }

  const { gsap } = window;
  initTypewriter(gsap);
  initLookingPanda(gsap);
  initRoleCarousel(gsap);

  if (!prefersReducedMotion) {
    gsap.to('.hero-paw', {
      keyframes: [
        { rotation: 0, yPercent: 0, duration: .7 },
        { rotation: -9, yPercent: -7, duration: .16 },
        { rotation: 8, yPercent: -11, duration: .18 },
        { rotation: -5, yPercent: -5, duration: .16 },
        { rotation: 3, yPercent: -2, duration: .14 },
        { rotation: 0, yPercent: 0, duration: .18 }
      ],
      transformOrigin: '50% 70%',
      repeat: -1,
      repeatDelay: 2.2
    });
  }

  if (!window.ScrollTrigger) return;
  const { ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();

  media.add({
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 901px)',
    finePointer: '(pointer: fine)'
  }, (context) => {
    const { motion, desktop, finePointer } = context.conditions;
    if (!motion) return undefined;

    const cleanups = [];
    const reveal = { duration: .72, ease: 'power3.out', autoAlpha: 0, y: 36, clearProps: 'transform,opacity,visibility' };

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.site-header', { autoAlpha: 0, y: -18, duration: .5 })
      .from('.hero-line-accent', { autoAlpha: 0, y: 38, rotation: 1.2, duration: .65 }, '-=.12')
      .from('.hero-actions .download-platforms', { autoAlpha: 0, y: 16, duration: .42 }, '-=.28')
      .from('.hero-control', {
        autoAlpha: 0,
        y: desktop ? 42 : 28,
        rotation: (index) => index % 2 ? -8 : 8,
        scale: .78,
        duration: .72,
        stagger: { amount: .52, from: 'random' }
      }, '-=.48');

    const heroControls = gsap.utils.toArray('.hero-control');
    const heroFloats = heroControls.map((control, index) => {
      const tween = gsap.to(control, {
        x: ((index * 11) % 17) - 8,
        y: ((index * 7) % 15) - 7,
        rotation: ((index * 5) % 9) - 4,
        duration: 3.8 + (index % 5) * .55,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: true
      });
      tween.progress((index * .137) % 1);
      return tween;
    });
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => heroFloats.forEach((tween) => self.isActive ? tween.play() : tween.pause())
    });
    cleanups.push(() => heroFloats.forEach((tween) => tween.kill()));

    if (finePointer) {
      const hero = document.querySelector('.hero');
      const heroField = document.querySelector('.hero-field');
      if (hero && heroField) {
        const shiftX = gsap.quickTo(heroField, 'x', { duration: .7, ease: 'power3.out' });
        const shiftY = gsap.quickTo(heroField, 'y', { duration: .7, ease: 'power3.out' });
        const onPointerMove = (event) => {
          const bounds = hero.getBoundingClientRect();
          shiftX(((event.clientX - bounds.left) / bounds.width - .5) * 14);
          shiftY(((event.clientY - bounds.top) / bounds.height - .5) * 10);
        };
        const onPointerLeave = () => { shiftX(0); shiftY(0); };
        hero.addEventListener('pointermove', onPointerMove);
        hero.addEventListener('pointerleave', onPointerLeave);
        cleanups.push(() => {
          hero.removeEventListener('pointermove', onPointerMove);
          hero.removeEventListener('pointerleave', onPointerLeave);
        });
      }
    }

    gsap.timeline({ scrollTrigger: { trigger: '.layouts-section', start: 'top 76%', once: true } })
      .from('.layout-copy h2, .layout-copy > p', { ...reveal, y: 25, stagger: .07 })
      .from('.layout-tabs', { ...reveal, y: 20, clearProps: 'transform,opacity,visibility' }, '-=.3')
      .from('.layout-preview', { ...reveal, x: desktop ? 48 : 0, rotation: 2 }, '-=.5');

    gsap.timeline({ scrollTrigger: { trigger: '.product-section', start: 'top 76%', once: true } })
      .from('.product-shot', { ...reveal, x: desktop ? -48 : 0, rotation: -2 })
      .from('.product-copy .eyebrow, .product-copy h2, .product-copy > p', { ...reveal, y: 24, stagger: .07 }, '-=.38')
      .from('.product-feature-item', { ...reveal, y: 20, stagger: .075 }, '-=.32');

    gsap.timeline({ scrollTrigger: { trigger: '.remote-section', start: 'top 76%', once: true } })
      .from('.remote-intro > *', { ...reveal, y: 24, stagger: .07 })
      .from('.remote-nav-item', { ...reveal, x: desktop ? -32 : 0, y: desktop ? 0 : 20, stagger: .06 }, '-=.34')
      .from('.remote-display', { ...reveal, x: desktop ? 42 : 0, scale: .96, rotation: desktop ? 1.5 : 0 }, '-=.45');

    gsap.timeline({ scrollTrigger: { trigger: '.how-section', start: 'top 74%', once: true } })
      .from('.connection-art', { ...reveal, x: desktop ? -54 : 0, rotation: -4, scale: .95 })
      .from('.how-copy > *', { ...reveal, y: 24, stagger: .07 }, '-=.4')
      .from('.steps li', { ...reveal, y: 19, stagger: .08 }, '-=.32');

    gsap.timeline({ scrollTrigger: { trigger: '.scenarios-section', start: 'top 76%', once: true } })
      .from('.role-tabs', { ...reveal, y: 18 })
      .from('.role-panels', { ...reveal, y: 23 }, '-=.34')
      .from('.role-stage', { autoAlpha: 0, xPercent: desktop ? 12 : 0, y: 38, rotation: 5, scale: .9, duration: .72, ease: 'back.out(1.45)' }, '-=.48');

    gsap.timeline({ scrollTrigger: { trigger: '.pro-section', start: 'top 76%', once: true } })
      .from('.pro-heading .eyebrow, .pro-heading h2, .pro-heading > p', { ...reveal, y: 26, stagger: .07 })
      .from('.pro-companion', { ...reveal, x: desktop ? -24 : 0, duration: .65 }, '-=.35')
      .from('.pro-plan-card', { ...reveal, y: 28, scale: .97, stagger: .09, duration: .55, ease: 'back.out(1.25)' }, '-=.48')
      .from('.pro-trust-badges span', { autoAlpha: 0, y: 12, stagger: .06, duration: .4 }, '-=.2');

    document.querySelectorAll('.quick-details, .pro-benefits-details').forEach((details) => {
      const onToggle = () => ScrollTrigger.refresh();
      details.addEventListener('toggle', onToggle);
      cleanups.push(() => details.removeEventListener('toggle', onToggle));
    });

    const startSpriteLoop = ({ frameSelector, keyframes, repeatDelay = 0.8, trigger }) => {
      const frames = gsap.utils.toArray(frameSelector);
      if (frames.length < 2) return;
      const container = frames[0].parentElement;
      let isPlaying = false;
      let timer = null;

      const setFrame = (index) => {
        frames.forEach((f, i) => {
          f.style.visibility = (i === index) ? 'visible' : 'hidden';
          f.style.opacity = (i === index) ? '1' : '0';
        });
      };

      setFrame(0);

      let stepIndex = 0;
      const tick = () => {
        if (!isPlaying) return;
        const currentKeyframe = keyframes[stepIndex];
        const nextStepIndex = (stepIndex + 1) % keyframes.length;
        const nextKeyframe = keyframes[nextStepIndex];

        const frameNum = currentKeyframe[1];
        const motion = currentKeyframe[3] || {};
        setFrame(frameNum);

        if (container) {
          gsap.to(container, {
            xPercent: motion.xPercent || 0,
            yPercent: motion.yPercent || 0,
            scaleX: motion.scaleX || 1,
            scaleY: motion.scaleY || 1,
            rotation: motion.rotation || 0,
            duration: motion.duration || 0.16,
            ease: motion.ease || 'power2.out',
            overwrite: 'auto'
          });
        }

        const delay = (nextStepIndex === 0)
          ? (repeatDelay * 1000)
          : Math.max(80, ((nextKeyframe[2] - currentKeyframe[2]) * 1000) || 160);

        stepIndex = nextStepIndex;
        timer = setTimeout(tick, delay);
      };

      const start = () => {
        if (isPlaying) return;
        isPlaying = true;
        tick();
      };

      const stop = () => {
        isPlaying = false;
        if (timer) clearTimeout(timer);
      };

      const triggerEl = document.querySelector(trigger);
      if (triggerEl && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              start();
            } else {
              stop();
            }
          });
        }, { threshold: 0.05 });
        observer.observe(triggerEl);
        cleanups.push(() => {
          stop();
          observer.disconnect();
        });
      } else {
        start();
        cleanups.push(() => stop());
      }
    };

    startSpriteLoop({
      frameSelector: '.connection-frame',
      trigger: '.how-section',
      repeatDelay: .8,
      keyframes: [
        ['ready', 0, 0, { rotation: 0, scaleX: 1, scaleY: 1 }],
        ['windup', 1, .25, { xPercent: -1, rotation: -2.2, scaleX: 1.02, scaleY: .98 }],
        ['lasso', 2, .46, { yPercent: -1.5, rotation: 1.7, scaleY: 1.025 }],
        ['throw', 3, .66, { xPercent: 1.5, rotation: 2.8, ease: 'power3.out' }],
        ['flight', 4, .84, { xPercent: 2.5, yPercent: -1.5, rotation: 1.5 }],
        ['aim', 5, 1.01, { xPercent: 1, yPercent: 0, rotation: -.8 }],
        ['click', 6, 1.18, { yPercent: -3, scaleX: .97, scaleY: 1.045, duration: .12, ease: 'back.out(2.1)' }],
        ['tip', 7, 1.42, { xPercent: 0, yPercent: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: .2 }]
      ]
    });
    startSpriteLoop({
      frameSelector: '.download-frame',
      trigger: '.download-section',
      repeatDelay: .52,
      keyframes: [
        ['grip', 0, 0, { xPercent: 0, rotation: 0 }],
        ['pull', 1, .23, { xPercent: -1.2, rotation: -1.2 }],
        ['strain', 2, .44, { xPercent: -2.4, rotation: -2.8 }],
        ['slip', 3, .63, { xPercent: 1.2, rotation: 2.2, ease: 'back.out(1.8)' }],
        ['flop', 4, .8, { yPercent: 2, scaleX: 1.05, scaleY: .95, duration: .11 }],
        ['pop', 5, .94, { yPercent: -4, scaleX: .97, scaleY: 1.05, duration: .13, ease: 'back.out(2.2)' }],
        ['land', 6, 1.13, { yPercent: 1, rotation: -2, duration: .13 }],
        ['reset', 7, 1.34, { xPercent: 0, yPercent: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: .18 }]
      ]
    });

    gsap.timeline({ scrollTrigger: { trigger: '.mac-section', start: 'top 76%', once: true } })
      .from('.mac-copy > *', { ...reveal, y: 24, stagger: .07 })
      .from('.mac-section > img', { ...reveal, x: desktop ? 46 : 0, scale: .96 }, '-=.42');
    gsap.from('.faq-section > h2, .faq-list details', { ...reveal, y: 22, stagger: .055, scrollTrigger: { trigger: '.faq-section', start: 'top 76%', once: true } });
    gsap.timeline({ scrollTrigger: { trigger: '.download-section', start: 'top 82%', once: true } })
      .from('.download-art', { autoAlpha: 0, scale: .74, rotation: -8, duration: .65, ease: 'back.out(1.7)' })
      .from('.download-section h2, .download-copy', { ...reveal, y: 21, stagger: .07 }, '-=.32')
      .from('.download-section .download-platforms', { autoAlpha: 0, y: 16, duration: .5, ease: 'power3.out' }, '-=.25');

    gsap.utils.toArray('.button, .header-download').forEach((target) => {
      const onEnter = () => gsap.to(target, { y: -3, scale: 1.035, duration: .2, ease: 'power2.out', overwrite: 'auto' });
      const onLeave = () => gsap.to(target, { y: 0, scale: 1, duration: .26, ease: 'power2.out', overwrite: 'auto' });
      target.addEventListener('pointerenter', onEnter);
      target.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        target.removeEventListener('pointerenter', onEnter);
        target.removeEventListener('pointerleave', onLeave);
      });
    });

    if (finePointer) {
      gsap.utils.toArray('.benefit-card').forEach((card, index) => {
        const icon = card.querySelector('.benefit-icon');
        if (!icon) return;
        const onEnter = () => gsap.to(icon, { scale: 1.15, rotation: index % 2 ? -4 : 4, duration: .28, ease: 'back.out(2.2)', overwrite: 'auto' });
        const onLeave = () => gsap.to(icon, { scale: 1, rotation: 0, duration: .24, ease: 'power2.out', overwrite: 'auto' });
        card.addEventListener('pointerenter', onEnter);
        card.addEventListener('pointerleave', onLeave);
        cleanups.push(() => {
          card.removeEventListener('pointerenter', onEnter);
          card.removeEventListener('pointerleave', onLeave);
        });
      });

    }

    return () => cleanups.forEach((cleanup) => cleanup());
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('hashchange', () => ScrollTrigger.refresh());
};

const initBlogFilter = () => {
  const buttons = document.querySelectorAll('[data-blog-filter]');
  const items = document.querySelectorAll('[data-blog-item]');
  if (!buttons.length || !items.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.blogFilter;
      buttons.forEach((b) => {
        const selected = b === btn;
        b.classList.toggle('is-active', selected);
        b.setAttribute('aria-pressed', String(selected));
      });

      items.forEach((item) => {
        const cat = item.dataset.blogCat;
        if (filter === 'all' || cat === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
};

initLayoutTabs();
initRemoteShowcase();
initMotion();
initBlogFilter();
