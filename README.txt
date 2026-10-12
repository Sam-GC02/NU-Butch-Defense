Your CodeWisp game
==================

How to play
-----------
Double-clicking index.html usually works for 2D games. For the most
reliable experience (and required for some 3D/WebGL games), serve the
folder over a local HTTP server instead — pick whichever you have:

  python3 -m http.server 8000     (then open http://localhost:8000)
  npx serve

Why? Browsers treat files opened from disk ("file://" URLs) as isolated
security origins, which blocks some kinds of asset loading.

Saving
------
Game progress (SaveData) is stored in your browser's local storage for
this game. Clearing browser data clears your saves. Online features
(leaderboards, multiplayer, accounts) are available when playing on
CodeWisp, not in this downloaded copy.
