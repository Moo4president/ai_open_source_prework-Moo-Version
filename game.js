class GameClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.worldImage = null;
        this.worldWidth = 2048;
        this.worldHeight = 2048;
        
        // Game state
        this.ws = null;
        this.myPlayerId = null;
        this.players = {};
        this.avatars = {};
        this.isConnected = false;
        
        // Avatar image cache
        this.avatarImages = {};
        
        // Emote system
        this.playerMessages = {}; // Store messages above each player
        this.emoteTimer = null; // Timer for current emote
        
        // Audio system
        this.themeSong = null; // Theme song audio
        this.isPlaying = false; // Track if song is playing
        this.isPaused = false; // Track if song is paused
        this.currentOscillators = []; // Track active oscillators for pausing
        this.cowSound = null; // Loaded cow sound file
        
        // Viewport system
        this.viewportX = 0;
        this.viewportY = 0;
        
        // Movement state
        this.keysPressed = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Movement timers for continuous movement
        this.movementTimers = {
            up: null,
            down: null,
            left: null,
            right: null
        };
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.loadWorldMap();
        this.setupKeyboardControls();
        this.setupUI();
        this.connectToServer();
    }

    setupCanvas() {
        // Set canvas size to fill the browser window
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.draw();
        });
    }

    loadWorldMap() {
        this.worldImage = new Image();
        this.worldImage.onload = () => {
            console.log('World map loaded successfully');
            this.draw();
        };
        this.worldImage.onerror = () => {
            console.error('Failed to load world map');
        };
        this.worldImage.src = 'world.jpg';
    }

    setupUI() {
        this.updateConnectionStatus('connecting', 'Connecting...');
        this.updatePlayerList();
        this.updateGameStats();
        this.setupChatAndEmotes();
        this.setupThemeSong();
    }

    updateConnectionStatus(status, text) {
        const statusEl = document.getElementById('connection-status');
        const textEl = document.getElementById('status-text');
        
        statusEl.className = `status-${status}`;
        textEl.textContent = text;
    }

    updatePlayerList() {
        const playersEl = document.getElementById('players');
        playersEl.innerHTML = '';
        
        Object.values(this.players).forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.username;
            if (player.id === this.myPlayerId) {
                li.style.color = '#4CAF50';
                li.textContent += ' (You)';
            }
            playersEl.appendChild(li);
        });
    }

    updateGameStats() {
        const positionEl = document.getElementById('player-position');
        const countEl = document.getElementById('player-count');
        
        if (this.myPlayerId && this.players[this.myPlayerId]) {
            const myPlayer = this.players[this.myPlayerId];
            positionEl.textContent = `(${Math.round(myPlayer.x)}, ${Math.round(myPlayer.y)})`;
        } else {
            positionEl.textContent = '-';
        }
        
        countEl.textContent = Object.keys(this.players).length;
    }

    setupChatAndEmotes() {
        const emoteButtons = document.querySelectorAll('.emote-btn');
        
        // Emote button handling
        emoteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const emote = button.dataset.emote;
                console.log('Emote button clicked:', emote);
                this.sendEmote(emote);
            });
        });
        
        // Keyboard shortcuts for emotes (1-9)
        document.addEventListener('keydown', (event) => {
            if (event.key >= '1' && event.key <= '9') {
                const emoteIndex = parseInt(event.key) - 1;
                if (emoteButtons[emoteIndex]) {
                    const emote = emoteButtons[emoteIndex].dataset.emote;
                    this.sendEmote(emote);
                }
            }
        });
    }

    setupThemeSong() {
        const themeBtn = document.getElementById('theme-song-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const cowNoiseBtn = document.getElementById('cow-noise-btn');
        
        // Create the theme song using Web Audio API
        this.createCowThemeSong();
        
        // Try to load cow sound file (optional)
        this.loadCowSound();
        
        themeBtn.addEventListener('click', () => {
            this.playThemeSong();
        });
        
        pauseBtn.addEventListener('click', () => {
            this.pauseThemeSong();
        });
        
        cowNoiseBtn.addEventListener('click', () => {
            this.playCowNoise();
        });
    }

    loadCowSound() {
        // Load your specific cow sound file
        this.cowSound = new Audio();
        this.cowSound.preload = 'auto';
        this.cowSound.src = 'cow-moo.mp3'; // Your specific file
        
        this.cowSound.oncanplaythrough = () => {
            console.log('🐄 Loaded your cow sound file: cow-moo.mp3');
        };
        this.cowSound.onerror = () => {
            console.error('❌ Could not load cow-moo.mp3 file');
        };
    }

    createCowThemeSong() {
        // Create a simple cow-themed melody using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Upbeat cow theme song (9 seconds) - inspired by playful cow energy
        const notes = [
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 293.66, duration: 0.3 }, // D4
            { freq: 329.63, duration: 0.3 }, // E4
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 392.00, duration: 0.6 }, // G4
            { freq: 349.23, duration: 0.6 }, // F4
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 293.66, duration: 0.3 }, // D4
            { freq: 329.63, duration: 0.3 }, // E4
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 392.00, duration: 0.6 }, // G4
            { freq: 349.23, duration: 0.6 }, // F4
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 293.66, duration: 0.3 }, // D4
            { freq: 329.63, duration: 0.3 }, // E4
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 392.00, duration: 0.6 }, // G4
            { freq: 349.23, duration: 0.6 }, // F4
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 293.66, duration: 0.3 }, // D4
            { freq: 329.63, duration: 0.3 }, // E4
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 392.00, duration: 0.6 }, // G4
            { freq: 349.23, duration: 0.6 }, // F4
        ];
        
        this.themeSong = { audioContext, notes };
    }

    playThemeSong() {
        if (!this.themeSong || this.isPlaying) return;
        
        this.isPlaying = true;
        this.isPaused = false;
        const { audioContext, notes } = this.themeSong;
        const themeBtn = document.getElementById('theme-song-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Update button appearance
        themeBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
        
        let currentTime = audioContext.currentTime;
        
        // Play each note
        notes.forEach((note, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(note.freq, currentTime);
            oscillator.type = 'sine';
            
            // Create a gentle envelope
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + note.duration);
            
            // Store oscillator for potential pausing
            this.currentOscillators.push(oscillator);
            
            currentTime += note.duration;
        });
        
        // Reset button after song ends
        setTimeout(() => {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentOscillators = [];
            themeBtn.style.display = 'block';
            pauseBtn.style.display = 'none';
        }, currentTime * 1000);
        
        console.log('🐄 Playing cow theme song!');
    }

    pauseThemeSong() {
        if (!this.isPlaying) return;
        
        // Stop all current oscillators
        this.currentOscillators.forEach(oscillator => {
            try {
                oscillator.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
        
        this.isPlaying = false;
        this.isPaused = true;
        this.currentOscillators = [];
        
        // Update button appearance
        const themeBtn = document.getElementById('theme-song-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        themeBtn.style.display = 'block';
        pauseBtn.style.display = 'none';
        
        console.log('⏸️ Music paused!');
    }

    playCowNoise() {
        const cowNoiseBtn = document.getElementById('cow-noise-btn');
        
        // Update button appearance
        cowNoiseBtn.classList.add('playing');
        cowNoiseBtn.textContent = '🐄 Mooing... 🐄';
        
        // Use your imported MP3 file, playing from 2-5 seconds
        if (this.cowSound) {
            this.cowSound.currentTime = 2; // Start at 2 seconds
            this.cowSound.play().then(() => {
                console.log('🐄 Playing your cow sound (2-5 seconds)!');
                
                // Stop at 5 seconds and reset button
                setTimeout(() => {
                    this.cowSound.pause();
                    this.cowSound.currentTime = 2; // Reset to start position
                    
                    // Reset button appearance
                    cowNoiseBtn.classList.remove('playing');
                    cowNoiseBtn.textContent = '🐄 Moo! 🐄';
                }, 3000); // 3 seconds duration (5-2=3)
                
            }).catch(error => {
                console.error('Error playing cow sound file:', error);
                // Reset button on error
                cowNoiseBtn.classList.remove('playing');
                cowNoiseBtn.textContent = '🐄 Moo! 🐄';
            });
        } else {
            console.error('Cow sound not loaded');
            // Reset button
            cowNoiseBtn.classList.remove('playing');
            cowNoiseBtn.textContent = '🐄 Moo! 🐄';
        }
    }


    sendEmote(emote) {
        console.log('sendEmote called with:', emote);
        if (!this.isConnected) {
            console.log('Not connected, cannot send emote');
            return;
        }
        
        // Clear any existing emote timer
        if (this.emoteTimer) {
            clearTimeout(this.emoteTimer);
            this.emoteTimer = null;
        }
        
        // Show emote immediately
        if (this.myPlayerId) {
            console.log('Showing emote above player:', this.myPlayerId);
            this.showMessageAbovePlayer(this.myPlayerId, emote, 'emote');
            
            // Set timer to clear emote after 4 seconds
            this.emoteTimer = setTimeout(() => {
                if (this.myPlayerId && this.playerMessages[this.myPlayerId]) {
                    delete this.playerMessages[this.myPlayerId];
                    this.draw();
                    this.emoteTimer = null;
                }
            }, 4000);
        } else {
            console.log('No myPlayerId, cannot show emote');
        }
        
        // Try to send to server (may not be supported)
        const emoteMessage = {
            action: 'emote',
            emote: emote
        };
        
        this.ws.send(JSON.stringify(emoteMessage));
        console.log('Sent emote to server:', emote);
    }

    showMessageAbovePlayer(playerId, message, type = 'emote') {
        this.playerMessages[playerId] = {
            message: message,
            type: type,
            timestamp: Date.now()
        };
        
        this.draw();
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
    }

    handleKeyDown(event) {
        // Prevent default browser behavior (scrolling)
        event.preventDefault();
        
        const key = event.key;
        let direction = null;
        
        // Map arrow keys to directions
        switch (key) {
            case 'ArrowUp':
                direction = 'up';
                break;
            case 'ArrowDown':
                direction = 'down';
                break;
            case 'ArrowLeft':
                direction = 'left';
                break;
            case 'ArrowRight':
                direction = 'right';
                break;
        }
        
        // If it's a movement key and not already pressed, start continuous movement
        if (direction && !this.keysPressed[direction]) {
            this.keysPressed[direction] = true;
            this.startContinuousMovement(direction);
        }
    }

    handleKeyUp(event) {
        const key = event.key;
        let direction = null;
        
        // Map arrow keys to directions
        switch (key) {
            case 'ArrowUp':
                direction = 'up';
                break;
            case 'ArrowDown':
                direction = 'down';
                break;
            case 'ArrowLeft':
                direction = 'left';
                break;
            case 'ArrowRight':
                direction = 'right';
                break;
        }
        
        // If it's a movement key, stop continuous movement
        if (direction) {
            this.keysPressed[direction] = false;
            this.stopContinuousMovement(direction);
            this.checkForStopCommand();
        }
    }

    sendMoveCommand(direction) {
        if (!this.isConnected) return;
        
        const moveMessage = {
            action: 'move',
            direction: direction
        };
        
        this.ws.send(JSON.stringify(moveMessage));
        console.log('Sent move command:', direction);
    }

    sendStopCommand() {
        if (!this.isConnected) return;
        
        const stopMessage = {
            action: 'stop'
        };
        
        this.ws.send(JSON.stringify(stopMessage));
        console.log('Sent stop command');
    }

    startContinuousMovement(direction) {
        // Send initial move command
        this.sendMoveCommand(direction);
        
        // Set up timer to send move commands repeatedly
        this.movementTimers[direction] = setInterval(() => {
            if (this.keysPressed[direction] && this.isConnected) {
                this.sendMoveCommand(direction);
            }
        }, 100); // Send move command every 100ms
    }

    stopContinuousMovement(direction) {
        // Clear the timer for this direction
        if (this.movementTimers[direction]) {
            clearInterval(this.movementTimers[direction]);
            this.movementTimers[direction] = null;
        }
    }

    checkForStopCommand() {
        // Check if any movement keys are still pressed
        const anyKeyPressed = Object.values(this.keysPressed).some(pressed => pressed);
        
        // If no keys are pressed, send stop command
        if (!anyKeyPressed) {
            this.sendStopCommand();
        }
    }

    cacheAvatarImages() {
        // Cache all avatar images to avoid recreating them
        Object.values(this.avatars).forEach(avatar => {
            Object.keys(avatar.frames).forEach(direction => {
                avatar.frames[direction].forEach((frameData, frameIndex) => {
                    const cacheKey = `${avatar.name}_${direction}_${frameIndex}`;
                    if (!this.avatarImages[cacheKey]) {
                        const img = new Image();
                        img.onload = () => {
                            this.avatarImages[cacheKey] = img;
                        };
                        img.src = frameData;
                    }
                });
            });
        });
    }

    connectToServer() {
        try {
            this.ws = new WebSocket('wss://codepath-mmorg.onrender.com');
            
            this.ws.onopen = () => {
                console.log('Connected to game server');
                this.isConnected = true;
                this.updateConnectionStatus('connected', 'Connected');
                this.joinGame();
            };
            
            this.ws.onmessage = (event) => {
                this.handleServerMessage(JSON.parse(event.data));
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from game server');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected', 'Disconnected - Reconnecting...');
                // Attempt to reconnect after 3 seconds
                setTimeout(() => this.connectToServer(), 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to connect to server:', error);
        }
    }

    joinGame() {
        if (!this.isConnected) return;
        
        // Create a cow avatar with theme song
        const cowAvatar = this.createCowAvatar();
        
        const joinMessage = {
            action: 'join_game',
            username: 'Moo',
            avatar: cowAvatar
        };
        
        this.ws.send(JSON.stringify(joinMessage));
        console.log('Sent join game message with cow avatar and theme song!');
    }

    createCowAvatar() {
        // Create a cow emoji avatar
        const cowSprite = this.createCowSprite();
        
        return {
            name: 'cow_avatar',
            frames: {
                north: [cowSprite, cowSprite, cowSprite],
                south: [cowSprite, cowSprite, cowSprite],
                east: [cowSprite, cowSprite, cowSprite]
            }
        };
    }

    createCowSprite() {
        // Create a cow emoji using canvas and convert to base64
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Set background to transparent
        ctx.clearRect(0, 0, 32, 32);
        
        // Draw the cow emoji
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐄', 16, 16);
        
        return canvas.toDataURL();
    }

    handleServerMessage(message) {
        console.log('Received message:', message);
        
        switch (message.action) {
            case 'join_game':
                if (message.success) {
                    this.myPlayerId = message.playerId;
                    this.players = message.players;
                    this.avatars = message.avatars;
                    console.log('Players in game:', Object.keys(this.players).length);
                    console.log('My player ID:', this.myPlayerId);
                    console.log('Available avatars:', Object.keys(this.avatars));
                    console.log('My avatar:', this.players[this.myPlayerId]?.avatar);
                    this.cacheAvatarImages();
                    this.updatePlayerList();
                    this.updateGameStats();
                    this.centerViewportOnMyAvatar();
                    this.draw();
                } else {
                    console.error('Join game failed:', message.error);
                }
                break;
                
            case 'player_joined':
                this.players[message.player.id] = message.player;
                this.avatars[message.avatar.name] = message.avatar;
                console.log('Player joined:', message.player.username);
                this.cacheAvatarImages();
                this.updatePlayerList();
                this.updateGameStats();
                this.draw();
                break;
                
            case 'players_moved':
                Object.assign(this.players, message.players);
                this.updateGameStats();
                this.centerViewportOnMyAvatar();
                this.draw();
                break;
                
            case 'player_left':
                console.log('Player left:', message.playerId);
                delete this.players[message.playerId];
                delete this.playerMessages[message.playerId];
                this.updatePlayerList();
                this.updateGameStats();
                this.draw();
                break;
                
            case 'emote':
                console.log('Emote from', message.playerId, ':', message.emote);
                this.showMessageAbovePlayer(message.playerId, message.emote, 'emote');
                break;
                
            default:
                console.log('Unknown message type:', message.action);
        }
    }

    centerViewportOnMyAvatar() {
        if (!this.myPlayerId || !this.players[this.myPlayerId]) return;
        
        const myPlayer = this.players[this.myPlayerId];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate viewport position to center on my avatar
        this.viewportX = myPlayer.x - centerX;
        this.viewportY = myPlayer.y - centerY;
        
        // Clamp viewport to map boundaries
        this.viewportX = Math.max(0, Math.min(this.viewportX, this.worldWidth - this.canvas.width));
        this.viewportY = Math.max(0, Math.min(this.viewportY, this.worldHeight - this.canvas.height));
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.viewportX,
            y: worldY - this.viewportY
        };
    }

    draw() {
        if (!this.worldImage) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw world map with viewport offset
        this.ctx.drawImage(
            this.worldImage,
            this.viewportX, this.viewportY, this.canvas.width, this.canvas.height,  // Source rectangle (viewport)
            0, 0, this.canvas.width, this.canvas.height  // Destination rectangle (full canvas)
        );

        // Draw all players
        this.drawPlayers();
    }

    drawPlayers() {
        Object.values(this.players).forEach(player => {
            this.drawPlayer(player);
        });
    }

    drawPlayer(player) {
        const screenPos = this.worldToScreen(player.x, player.y);
        
        // Skip if player is outside viewport
        if (screenPos.x < -50 || screenPos.x > this.canvas.width + 50 ||
            screenPos.y < -50 || screenPos.y > this.canvas.height + 50) {
            return;
        }

        const avatar = this.avatars[player.avatar];
        if (!avatar) {
            console.log('No avatar found for player:', player.username, 'avatar:', player.avatar);
            return;
        }

        // Get the appropriate frame based on facing direction and animation frame
        const direction = player.facing;
        const frameIndex = player.animationFrame || 0;
        const frames = avatar.frames[direction];
        
        if (!frames || !frames[frameIndex]) {
            console.log('No frame found for player:', player.username, 'direction:', direction, 'frame:', frameIndex);
            return;
        }

        // Use cached image
        const cacheKey = `${avatar.name}_${direction}_${frameIndex}`;
        const img = this.avatarImages[cacheKey];
        
        if (!img) {
            console.log('Image not cached yet for:', cacheKey);
            return;
        }

        // Calculate avatar size (maintain aspect ratio) - make bigger
        const maxSize = 48;
        const aspectRatio = img.width / img.height;
        let avatarWidth = maxSize;
        let avatarHeight = maxSize;
        
        if (aspectRatio > 1) {
            avatarHeight = maxSize / aspectRatio;
        } else {
            avatarWidth = maxSize * aspectRatio;
        }

        // Draw avatar centered on player position
        const drawX = screenPos.x - avatarWidth / 2;
        const drawY = screenPos.y - avatarHeight / 2;
        
        this.ctx.drawImage(img, drawX, drawY, avatarWidth, avatarHeight);
        
        // Draw username label
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        const labelY = drawY - 5;
        this.ctx.strokeText(player.username, screenPos.x, labelY);
        this.ctx.fillText(player.username, screenPos.x, labelY);
        
        // Draw message above player if exists
        const playerMessage = this.playerMessages[player.id];
        if (playerMessage) {
            this.drawMessageAbovePlayer(screenPos.x, drawY - 25, playerMessage);
        }
    }

    drawMessageAbovePlayer(x, y, messageData) {
        const { message } = messageData;
        
        // Draw emote larger and with special styling
        this.ctx.font = '28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 4;
        
        this.ctx.strokeText(message, x, y);
        this.ctx.fillText(message, x, y);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GameClient();
});
