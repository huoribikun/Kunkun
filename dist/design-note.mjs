export function createDesignNote(dialog) {
  const region = dialog.querySelector('#project-design-note');
  const toggle = dialog.querySelector('#design-note-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = true;
  let inView = true;
  let frame = 0;
  let previousTime = 0;
  let distance = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    distance = 0;
  }

  function refresh() {
    const overflowing = dialog.open && region.scrollHeight > region.clientHeight + 1;
    const atEnd = overflowing && region.scrollTop >= region.scrollHeight - region.clientHeight - 1;
    toggle.hidden = !overflowing;
    toggle.textContent = atEnd ? '从头自动滚动' : paused ? '开始自动滚动' : '暂停自动滚动';
    if (!overflowing || atEnd || paused || !inView) {
      stop();
    } else if (!frame) {
      frame = requestAnimationFrame(scroll);
    }
  }

  function scroll(time) {
    frame = 0;
    if (previousTime) {
      distance += Math.min(time - previousTime, 50) * .018;
      const pixels = Math.floor(distance);
      if (pixels) {
        region.scrollTop += pixels;
        distance -= pixels;
      }
    }
    previousTime = time;
    refresh();
  }

  function pause() {
    paused = true;
    refresh();
  }

  toggle.addEventListener('click', () => {
    if (region.scrollTop >= region.scrollHeight - region.clientHeight - 1) {
      region.scrollTop = 0;
      paused = false;
    } else {
      paused = !paused;
    }
    refresh();
  });
  for (const event of ['wheel', 'touchstart', 'pointerdown']) {
    region.addEventListener(event, pause, {passive: true});
  }
  region.addEventListener('keydown', pause);
  region.addEventListener('scroll', refresh, {passive: true});
  reducedMotion.addEventListener('change', pause);
  new ResizeObserver(refresh).observe(region);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    refresh();
  }, {root: dialog.querySelector('.project-dialog-scroll'), threshold: 0}).observe(region);

  return {
    render(paragraphs) {
      stop();
      region.replaceChildren(...paragraphs.map(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
      }));
      region.scrollTop = 0;
      paused = reducedMotion.matches;
      refresh();
    },
    refresh,
    stop
  };
}
