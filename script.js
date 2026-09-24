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

const initMacRemoteWorkstation = () => {
  const workstation = document.querySelector('.mac-remote-workstation');
  if (!workstation) return;

  const isEn = document.documentElement.lang === 'en';
  const pills = document.querySelectorAll('.rm-pill');
  const canvases = document.querySelectorAll('.mac-canvas-view');
  const pads = document.querySelectorAll('.p-pad-view');
  const appNameEl = document.querySelector('#mac-app-name');
  const hud = document.querySelector('#mac-workstation-hud');
  const hudIcon = document.querySelector('#hud-icon');
  const hudText = document.querySelector('#hud-text');

  const appNames = {
    video: 'Final Cut Pro',
    music: 'Apple Music',
    desktop: isEn ? 'Mission Control' : '调度中心 (Mission Control)',
    notes: isEn ? 'Notes' : '备忘录 (Notes)'
  };

  // HUD Toast Trigger
  let hudTimer = null;
  const showMacHud = (iconSvg, text) => {
    if (!hud) return;
    if (hudIcon) hudIcon.innerHTML = iconSvg;
    if (hudText) hudText.textContent = text;
    hud.classList.add('is-shown');
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => {
      hud.classList.remove('is-shown');
    }, 1800);
  };

  const hudIcons = {
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    blade: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    trimLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/><line x1="6" y1="6" x2="6" y2="18"/></svg>',
    trimRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/><line x1="18" y1="6" x2="18" y2="18"/></svg>',
    next: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
    heart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    vol: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    mission: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    switchApp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    camera: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    mic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    send: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    cursor: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>'
  };

  // Mode Switcher
  const selectMode = (mode) => {
    pills.forEach((p) => {
      const active = p.dataset.rmode === mode;
      p.classList.toggle('is-active', active);
      p.setAttribute('aria-selected', String(active));
    });

    canvases.forEach((c) => {
      const active = c.dataset.canvas === mode;
      c.classList.toggle('is-active', active);
      if (active && window.gsap && !prefersReducedMotion) {
        window.gsap.fromTo(c, { autoAlpha: 0, scale: 0.98 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
      }
    });

    pads.forEach((pd) => {
      pd.classList.toggle('is-active', pd.dataset.pview === mode);
    });

    if (appNameEl && appNames[mode]) {
      appNameEl.textContent = appNames[mode];
    }
  };

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      selectMode(pill.dataset.rmode);
    });
  });

  // Trackpad -> Mac Live Cursor Sync
  const trackpad = document.querySelector('#ws-trackpad');
  const cursor = document.querySelector('#mac-live-cursor');
  const canvas = document.querySelector('#mac-screen-canvas');
  const ripple = document.querySelector('#ws-ripple');

  if (trackpad && cursor && canvas) {
    const updateCursor = (e) => {
      const padRect = trackpad.getBoundingClientRect();
      const canRect = canvas.getBoundingClientRect();

      const relX = Math.max(0, Math.min(1, (e.clientX - padRect.left) / padRect.width));
      const relY = Math.max(0, Math.min(1, (e.clientY - padRect.top) / padRect.height));

      const targetX = relX * (canRect.width - 24) + 6;
      const targetY = relY * (canRect.height - 32) + 12;

      cursor.style.transform = `translate(${targetX}px, ${targetY}px)`;

      if (ripple) {
        ripple.style.left = `${e.clientX - padRect.left}px`;
        ripple.style.top = `${e.clientY - padRect.top}px`;
        ripple.style.opacity = '1';
      }
    };

    trackpad.addEventListener('pointerdown', (e) => {
      trackpad.setPointerCapture?.(e.pointerId);
      updateCursor(e);
      const onMove = (ev) => updateCursor(ev);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', () => {
        if (ripple) ripple.style.opacity = '0';
        window.removeEventListener('pointermove', onMove);
      }, { once: true });
    });

    trackpad.addEventListener('click', () => {
      showMacHud(hudIcons.cursor, isEn ? 'Clicked on Mac active window' : '已在 Mac 窗口选取目标');
    });
  }

  // Jog-Wheel -> Timeline Scrubber Sync
  const jogWheel = document.querySelector('#ws-jog-wheel');
  const jogThumb = document.querySelector('#ws-jog-thumb');
  const macScrubber = document.querySelector('#mac-scrubber');
  const timecodeEl = document.querySelector('#video-timecode');
  const videoTrackRow = document.querySelector('#video-track-row');
  const audioTrackRow = document.querySelector('#audio-track-row');
  const videoClipBadge = document.querySelector('#video-clip-badge');
  const videoClipTitle = document.querySelector('#video-clip-title');

  let scrubRatio = 0.45;
  let cutPoints = [45]; // Array of cut percentages (e.g. [25, 55, 78])

  const clipMetadata = [
    { badge: 'CLIP 01 · 4K 60p', title: isEn ? 'Hawa Mahal · Sunset Sequence' : '风之宫殿 · 日落光影延时' },
    { badge: 'CLIP 02 · 4K HDR', title: isEn ? 'Palace Courtyard · Wide B-Roll' : '王宫中庭 · 广角大场景运镜' },
    { badge: 'CLIP 03 · 120p Macro', title: isEn ? 'Marble Carvings · Detail Pan' : '大理石雕刻 · 慢动作推拉' },
    { badge: 'CLIP 04 · Aerial 4K', title: isEn ? 'City Skyline · Golden Hour' : '金色时刻 · 城市全景航拍' },
    { badge: 'CLIP 05 · Night 60p', title: isEn ? 'Street Market · Bokeh Blur' : '夜景集市 · 迷人光斑虚化' },
    { badge: 'CLIP 06 · Action 4K', title: isEn ? 'Speed Boat · Water Splash' : '快艇破浪 · 高帧率动态捕捉' },
    { badge: 'CLIP 07 · Master 4K', title: isEn ? 'Color Grading · Final Master' : '全片母带 · 电影级校色输出' }
  ];

  const getClipLetter = (idx) => {
    return String.fromCharCode(65 + (idx % 26));
  };

  const updateTimecode = (ratio) => {
    if (!timecodeEl) return;
    const totalFrames = Math.floor(ratio * 3600);
    const secs = String(Math.floor((totalFrames % (60 * 30)) / 30)).padStart(2, '0');
    const frames = String(totalFrames % 30).padStart(2, '0');
    timecodeEl.textContent = `00:01:${secs}:${frames}`;
  };

  const highlightActiveClip = () => {
    const curP = scrubRatio * 100;
    const points = [...cutPoints].sort((a, b) => a - b);
    let activeIdx = 0;
    let prev = 0;

    for (let i = 0; i < points.length; i++) {
      if (curP >= prev && curP < points[i]) {
        activeIdx = i;
        break;
      }
      prev = points[i];
      if (i === points.length - 1 && curP >= points[i]) {
        activeIdx = points.length;
      }
    }

    videoTrackRow?.querySelectorAll('.track-segment').forEach((el, idx) => {
      el.classList.toggle('is-active-clip', idx === activeIdx);
    });
    audioTrackRow?.querySelectorAll('.track-segment').forEach((el, idx) => {
      el.classList.toggle('is-active-clip', idx === activeIdx);
    });

    const meta = clipMetadata[activeIdx % clipMetadata.length];
    if (videoClipBadge && meta) videoClipBadge.textContent = meta.badge;
    if (videoClipTitle && meta) videoClipTitle.textContent = meta.title;
  };

  const renderTimelineSegments = (justCutIndex = -1) => {
    if (!videoTrackRow || !audioTrackRow) return;

    const points = [...cutPoints].sort((a, b) => a - b);
    const intervals = [];
    let prev = 0;
    for (let i = 0; i < points.length; i++) {
      intervals.push({ start: prev, end: points[i] });
      prev = points[i];
    }
    intervals.push({ start: prev, end: 100 });

    videoTrackRow.innerHTML = intervals.map((seg, idx) => {
      const width = (seg.end - seg.start).toFixed(2);
      const letter = getClipLetter(idx);
      const isJustCut = idx === justCutIndex || idx === justCutIndex + 1 ? ' just-cut' : '';
      return `
        <div class="track-segment${isJustCut}" data-seg-idx="${idx}" data-start="${seg.start}" data-end="${seg.end}" style="width: ${width}%;">
          <span>Video 1${letter}</span>
          <div class="trim-handle trim-left"></div>
          <div class="trim-handle trim-right"></div>
        </div>
      `;
    }).join('');

    audioTrackRow.innerHTML = intervals.map((seg, idx) => {
      const width = (seg.end - seg.start).toFixed(2);
      const letter = getClipLetter(idx);
      return `
        <div class="track-segment" data-seg-idx="${idx}" data-start="${seg.start}" data-end="${seg.end}" style="width: ${width}%;">
          <span>Audio 1${letter}</span>
        </div>
      `;
    }).join('');

    videoTrackRow.querySelectorAll('.track-segment').forEach((el) => {
      el.addEventListener('click', () => {
        const start = parseFloat(el.dataset.start);
        setScrub((start + 1.5) / 100);
      });
    });

    highlightActiveClip();
  };

  const setScrub = (ratio) => {
    scrubRatio = Math.max(0.02, Math.min(0.98, ratio));
    if (jogThumb && jogWheel) {
      jogThumb.style.top = `${scrubRatio * (jogWheel.clientHeight - 24)}px`;
    }
    if (macScrubber) {
      macScrubber.style.left = `${scrubRatio * 100}%`;
    }
    updateTimecode(scrubRatio);
    highlightActiveClip();
  };

  // Initial timeline render
  renderTimelineSegments();

  if (jogWheel && jogThumb && macScrubber) {
    const handleWheelDrag = (clientY) => {
      const rect = jogWheel.getBoundingClientRect();
      setScrub((clientY - rect.top) / rect.height);
    };

    jogWheel.addEventListener('pointerdown', (e) => {
      jogWheel.setPointerCapture?.(e.pointerId);
      handleWheelDrag(e.clientY);
      const onMove = (ev) => handleWheelDrag(ev.clientY);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', () => window.removeEventListener('pointermove', onMove), { once: true });
    });

    jogWheel.addEventListener('wheel', (e) => {
      e.preventDefault();
      setScrub(scrubRatio + e.deltaY * 0.0015);
    }, { passive: false });
  }

  // Music Player State
  const playlist = [
    'Midnight Ambient Beats',
    'Coffee Shop Lo-Fi',
    'Rainy City Chillout',
    'Deep Coding Flow'
  ];
  let currentSongIdx = 0;
  const songTitleEl = document.querySelector('#music-song-title');
  const vinylDisc = document.querySelector('#music-vinyl');
  const macHeartBtn = document.querySelector('#mac-music-heart');
  const phoneHeartBtn = document.querySelector('#phone-music-heart-btn');
  const volBar = document.querySelector('#mac-vol-mini-bar');
  const volText = document.querySelector('#mac-vol-mini-text');
  const dialIndicator = document.querySelector('#phone-dial-indicator');
  const volLabel = document.querySelector('#phone-vol-lbl');
  let currentVolume = 50;

  const setVolume = (vol) => {
    currentVolume = Math.max(0, Math.min(100, Math.round(vol)));
    const deg = -135 + (currentVolume / 100) * 270;
    if (dialIndicator) dialIndicator.style.transform = `rotate(${deg}deg)`;
    if (volLabel) volLabel.textContent = isEn ? `Vol ${currentVolume}%` : `音量 ${currentVolume}%`;
    if (volBar) volBar.style.width = `${currentVolume}%`;
    if (volText) volText.textContent = `${currentVolume}%`;
  };

  // Music Heart click directly on Mac window
  if (macHeartBtn) {
    macHeartBtn.addEventListener('click', () => {
      macHeartBtn.classList.toggle('is-active');
      const isLoved = macHeartBtn.classList.contains('is-active');
      showMacHud(hudIcons.heart, isLoved ? (isEn ? 'Added to Loved Songs' : '已添加到我喜爱的音乐 ❤️') : (isEn ? 'Removed from Loved Songs' : '已取消喜爱'));
    });
  }

  // Volume Knob Drag & Click Handling
  const phoneVolBtn = document.querySelector('#phone-vol-knob-btn');
  if (phoneVolBtn) {
    let knobStartY = 0;
    let knobStartVol = 50;
    let isKnobDragging = false;
    let didKnobMove = false;

    phoneVolBtn.addEventListener('pointerdown', (e) => {
      phoneVolBtn.setPointerCapture?.(e.pointerId);
      knobStartY = e.clientY;
      knobStartVol = currentVolume;
      isKnobDragging = true;
      didKnobMove = false;

      const onKnobMove = (ev) => {
        if (!isKnobDragging) return;
        const delta = knobStartY - ev.clientY;
        if (Math.abs(delta) > 3) {
          didKnobMove = true;
          setVolume(knobStartVol + delta * 0.8);
        }
      };

      const onKnobUp = () => {
        if (!isKnobDragging) return;
        isKnobDragging = false;
        window.removeEventListener('pointermove', onKnobMove);
        if (!didKnobMove) {
          // Tapped without dragging -> cycle +15%
          const nextVol = currentVolume >= 95 ? 20 : currentVolume + 15;
          setVolume(nextVol);
        }
        showMacHud(hudIcons.vol, isEn ? `Mac Volume: ${currentVolume}%` : `Mac 音量已调至 ${currentVolume}%`);
      };

      window.addEventListener('pointermove', onKnobMove);
      window.addEventListener('pointerup', onKnobUp, { once: true });
    });

    phoneVolBtn.addEventListener('wheel', (e) => {
      e.preventDefault();
      setVolume(currentVolume - Math.sign(e.deltaY) * 5);
      showMacHud(hudIcons.vol, isEn ? `Mac Volume: ${currentVolume}%` : `Mac 音量已调至 ${currentVolume}%`);
    }, { passive: false });
  }

  // Desktop Multitasking State
  const desktopScene = document.querySelector('#mac-desktop-scene');
  const winSafari = document.querySelector('#win-safari');
  const winCode = document.querySelector('#win-code');
  const winNinopad = document.querySelector('#win-ninopad');
  const spotlightBar = document.querySelector('#mac-spotlight-bar');
  const spotlightQuery = document.querySelector('#spotlight-query');
  const appSwitcher = document.querySelector('#mac-app-switcher');
  const screenshotCard = document.querySelector('#mac-screenshot-card');

  // Strictly 1-to-1 ordered with #mac-app-switcher icons: [Safari, Xcode, Ninopad]
  const windowsList = [winSafari, winCode, winNinopad].filter(Boolean);
  const appTitles = [
    isEn ? 'Safari (ninopad.com)' : 'Safari (ninopad.com 官网)',
    isEn ? 'Xcode (NinoPadKit.swift)' : 'Xcode (NinoPadKit.swift 开发环境)',
    isEn ? 'Ninopad Companion Studio' : 'Ninopad 妙控台管理中心'
  ];
  let frontWinIdx = 0;
  let switcherTimer = null;
  let screenshotTimer = null;

  const spotlightQueries = [
    'ninopad.com',
    'Xcode.app',
    'Safari.app',
    'Ninopad Studio.app',
    'Final Cut Pro.app'
  ];
  let spotlightQueryIdx = 0;

  // Video Playing State
  let isVideoPlaying = false;
  let videoPlayTimer = null;

  // Tactile Buttons Click Handling
  document.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;

      if (cmd === 'play-toggle') {
        isVideoPlaying = !isVideoPlaying;
        if (isVideoPlaying) {
          showMacHud(hudIcons.play, isEn ? 'Timeline Playing (Space)' : '时间线播放中 (Space)');
          videoPlayTimer = setInterval(() => {
            if (macScrubber) {
              const curLeft = parseFloat(macScrubber.style.left) || 45;
              const nextLeft = (curLeft + 0.6) % 96;
              setScrub(nextLeft / 100);
            }
          }, 50);
        } else {
          clearInterval(videoPlayTimer);
          showMacHud(hudIcons.pause, isEn ? 'Timeline Paused' : '时间线已暂停');
        }
      } else if (cmd === 'blade') {
        const curP = scrubRatio * 100;
        const sorted = [...cutPoints].sort((a, b) => a - b);
        const tooClose = curP < 3 || curP > 97 || sorted.some((p) => Math.abs(p - curP) < 3.5);

        if (tooClose) {
          showMacHud(hudIcons.blade, isEn ? 'Too close to existing cut point' : '距离已有剪口过近，请微调后再切');
          return;
        }

        cutPoints.push(curP);
        cutPoints.sort((a, b) => a - b);
        const cutIdx = cutPoints.indexOf(curP);

        renderTimelineSegments(cutIdx);

        const totalFrames = Math.floor(scrubRatio * 3600);
        const secs = String(Math.floor((totalFrames % (60 * 30)) / 30)).padStart(2, '0');
        const frames = String(totalFrames % 30).padStart(2, '0');
        showMacHud(
          hudIcons.blade,
          isEn
            ? `Blade cut #${cutIdx + 1} added at 00:01:${secs}:${frames} (${cutPoints.length + 1} clips)`
            : `已在 00:01:${secs}:${frames} 新增剪口（现共 ${cutPoints.length + 1} 个片段）`
        );
      } else if (cmd === 'trim-left') {
        if (cutPoints.length === 0) {
          showMacHud(hudIcons.trimLeft, isEn ? 'No cut points to trim' : '当前暂无剪口可调节');
          return;
        }

        const curP = scrubRatio * 100;
        let nearestIdx = 0;
        let minDist = Infinity;
        cutPoints.forEach((p, i) => {
          const dist = Math.abs(p - curP);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        });

        const prevBound = nearestIdx === 0 ? 0 : cutPoints[nearestIdx - 1];
        if (cutPoints[nearestIdx] - 2.5 >= prevBound + 3) {
          cutPoints[nearestIdx] -= 2.5;
          setScrub(cutPoints[nearestIdx] / 100);
          renderTimelineSegments();
          showMacHud(
            hudIcons.trimLeft,
            isEn
              ? `Cut #${nearestIdx + 1} Trim In: -8 frames (${Math.round(cutPoints[nearestIdx])}%)`
              : `剪口 #${nearestIdx + 1} 向左收紧 -8帧 (${Math.round(cutPoints[nearestIdx])}%)`
          );
        } else {
          showMacHud(hudIcons.trimLeft, isEn ? 'Reached minimum clip duration' : '已达片段最短时长限制');
        }
      } else if (cmd === 'trim-right') {
        if (cutPoints.length === 0) {
          showMacHud(hudIcons.trimRight, isEn ? 'No cut points to trim' : '当前暂无剪口可调节');
          return;
        }

        const curP = scrubRatio * 100;
        let nearestIdx = 0;
        let minDist = Infinity;
        cutPoints.forEach((p, i) => {
          const dist = Math.abs(p - curP);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        });

        const nextBound = nearestIdx === cutPoints.length - 1 ? 100 : cutPoints[nearestIdx + 1];
        if (cutPoints[nearestIdx] + 2.5 <= nextBound - 3) {
          cutPoints[nearestIdx] += 2.5;
          setScrub(cutPoints[nearestIdx] / 100);
          renderTimelineSegments();
          showMacHud(
            hudIcons.trimRight,
            isEn
              ? `Cut #${nearestIdx + 1} Trim Out: +8 frames (${Math.round(cutPoints[nearestIdx])}%)`
              : `剪口 #${nearestIdx + 1} 向右延展 +8帧 (${Math.round(cutPoints[nearestIdx])}%)`
          );
        } else {
          showMacHud(hudIcons.trimRight, isEn ? 'Reached minimum clip duration' : '已达片段最短时长限制');
        }
      } else if (cmd === 'music-play') {
        if (vinylDisc) vinylDisc.classList.toggle('is-spinning');
        const spinning = vinylDisc?.classList.contains('is-spinning');
        showMacHud(spinning ? hudIcons.play : hudIcons.pause, spinning ? (isEn ? 'Apple Music Playing' : 'Apple Music 正在播放') : (isEn ? 'Apple Music Paused' : 'Apple Music 已暂停'));
      } else if (cmd === 'music-next') {
        currentSongIdx = (currentSongIdx + 1) % playlist.length;
        if (songTitleEl) songTitleEl.textContent = playlist[currentSongIdx];
        showMacHud(hudIcons.next, isEn ? `Track: ${playlist[currentSongIdx]}` : `已切歌: ${playlist[currentSongIdx]}`);
      } else if (cmd === 'music-like') {
        if (macHeartBtn) {
          macHeartBtn.classList.toggle('is-active');
          const isLoved = macHeartBtn.classList.contains('is-active');
          showMacHud(hudIcons.heart, isLoved ? (isEn ? 'Added to Loved Songs' : '已添加到我喜爱的音乐 ❤️') : (isEn ? 'Removed from Loved Songs' : '已取消喜爱'));
        }
      } else if (cmd === 'mission') {
        selectMode('desktop');
        if (desktopScene) {
          desktopScene.classList.toggle('is-mission-control');
          const isMission = desktopScene.classList.contains('is-mission-control');
          showMacHud(hudIcons.mission, isMission ? (isEn ? 'Mission Control: All Windows Spread' : '调度中心：窗口全景展开') : (isEn ? 'Mission Control: Restored' : '调度中心已恢复常规排列'));
        }
      } else if (cmd === 'switch-app') {
        selectMode('desktop');
        if (desktopScene) desktopScene.classList.remove('is-mission-control');

        // Cycle front window
        frontWinIdx = (frontWinIdx + 1) % windowsList.length;
        windowsList.forEach((win, idx) => {
          if (idx === frontWinIdx) {
            win.style.zIndex = '3';
            win.classList.add('is-active');
          } else if (idx === (frontWinIdx + 2) % windowsList.length) {
            win.style.zIndex = '2';
            win.classList.remove('is-active');
          } else {
            win.style.zIndex = '1';
            win.classList.remove('is-active');
          }
        });

        // Show App Switcher HUD briefly
        if (appSwitcher) {
          appSwitcher.classList.add('is-open');
          const icons = appSwitcher.querySelectorAll('.app-switcher-icon');
          icons.forEach((ic, i) => ic.classList.toggle('is-focused', i === frontWinIdx));
          clearTimeout(switcherTimer);
          switcherTimer = setTimeout(() => {
            appSwitcher.classList.remove('is-open');
          }, 1200);
        }

        const activeTitle = appTitles[frontWinIdx] || 'App';
        showMacHud(hudIcons.switchApp, isEn ? `⌘Tab: ${activeTitle}` : `⌘Tab 已置顶 ${activeTitle}`);
      } else if (cmd === 'spotlight') {
        selectMode('desktop');
        if (spotlightBar) {
          spotlightBar.classList.toggle('is-open');
          const isOpen = spotlightBar.classList.contains('is-open');
          if (isOpen && spotlightQuery) {
            spotlightQueryIdx = (spotlightQueryIdx + 1) % spotlightQueries.length;
            spotlightQuery.textContent = spotlightQueries[spotlightQueryIdx];
          }
          showMacHud(hudIcons.search, isOpen ? (isEn ? 'Spotlight Search (⌘Space)' : 'Spotlight 聚焦搜索已唤起') : (isEn ? 'Spotlight Dismissed' : 'Spotlight 搜索已关闭'));
        }
      } else if (cmd === 'screenshot') {
        selectMode('desktop');
        if (canvas) {
          canvas.style.filter = 'brightness(2.4)';
          setTimeout(() => { canvas.style.filter = ''; }, 120);
        }
        if (screenshotCard) {
          screenshotCard.classList.add('is-shown');
          clearTimeout(screenshotTimer);
          screenshotTimer = setTimeout(() => {
            screenshotCard.classList.remove('is-shown');
          }, 2500);
        }
        showMacHud(hudIcons.camera, isEn ? 'Screenshot Saved to Desktop (⇧⌘4)' : '截屏已捕获并存至桌面 (⇧⌘4)');
      }
    });
  });

  // Mac Unlock Button click
  const unlockBtn = document.querySelector('#mac-unlock-btn');
  if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
      selectMode('video');
      showMacHud(hudIcons.unlock, isEn ? 'Mac Screen Unlocked' : 'Mac 屏幕已解锁');
    });
  }

  // Voice Dictation & Notes Live Text Injection
  const voiceInput = document.querySelector('#ws-voice-input');
  const micBtn = document.querySelector('#ws-mic-btn');
  const sendBtn = document.querySelector('#ws-send-btn');
  const typedTextEl = document.querySelector('#mac-typed-text');

  document.querySelectorAll('.p-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (voiceInput) {
        voiceInput.value = chip.dataset.txt;
        voiceInput.focus();
      }
    });
  });

  if (micBtn && voiceInput) {
    micBtn.addEventListener('click', () => {
      micBtn.classList.toggle('is-active');
      const isRecording = micBtn.classList.contains('is-active');
      if (isRecording) {
        voiceInput.value = isEn ? 'Speech recognized: Exporting 4K Master by 3:00 PM.' : '语音识别录入：下午 3:00 准时在会议室进行样片评审。';
        showMacHud(hudIcons.mic, isEn ? 'Recording Voice Dictation...' : '正在拾音并高保真识别中...');
      } else {
        showMacHud(hudIcons.pause, isEn ? 'Voice Dictation Paused' : '语音听写已暂停');
      }
    });
  }

  if (sendBtn && voiceInput && typedTextEl) {
    sendBtn.addEventListener('click', () => {
      selectMode('notes');
      const text = voiceInput.value.trim() || (isEn ? 'Wrap up today’s video review and commit to repo.' : '把今天的样片剪辑进度整理好，下午三点提交审核。');
      typedTextEl.textContent = '';
      let charIdx = 0;
      clearInterval(typedTextEl._tId);
      typedTextEl._tId = setInterval(() => {
        if (charIdx < text.length) {
          typedTextEl.textContent = text.slice(0, charIdx + 1) + ' ▌';
          charIdx++;
        } else {
          typedTextEl.textContent = text + ' ↵';
          clearInterval(typedTextEl._tId);
        }
      }, 30);
      showMacHud(hudIcons.send, isEn ? 'Text injected into Mac Notes' : '文本已实时注入 Mac 备忘录');
    });
  }
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

    if (document.querySelector('.layouts-section')) {
      gsap.timeline({ scrollTrigger: { trigger: '.layouts-section', start: 'top 76%', once: true } })
        .from('.layouts-header > *', { ...reveal, y: 25, stagger: .07 })
        .from('.deck-hardware-chassis', { ...reveal, y: 28, scale: .98, duration: .7 }, '-=.3');
    }

    if (document.querySelector('.remote-section')) {
      gsap.timeline({ scrollTrigger: { trigger: '.remote-section', start: 'top 76%', once: true } })
        .from('.remote-intro > *', { ...reveal, y: 24, stagger: .07 })
        .from('.mac-remote-workstation', { ...reveal, y: 32, scale: .98, duration: .75 }, '-=.35');
    }

    if (document.querySelector('.how-section')) {
      gsap.timeline({ scrollTrigger: { trigger: '.how-section', start: 'top 74%', once: true } })
        .from('.connection-art', { ...reveal, x: desktop ? -54 : 0, rotation: -4, scale: .95 })
        .from('.how-copy > *', { ...reveal, y: 24, stagger: .07 }, '-=.4')
        .from('.steps li', { ...reveal, y: 19, stagger: .08 }, '-=.32');
    }

    if (document.querySelector('.scenarios-section')) {
      gsap.timeline({ scrollTrigger: { trigger: '.scenarios-section', start: 'top 76%', once: true } })
        .from('.role-tabs', { ...reveal, y: 18 })
        .from('.role-panels', { ...reveal, y: 23 }, '-=.34')
        .from('.role-stage', { autoAlpha: 0, xPercent: desktop ? 12 : 0, y: 38, rotation: 5, scale: .9, duration: .72, ease: 'back.out(1.45)' }, '-=.48');
    }

    if (document.querySelector('.pro-section')) {
      gsap.timeline({ scrollTrigger: { trigger: '.pro-section', start: 'top 76%', once: true } })
        .from('.pro-heading .eyebrow, .pro-heading h2, .pro-heading > p', { ...reveal, y: 26, stagger: .07 })
        .from('.pro-companion', { ...reveal, x: desktop ? -24 : 0, duration: .65 }, '-=.35')
        .from('.pro-plan-card', { ...reveal, y: 28, scale: .97, stagger: .09, duration: .55, ease: 'back.out(1.25)' }, '-=.48')
        .from('.pro-trust-badges span', { autoAlpha: 0, y: 12, stagger: .06, duration: .4 }, '-=.2');
    }

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
initMacRemoteWorkstation();
initMotion();
initBlogFilter();
