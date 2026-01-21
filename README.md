# Welcome to My Tetris
***

## Task
The goal of this project is to build a classic and fully playable Tetris video game using JavaScript, HTML, and CSS, following the Qwasar “My Tetris” quest requirements.

The challenge is to:
implement real Tetris game logic (not just visuals),
separate game logic, rendering, controls, and audio,
respect official Tetris rules such as rotation (SRS), scoring, line clearing, hold, next pieces, ghost piece, sounds, and game over conditions,
keep the code readable and well structured.
No external libraries are used (except standard browser APIs).

## Description
This project is a complete single-player Tetris implementation.

Project Architecture:
MyTetris/

index.html (HTML layout (canvas, panels, help, legal notice)),
style.css (Styling (layout, panels, help text)),
my_tetris.js (Core game logic & main loop),
controller.js (Keyboard controls),
renderer.js (Canvas rendering (board, pieces, ghost, hold, next)),
audio.js (Sound effects & background music handling),
pieces.js (Tetrimino definitions, shapes, colors),
utils.js (Helpers (matrix creation, 7-bag randomizer)).

sounds/

move.wav (plays when a Tetrimino moves left or right),
rotate.wav (plays when a Tetrimino is rotated),
lock.wav (plays when a Tetrimino locks into the playfield),
clear.wav (plays when one or more lines are cleared),
landing.wav (plays when a Tetrimino touches the ground or stack),
wall.wav (plays when a Tetrimino hits a wall),
gameover.wav (plays when the game ends (Game Over)),
korobeiniki.mp3 (background music (Korobeiniki, classic Tetris theme)).

html_server.js (Simple static server for DoCode preview).

Implemented Tetris Requirements:

10x40 playfield (20 visible),
7-bag random generator,
Tetromino start locations,
SRS rotation system,
Hold piece (enabled by default),
6 Next pieces,
Ghost piece,
Soft drop / Hard drop,
Lock delay (0.5s),
Line clear + gravity,
Scoring system,
T-Spin (basic 3-corner),
Back-to-Back bonus,
Level progression (variable-goal),
Pause (Esc / F1) + 3..2..1 countdown,
Sound effects (WAV),
Korobeiniki background music (MP3),
Game Over detection,
Help section using correct term “Tetriminos”,
Legal notice text.

The game starts with PLAY button and a 3-2-1 countdown, can be paused with Esc / F1, and ends with proper Game Over detection.

Tetris game controls (also in help section):
Left / Right – move Tetriminos,
Down – soft drop,
Space – hard drop,
Up / X – rotate clockwise,
Z / Ctrl – rotate counterclockwise,
C / Shift – hold,
Esc / F1 – pause.

To play again, simply refresh the page.

Optional Extensions 
Additional game modes such as: Marathon (15 levels), Sprint (40 lines), Ultra (2–3 minute timed mode) are optional and can be implemented later by extending:
my_tetris.js (main logic) with small changes in index.html and style.css.

Note on Tetris Logo:
The official Roger Dean Tetris logo was not provided as part of the project assets.
For this reason, a text-based TETRIS title is used instead.
No modification, distortion, or unofficial reproduction of the original logo is included.

## Installation
No installation is required.
This project runs directly in the browser.
For Qwasar DoCode, a small static server is used.

## Usage
Run locally (VS Code): open index.html using Live Server or browser preview (recommended for quick testing).

Run in Qwasar DoCode, in the terminal: node html_server.js
Then open the generated URL shown in the terminal (http://web-XXXXXXXXX.docode.YYYY.qwasar.io).


### The Core Team
Solo Developer Inga Basikirska (basikirs_i)

<span><i>Made at <a href='https://qwasar.io'>Qwasar SV -- Software Engineering School</a></i></span>
<span><img alt='Qwasar SV -- Software Engineering School's Logo' src='https://storage.googleapis.com/qwasar-public/qwasar-logo_50x50.png' width='20px' /></span>
