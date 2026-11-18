export function initProfile() {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const profile = document.querySelector('#profile');
  const copy = profile.querySelector('.profile-copy');
  const stage = profile.querySelector('.profile-stage');
  const character = stage.querySelector('.profile-character');
  const still = stage.querySelector('.profile-mascot');
  const wave = stage.querySelector('.profile-wave');
  let greeting = [];
  let entry = 0;

  function revealCopy() {
    copy.querySelectorAll('.profile-reveal, .profile-tag').forEach((element, index) => {
      const tilt = getComputedStyle(element).getPropertyValue('--tilt').trim() || '0deg';
      const frames = element.classList.contains('profile-tag') ? [
        {opacity: 0, transform: 'translateY(-58px) rotate(-12deg) scale(.91, 1.12)'},
        {offset: .38, opacity: 1},
        {offset: .66, transform: 'translateY(0) rotate(0deg) scale(1.13, .77)'},
        {offset: .83, transform: 'translateY(-7px) rotate(4deg) scale(.96, 1.07)'},
        {transform: `translateY(0) rotate(${tilt}) scale(1)`}
      ] : [{opacity: 0, transform: 'translateY(-12px)'}, {opacity: 1, transform: 'none'}];
      element.animate(frames, {
        duration: 570,
        delay: index * 75,
        easing: 'ease-out',
        fill: 'backwards'
      });
    });
  }

  function greet() {
    const duration = 1420;
    const swap = [
      {offset: 0, opacity: 0}, {offset: .16, opacity: 0},
      {offset: .24, opacity: 1}, {offset: .76, opacity: 1},
      {offset: .84, opacity: 0}, {offset: 1, opacity: 0}
    ];
    greeting = [
      wave.animate(swap, duration),
      still.animate(swap.map(frame => ({...frame, opacity: 1 - frame.opacity})), duration),
      character.animate([
        {offset: 0, transform: 'none'},
        {offset: .14, transform: 'translateY(2px) scale(1.025,.97)'},
        {offset: .29, transform: 'translateY(-9px) rotate(2deg) scale(.99,1.025)'},
        {offset: .45, transform: 'translateY(-10px) rotate(-2deg) scale(.99,1.025)'},
        {offset: .59, transform: 'translateY(-9px) rotate(2deg) scale(.99,1.025)'},
        {offset: .74, transform: 'translateY(-6px) rotate(-1deg) scale(1,1.01)'},
        {offset: .89, transform: 'translateY(1px) scale(1.015,.98)'},
        {offset: 1, transform: 'none'}
      ], {duration, easing: 'ease-in-out'})
    ];
  }

  const observer = new IntersectionObserver(entries => {
    for (const item of entries) {
      if (item.target === copy && item.isIntersecting) {
        observer.unobserve(copy);
        revealCopy();
      }
      if (item.target === stage) {
        const current = ++entry;
        greeting.forEach(animation => animation.cancel());
        if (item.isIntersecting && item.intersectionRatio >= .2) {
          wave.decode().then(() => {
            if (current === entry) greet();
          }).catch(() => {});
        }
      }
    }
  }, {threshold: [.2]});
  observer.observe(copy);
  observer.observe(stage);
}
