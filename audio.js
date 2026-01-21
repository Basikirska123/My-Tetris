// Sound effects

const AudioSfx = (() => {
  // Sounds ON by default (browser may block until first user gesture)
  let unlocked = false;

  // Background music
  const bgmEl = document.getElementById('bgm') || null;
  if (bgmEl) {
    bgmEl.loop = true;
    bgmEl.volume = 0.25;
  }

  // Preload sounds
  const sfx = {
    move: new Audio('sounds/move.wav'),
    rotate: new Audio('sounds/rotate.wav'),
    lock: new Audio('sounds/lock.wav'),
    clear: new Audio('sounds/clear.wav'),
    gameover: new Audio('sounds/gameover.wav'),
    landing: new Audio('sounds/landing.wav'),
    wall: new Audio('sounds/wall.wav'),
  };

  // Set a reasonable default volume for all
  Object.values(sfx).forEach((a) => {
    a.volume = 0.4;
  });

  function unlock() {
    // Call this from a click/keypress (PLAY button is best)
    unlocked = true;
  }

  function play(sound) {
    if (!unlocked) return;

    const a = sfx[sound];
    if (!a) return;

    // Allow rapid repeats (move/rotate)
    try {
      a.currentTime = 0;
      a.play();
    } catch (err) {
      // ignore if browser blocks for some reason
    }
  }

  return {
    unlock,
    playMusic: () => {
      if (!unlocked || !bgmEl) return;
      try {
        bgmEl.play();
      } catch (err) {
        // ignore
      }
    },
    pauseMusic: () => {
      if (!bgmEl) return;
      bgmEl.pause();
    },
    stopMusic: () => {
      if (!bgmEl) return;
      bgmEl.pause();
      bgmEl.currentTime = 0;
    },
    playMove: () => play('move'),
    playRotate: () => play('rotate'),
    playLock: () => play('lock'),
    playClear: () => play('clear'),
    playGameOver: () => play('gameover'),
    playLanding: () => play('landing'),
    playWall: () => play('wall'),
  };
})();