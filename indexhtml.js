function updateHUD() {
    document.getElementById('lives-display').innerText = lives;
    document.getElementById('score-display').innerText = score;
}function startGame() {
  document.getElementById('start-screen').style.display = 'none';
}

function restartGame() {
  location.reload();
}
(function () {
    var PACMAN_SPEED = 2, PACMAN_RADIUS = 0.25;
    var GHOST_SPEED = 1.5, GHOST_RADIUS = PACMAN_RADIUS * 1.25;
    var DOT_RADIUS = 0.05;
    var UP = new THREE.Vector3(0, 0, 1);
    var LEFT = new THREE.Vector3(-1, 0, 0);
    var TOP = new THREE.Vector3(0, 1, 0);
    var RIGHT = new THREE.Vector3(1, 0, 0);
    var BOTTOM = new THREE.Vector3(0, -1, 0);
    var LEVEL = [
        '# # # # # # # # # # # # # # # # # # # # # # # # # # # #',
        '# . . . . . . . . . . . . # # . . . . . . . . . . . . #',
        '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
        '# o # # # # . # # # # # . # # . # # # # # . # # # # .   #',
        '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
        '# . . . . . . . . . . . . . . . . . . . . . . . . . . #',
        '# . # # # # . # # . # # # # # # # # . # # . # # # # . #',
        '# . # # # # . # # . # # # # # # # # . # # . # # # # . #',
        '# . . . . . . # # . . . . # # . . . . # # . . . . . . #',
        '# # # # # # . # # # # #   # #   # # # # # . # # # # # #',
        '          # . # # # # #   # #   # # # # # . #          ',
        '          # . # # .       G           # # . #          ',
        '          # . # # . # # # # # # # #   # # . #          ',
        '# # # # # # . # # . #             #   # # . # # # # # #',
        '. . . . . . . . . . .             . . # # .            ',
        '# # # # # # . # # . #             #   # # . # # # # # #',
        '          # . # # . # # # # # # # #   # # . #          ',
        '          # . # # . . . . . . . . .   # # . #          ',
        '          # . # # . # # # # # # # #   # # . #          ',
        '# # # # # # . # # . # # # # # # # #   # # . # # # # # #',
        '# . . . . . . . . . . . . # # . . . . . . . . . . . . #',
        '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
        '# . # # # # . # # # # # . # # . # # # # # . # # # # . #',
        '# . . . # # . . . . . . . P   . . . . . . . # # . . . #',
        '# # # . # # . # # . # # # # # # # # . # # . # # . # # #',
        '# # # . # # . # # . # # # # # # # # . # # . # # . # # #',
        '# . . . . . . # # . . . . # # . . . . # # . . . . . . #',
        '# . # # # # # # # # # # . # # . # # # # # # # # # # . #',
        '# . # # # # # # # # # # . # # . # # # # # # # # # # . #',
        '# . . . . . . . . . . . . . . . . . . . . . . . . . . #',
        '# # # # # # # # # # # # # # # # # # # # # # # # # # # #'
    ];

    // BFS AI
    var bfsNextDirection = function(map, ghost, pacman) {
        var start = ghost.position.clone().round();
        var target = pacman.position.clone().round();
        var queue = [{pos: start, firstDir: null}];
        var visited = {};

        while(queue.length > 0) {
            var current = queue.shift();
            var key = current.pos.x + ',' + current.pos.y;
            if(visited[key]) continue;
            visited[key] = true;

            if(current.pos.x === target.x && current.pos.y === target.y) {
                return current.firstDir || ghost.direction.clone();
            }

            var dirs = [
                new THREE.Vector3(-1,0,0),
                new THREE.Vector3(1,0,0),
                new THREE.Vector3(0,1,0),
                new THREE.Vector3(0,-1,0)
            ];
            dirs.forEach(function(d) {
                var next = current.pos.clone().add(d);
                var nextKey = next.x + ',' + next.y;
                if(!visited[nextKey] && !isWall(map, next)) {
                    queue.push({
                        pos: next,
                        firstDir: current.firstDir || d.clone()
                    });
                }
            });
        }
        return ghost.direction.clone();
    };

    // A* AI
    var astarNextDirection = function(map, ghost, pacman) {
        var target = pacman.position.clone().add(pacman.direction.clone().multiplyScalar(4)).round();
        if(isWall(map, target)) target = pacman.position.clone().round();
        var tempGhost = {position: ghost.position, direction: ghost.direction};
        tempGhost.position = ghost.position;
        return bfsNextDirection(map, ghost, {position: target});
    };var createMap = function (scene, levelDefinition) {
        var map = {};
        map.bottom = -(levelDefinition.length - 1);
        map.top = 0;
        map.left = 0;
        map.right = 0;
        map.numDots = 0;
        map.pacmanSpawn = null;
        map.ghostSpawn = null;

        var x, y;
        for (var row = 0; row < levelDefinition.length; row++) {
            y = -row;
            map[y] = {};
            var length = Math.floor(levelDefinition[row].length / 2);
            map.right = Math.max(map.right, length);
            for (var column = 0; column < levelDefinition[row].length; column += 2) {
                x = Math.floor(column / 2);
                var cell = levelDefinition[row][column];
                var object = null;
                if (cell === '#') object = createWall();
                else if (cell === '.') { object = createDot(); map.numDots += 1; }
                else if (cell === 'P') map.pacmanSpawn = new THREE.Vector3(x, y, 0);
                else if (cell === 'G') map.ghostSpawn = new THREE.Vector3(x, y, 0);
                if (object !== null) {
                    object.position.set(x, y, 0);
                    map[y][x] = object;
                    scene.add(object);
                }
            }
        }
        map.centerX = (map.left + map.right) / 2;
        map.centerY = (map.bottom + map.top) / 2;
        return map;
    };

    var getAt = function (map, position) {
        var x = Math.round(position.x), y = Math.round(position.y);
        return map[y] && map[y][x];
    };

    var isWall = function (map, position) {
        var cell = getAt(map, position);
        return cell && cell.isWall === true;
    };

    var removeAt = function (map, scene, position) {
        var x = Math.round(position.x), y = Math.round(position.y);
        if (map[y] && map[y][x]) map[y][x].visible = false;
    };

    var createWall = function () {
        var wallGeometry = new THREE.BoxGeometry(1, 1, 1);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1aff });
        return function () {
            var wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.isWall = true;
            return wall;
        };
    }();

    var createDot = function () {
        var dotGeometry = new THREE.SphereGeometry(DOT_RADIUS);
        var dotMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        return function () {
            var dot = new THREE.Mesh(dotGeometry, dotMaterial);
            dot.isDot = true;
            return dot;
        };
    }();

    var createRenderer = function () {
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setClearColor('black', 1.0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        return renderer;
    };

    var createScene = function () {
        var scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0x888888));
        var light = new THREE.SpotLight('white', 0.5);
        light.position.set(0, 0, 50);
        scene.add(light);
        return scene;
    };

    var createHudCamera = function (map) {
        var halfWidth = (map.right - map.left) / 2, halfHeight = (map.top - map.bottom) / 2;
        var hudCamera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 1, 100);
        hudCamera.position.copy(new THREE.Vector3(map.centerX, map.centerY, 10));
        hudCamera.lookAt(new THREE.Vector3(map.centerX, map.centerY, 0));
        return hudCamera;
    };

    var renderHud = function (renderer, hudCamera, scene) {
        scene.children.forEach(function (object) {
            if (object.isWall !== true) object.scale.set(2.5, 2.5, 2.5);
        });
        renderer.enableScissorTest(true);
        renderer.setScissor(10, 10, 200, 200);
        renderer.setViewport(10, 10, 200, 200);
        renderer.render(scene, hudCamera);
        renderer.enableScissorTest(false);
        scene.children.forEach(function (object) {
            object.scale.set(1, 1, 1);
        });
    };

    var createPacman = function () {
        var pacmanGeometries = [];
        var numFrames = 40;
        for (var i = 0; i < numFrames; i++) {
            var offset = (i / (numFrames - 1)) * Math.PI;
            pacmanGeometries.push(new THREE.SphereGeometry(PACMAN_RADIUS, 16, 16, offset, Math.PI * 2 - offset * 2));
            pacmanGeometries[i].rotateX(Math.PI / 2);
        }
        var pacmanMaterial = new THREE.MeshPhongMaterial({ color: 'yellow', side: THREE.DoubleSide });
        return function (scene, position) {
            var pacman = new THREE.Mesh(pacmanGeometries[0], pacmanMaterial);
            pacman.frames = pacmanGeometries;
            pacman.currentFrame = 0;
            pacman.isPacman = true;
            pacman.isWrapper = true;
            pacman.atePellet = false;
            pacman.distanceMoved = 0;
            pacman.position.copy(position);
            pacman.direction = new THREE.Vector3(-1, 0, 0);
            scene.add(pacman);
            return pacman;
        };
    }();

    var createGhost = function () {
        var ghostGeometry = new THREE.SphereGeometry(GHOST_RADIUS, 16, 16);
        var colors = ['red', 'pink', 'cyan', 'orange'];
        var types = ['bfs', 'astar', 'random', 'random'];
        return function (scene, position, numGhosts) {
            var ghostMaterial = new THREE.MeshPhongMaterial({ color: colors[numGhosts % 4] });
            var ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
            ghost.isGhost = true;
            ghost.isWrapper = true;
            ghost.aiType = types[numGhosts % 4];
            ghost.frameCount = 0;
            ghost.position.copy(position);
            ghost.direction = new THREE.Vector3(-1, 0, 0);
            scene.add(ghost);
        };
    }();

    var distance = function () {
        var difference = new THREE.Vector3();
        return function (object1, object2) {
            difference.copy(object1.position).sub(object2.position);
            return difference.length();
        };
    }();

    var createKeyState = function () {
        var keyState = {};
        document.body.addEventListener('keydown', function (event) {
            keyState[event.keyCode] = true;
            keyState[String.fromCharCode(event.keyCode)] = true;
        });
        document.body.addEventListener('keyup', function (event) {
            keyState[event.keyCode] = false;
            keyState[String.fromCharCode(event.keyCode)] = false;
        });
        return keyState;
    };

    var animationLoop = function (callback) {
        var previousFrameTime = window.performance.now();
        var animationSeconds = 0;
        var render = function () {
            var now = window.performance.now();
            var animationDelta = (now - previousFrameTime) / 1000;
            previousFrameTime = now;
            animationDelta = Math.min(animationDelta, 1/30);
            animationSeconds += animationDelta;
            callback(animationDelta, animationSeconds);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    };

    var main = function () {
        var keys = createKeyState();
        var renderer = createRenderer();
        var scene = createScene();
        var map = createMap(scene, LEVEL);
        var numDotsEaten = 0;
        var camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.up.copy(UP);
        camera.targetPosition = new THREE.Vector3();
        camera.targetLookAt = new THREE.Vector3();
        camera.lookAtPosition = new THREE.Vector3();
        var hudCamera = createHudCamera(map);
        var pacman = createPacman(scene, map.pacmanSpawn);
        var ghostSpawnTime = -8;
        var numGhosts = 0;
        var won = false, lost = false;
        var lives = 3;
        var score = 0;
        var lostTime, wonTime;
        var remove = [];

        var update = function (delta, now) {
            updatePacman(delta, now);
            updateCamera(delta, now);
            scene.children.forEach(function (object) {
                if (object.isGhost === true) updateGhost(object, delta, now);
            });
            remove.forEach(scene.remove, scene);
            remove = [];
            if (numGhosts < 4 && now - ghostSpawnTime > 8) {
                createGhost(scene, map.ghostSpawn, numGhosts);
                numGhosts += 1;
                ghostSpawnTime = now;
            }
        };

        var updatePacman = function (delta, now) {
            if (!won && !lost) movePacman(delta);
            if (!won && numDotsEaten === map.numDots) {
                won = true;
                wonTime = now;
            }
            if (won && now - wonTime > 3) {
                pacman.position.copy(map.pacmanSpawn);
                pacman.direction.copy(LEFT);
                pacman.distanceMoved = 0;
                scene.children.forEach(function (object) {
                    if (object.isDot === true) object.visible = true;
                    if (object.isGhost === true) remove.push(object);
                });
                PACMAN_SPEED += 1;
                GHOST_SPEED += 1;
                won = false;
                numDotsEaten = 0;
                numGhosts = 0;
            }
        };

        var _lookAt = new THREE.Vector3();
        var movePacman = function (delta) {
            pacman.up.copy(pacman.direction).applyAxisAngle(UP, -Math.PI / 2);
            pacman.lookAt(_lookAt.copy(pacman.position).add(UP));
            if (keys['W']) { pacman.translateOnAxis(LEFT, PACMAN_SPEED * delta); pacman.distanceMoved += PACMAN_SPEED * delta; }
            if (keys['A']) pacman.direction.applyAxisAngle(UP, Math.PI / 2 * delta);
            if (keys['D']) pacman.direction.applyAxisAngle(UP, -Math.PI / 2 * delta);
            if (keys['S']) { pacman.translateOnAxis(LEFT, -PACMAN_SPEED * delta); pacman.distanceMoved += PACMAN_SPEED * delta; }

            var leftSide = pacman.position.clone().addScaledVector(LEFT, PACMAN_RADIUS).round();
            var topSide = pacman.position.clone().addScaledVector(TOP, PACMAN_RADIUS).round();
            var rightSide = pacman.position.clone().addScaledVector(RIGHT, PACMAN_RADIUS).round();
            var bottomSide = pacman.position.clone().addScaledVector(BOTTOM, PACMAN_RADIUS).round();
            if (isWall(map, leftSide)) pacman.position.x = leftSide.x + 0.5 + PACMAN_RADIUS;
            if (isWall(map, rightSide)) pacman.position.x = rightSide.x - 0.5 - PACMAN_RADIUS;
            if (isWall(map, topSide)) pacman.position.y = topSide.y - 0.5 - PACMAN_RADIUS;
            if (isWall(map, bottomSide)) pacman.position.y = bottomSide.y + 0.5 + PACMAN_RADIUS;

            var cell = getAt(map, pacman.position);
            if (cell && cell.isDot === true && cell.visible === true) {
                removeAt(map, scene, pacman.position);
                numDotsEaten += 1;
            }
        };

        var updateCamera = function (delta, now) {
            camera.targetPosition.copy(pacman.position).addScaledVector(UP, 1.5).addScaledVector(pacman.direction, -1);
            camera.targetLookAt.copy(pacman.position).add(pacman.direction);
            var cameraSpeed = (lost || won) ? 1 : 10;
            camera.position.lerp(camera.targetPosition, delta * cameraSpeed);
            camera.lookAtPosition.lerp(camera.targetLookAt, delta * cameraSpeed);
            camera.lookAt(camera.lookAtPosition);
        };

        var updateGhost = function (ghost, delta, now) {
            ghost.frameCount++;
            if (ghost.frameCount % 30 === 0) {
                if (ghost.aiType === 'bfs') {
                    ghost.direction.copy(bfsNextDirection(map, ghost, pacman));
                } else if (ghost.aiType === 'astar') {
                    ghost.direction.copy(astarNextDirection(map, ghost, pacman));
                }
            }
            moveGhost(ghost, delta);
         if (!lost && !won && !pacman.invincible && !ghost.justSpawned && distance(pacman, ghost) < PACMAN_RADIUS + GHOST_RADIUS) {
    lives--;
    updateHUD();
    if (lives <= 0) {
        lost = true;
        lostTime = now;
        document.getElementById('death-screen').style.display = 'flex';
    } else {
        pacman.position.copy(map.pacmanSpawn);
        pacman.direction.copy(LEFT);
        ghost.position.copy(map.ghostSpawn);
        pacman.invincible = true;
        ghost.justSpawned = true;
        setTimeout(function() { 
            pacman.invincible = false;
            ghost.justSpawned = false;
        }, 3000);
            }
            }
        };

        var moveGhost = function () {
            var previousPosition = new THREE.Vector3();
            var currentPosition = new THREE.Vector3();
            var leftTurn = new THREE.Vector3();
            var rightTurn = new THREE.Vector3();
            return function (ghost, delta) {
             previousPosition.copy(ghost.position).addScaledVector(ghost.direction, 0.5).round();
                ghost.translateOnAxis(ghost.direction, delta * GHOST_SPEED);
                currentPosition.copy(ghost.position).addScaledVector(ghost.direction, 0.5).round();
                if (!currentPosition.equals(previousPosition)) {
                    leftTurn.copy(ghost.direction).applyAxisAngle(UP, Math.PI / 2);
                    rightTurn.copy(ghost.direction).applyAxisAngle(UP, -Math.PI / 2);
                    var forwardWall = isWall(map, currentPosition);
                    var leftWall = isWall(map, currentPosition.copy(ghost.position).add(leftTurn));
                    var rightWall = isWall(map, currentPosition.copy(ghost.position).add(rightTurn));
                    if (!leftWall || !rightWall || forwardWall) {
                        var possibleTurns = [];
                        if (!forwardWall) possibleTurns.push(ghost.direction.clone());
                        if (!leftWall) possibleTurns.push(leftTurn.clone());
                        if (!rightWall) possibleTurns.push(rightTurn.clone());
                        if (possibleTurns.length > 0) {
                            if (ghost.aiType === 'random') {
                                ghost.direction.copy(possibleTurns[Math.floor(Math.random() * possibleTurns.length)]);
                            }
                            ghost.position.round().addScaledVector(ghost.direction, delta);
                        }
                    }
                }
            };
        }();

        animationLoop(function (delta, now) {
            update(delta, now);
            renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
            renderer.render(scene, camera);
            renderHud(renderer, hudCamera, scene);
        });
    };
    main();
}());