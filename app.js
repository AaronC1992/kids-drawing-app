class KidsDrawingApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Create overlay canvas for temporary animations (like streamers)
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.setupOverlayCanvas();
        
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.currentTool = 'brush';
        this.brushSize = 5;
        this.history = [];
        this.historyIndex = -1;
        this.lastPoint = null;
        this.particles = [];
        this.animationId = null;
        this.rainbowHue = 0; // Add rainbow hue tracker
        this.isRainbowMode = false; // Track if rainbow color is selected
        
        // Magnifier properties
        this.magnifierActive = false;
        this.magnifierX = 0;
        this.magnifierY = 0;
        this.magnifierRadius = 100;
        this.magnifierZoom = 2.0;
        this.magnifierDragging = false;
        
        // Sticker properties
        this.stickerMode = false;
        this.selectedSticker = null;
        
        // Wobbly crayon animation properties
        this.wobbleTime = 0;
        this.wobbleSegments = [];
        this.wigglyLines = []; // Store drawn lines that should keep wiggling
        this.animationRunning = false;
        
        // Train track properties
        this.trainTracks = [];
        this.trains = [];
        this.currentTrack = [];
        this.trackDecorations = []; // Stations, tunnels, bridges, etc.
        
        // Nature brush properties
        this.flowers = [];
        this.grassBlades = [];
        this.flowerAnimationRunning = false;
        this.grassAnimationRunning = false;
        this.lastLeafTime = 0;
        this.lastFlowerTime = 0;
        this.lastGrassTime = 0;
        
        // Blocky builder properties
        this.blockSize = 8;
        this.lastBlockX = null;
        this.lastBlockY = null;
        
        // Mirror painting properties  
        this.mirrorSections = 8;
        this.centerX = 0;
        this.centerY = 0;

        console.log('KidsDrawingApp initialized with tool:', this.currentTool);

    this.setupCanvas();
    this.setupEventListeners();
    this.saveState();
    // Coloring books/PDF feature removed
    this.startAnimationLoop();
        
        // Ensure brush tool is active by default
        setTimeout(() => {
            const brushBtn = document.querySelector('[data-tool="brush"]');
            if (brushBtn && !brushBtn.classList.contains('active')) {
                brushBtn.classList.add('active');
            }
        }, 50);
    }

    setupCanvas() {
        setTimeout(() => {
            this.resizeCanvas();
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }, 100);
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // Ensure proper resize on device rotation
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 250);
        });
    }
    
    setupOverlayCanvas() {
        // Ensure container has relative positioning
        this.canvas.parentElement.style.position = 'relative';
        
        // Position overlay canvas exactly over the main canvas
        this.overlayCanvas.style.position = 'absolute';
        // Use computed/layout values from the rendered canvas to align perfectly
        const cs = window.getComputedStyle(this.canvas);
        this.overlayCanvas.style.top = this.canvas.offsetTop + 'px';
        this.overlayCanvas.style.left = this.canvas.offsetLeft + 'px';
        this.overlayCanvas.style.width = this.canvas.clientWidth + 'px';
        this.overlayCanvas.style.height = this.canvas.clientHeight + 'px';
        this.overlayCanvas.style.borderRadius = cs.borderRadius || '20px';
        this.overlayCanvas.style.pointerEvents = 'none'; // Don't interfere with drawing
        this.overlayCanvas.style.zIndex = '1000'; // High z-index to ensure it's on top
        this.overlayCanvas.style.background = 'transparent'; // Ensure transparency
        
        // Insert overlay into the same container as main canvas
        this.canvas.parentElement.appendChild(this.overlayCanvas);
        
        // Sync size with main canvas
        this.resizeOverlayCanvas();
        
        window.addEventListener('resize', () => {
            this.resizeOverlayCanvas();
        });
    }
    
    resizeOverlayCanvas() {
        if (this.overlayCanvas && this.canvas) {
            // Match drawing buffer sizes
            this.overlayCanvas.width = this.canvas.width;
            this.overlayCanvas.height = this.canvas.height;
            // Match on-screen size and position exactly to the canvas
            const cs = window.getComputedStyle(this.canvas);
            this.overlayCanvas.style.top = this.canvas.offsetTop + 'px';
            this.overlayCanvas.style.left = this.canvas.offsetLeft + 'px';
            this.overlayCanvas.style.width = this.canvas.clientWidth + 'px';
            this.overlayCanvas.style.height = this.canvas.clientHeight + 'px';
            this.overlayCanvas.style.borderRadius = cs.borderRadius || '20px';
        }
    }
    
    resizeCanvas() {
        const toolbar = document.querySelector('.toolbar');
        const toolbarHeight = toolbar ? toolbar.offsetHeight : 80;
        const horizontalMargin = 10; // match CSS left/right 5px on mobile, 10px desktop
        const verticalMarginBottom = 10; // match CSS bottom spacing
        
        // Compute target CSS size directly from viewport (avoids calc(% - px) mismatches)
        const targetWidth = Math.max(300, window.innerWidth - horizontalMargin * 2);
        const targetHeight = Math.max(200, window.innerHeight - toolbarHeight - verticalMarginBottom - (toolbar ? 0 : 0));
        
        // Apply style dimensions so clientWidth/clientHeight reflect our layout
        this.canvas.style.left = horizontalMargin + 'px';
        this.canvas.style.top = (toolbarHeight + 15) + 'px'; // toolbar + spacer
        this.canvas.style.width = targetWidth + 'px';
        this.canvas.style.height = targetHeight + 'px';
        this.canvas.style.right = horizontalMargin + 'px';
        this.canvas.style.bottom = verticalMarginBottom + 'px';
        
        // Save current drawing before buffer resize
        const currentDrawing = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        // Set backing buffer size to match displayed size
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (oldWidth > 0 && oldHeight > 0) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = oldWidth;
            tempCanvas.height = oldHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(currentDrawing, 0, 0);
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(tempCanvas, 0, 0, oldWidth, oldHeight, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.resizeOverlayCanvas();
    }

    getCurrentColor() {
        if (this.isRainbowMode) {
            // Continuously cycle through rainbow colors
            this.rainbowHue += 8; // Increment hue for next color (faster cycling)
            if (this.rainbowHue > 360) {
                this.rainbowHue = 0; // Reset to start of color wheel
            }
            
            // Convert HSL to RGB for smooth rainbow cycling
            return `hsl(${this.rainbowHue}, 100%, 50%)`;
        } else {
            return this.currentColor;
        }
    }

    setupEventListeners() {
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedColor = e.target.dataset.color;
                this.currentColor = selectedColor;
                
                // Initialize rainbow hue if rainbow is selected
                if (selectedColor === 'rainbow') {
                    this.rainbowHue = 0; // Start at red
                    this.isRainbowMode = true;
                } else {
                    this.isRainbowMode = false;
                }
                
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.closeAllCategories();
            });
        });

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                if (tool) {
                    this.currentTool = tool;
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.showToolFeedback(this.currentTool);
                    
                    // Show/hide train decorations menu
                    const decorationsMenu = document.getElementById('trainDecorationsMenu');
                    if (decorationsMenu) {
                        if (tool === 'train-track') {
                            decorationsMenu.style.display = 'block';
                        } else {
                            decorationsMenu.style.display = 'none';
                            this.decorationMode = null; // Clear decoration mode when switching tools
                        }
                    }
                    
                    // Close all dropdown categories after tool selection
                    this.closeAllCategories();
                }
            });
        });
        
        // Train decorations dropdown
        const decorationSelect = document.getElementById('decorationSelect');
        if (decorationSelect) {
            decorationSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                this.decorationMode = value || null; // Set to null if empty string (Draw Track option)
                console.log('Decoration mode set to:', this.decorationMode);
            });
        }

        // Brush size slider
        const brushSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        if (brushSlider && brushSizeValue) {
            brushSlider.addEventListener('input', (e) => {
                this.brushSize = parseInt(e.target.value);
                brushSizeValue.textContent = this.brushSize;
            });
        }

        // Action buttons
        const undoBtn = document.getElementById('undoBtn');
        const clearBtn = document.getElementById('clearBtn');
        const saveBtn = document.getElementById('saveBtn');
        
        if (undoBtn) undoBtn.addEventListener('click', () => { this.undo(); this.closeAllCategories(); });
        if (clearBtn) clearBtn.addEventListener('click', () => { this.clearCanvas(); this.closeAllCategories(); });
        if (saveBtn) saveBtn.addEventListener('click', () => { this.saveDrawing(); this.closeAllCategories(); });

        // Color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.currentColor = e.target.value;
                this.isRainbowMode = false; // Turn off rainbow mode when using color picker
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            });
        }

        // Sticker tool
        const stickerTool = document.getElementById('stickerTool');
        if (stickerTool) {
            console.log('Sticker tool found, adding event listener');
            stickerTool.addEventListener('click', () => {
                console.log('Sticker tool clicked!');
                this.showStickerPanel();
                this.closeAllCategories();
            });
        } else {
            console.log('Sticker tool NOT found');
        }

        // Coloring Books tool removed

        // Panel close buttons
        const closeStickerPanel = document.getElementById('closeStickerPanel');
        
        if (closeStickerPanel) {
            console.log('Close sticker panel button found');
            closeStickerPanel.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                console.log('Close sticker panel button clicked!');
                this.hideStickerPanel();
            });
        } else {
            console.log('Close sticker panel button NOT found');
        }

        // Sticker clicks
        document.querySelectorAll('.sticker').forEach(sticker => {
            sticker.addEventListener('click', (e) => {
                console.log('Sticker clicked:', e.target.textContent);
                this.stickerMode = true;
                this.selectedSticker = e.target.textContent;
                this.canvas.style.cursor = 'crosshair';
                this.hideStickerPanel();
                this.closeAllCategories();
                
                // Visual feedback
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                const stickerTool = document.getElementById('stickerTool');
                if (stickerTool) stickerTool.classList.add('active');
                
                console.log('Sticker mode activated:', this.stickerMode, 'Selected:', this.selectedSticker);
            });
        });

        this.canvas.addEventListener('mousedown', (e) => {
            // Check for flag clicks first
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            if (!this.handleFlagClick(x, y)) {
                this.startDrawing(e);
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.draw(e);
            this.updateSnapPointIndicators(e);
        });
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        // Magnifying glass tool
        const magnifierTool = document.getElementById('magnifierTool');
        if (magnifierTool) {
            magnifierTool.addEventListener('click', () => {
                this.toggleMagnifier();
                this.closeAllCategories();
            });
        }

        // Auto-close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            this.handleDropdownClose(e);
        });

        // Auto-close dropdowns when touching outside (for mobile)
        document.addEventListener('touchstart', (e) => {
            this.handleDropdownClose(e);
        });
        
        // Keyboard shortcuts for decorations
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
                this.decorationMode = 'station';
                console.log('Station mode activated - click near a track to place a station');
            } else if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
                this.decorationMode = 'tunnel';
                console.log('Tunnel mode activated - click near a track to place a tunnel');
            } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
                this.decorationMode = 'tree';
                console.log('Tree mode activated - click near a track to place a tree');
            } else if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
                this.decorationMode = 'building';
                console.log('Building mode activated - click near a track to place a building');
            } else if (e.key === 'Escape') {
                this.decorationMode = null;
                console.log('Decoration mode cancelled');
            }
        });
    }

    handleDropdownClose(e) {
        // Check if click/touch is outside any category
        const categoryHeaders = document.querySelectorAll('.category-header');
        const categoryContents = document.querySelectorAll('.category-content');
        
        let clickedOnCategory = false;
        categoryHeaders.forEach(header => {
            if (header.contains(e.target)) {
                clickedOnCategory = true;
            }
        });
        
        categoryContents.forEach(content => {
            if (content.contains(e.target)) {
                clickedOnCategory = true;
            }
        });

        // If clicked outside, close all dropdowns
        if (!clickedOnCategory) {
            categoryContents.forEach(content => {
                content.style.display = 'none';
                const arrow = content.parentElement.querySelector('.category-arrow');
                if (arrow) arrow.textContent = '▶';
            });
        }

        // Auto-close panels when clicking outside
        const stickerPanel = document.getElementById('stickerPanel');
        const stickerTool = document.getElementById('stickerTool');
        
        if (stickerPanel && stickerPanel.style.display === 'block' && 
            !stickerPanel.contains(e.target) && e.target !== stickerTool) {
            console.log('Clicked outside sticker panel, closing it');
            this.hideStickerPanel();
        }
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        if (e.type === 'touchstart') {
            this.startDrawing(mouseEvent);
        } else if (e.type === 'touchmove') {
            this.draw(mouseEvent);
        }
    }

    startDrawing(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        console.log('startDrawing called - stickerMode:', this.stickerMode, 'selectedSticker:', this.selectedSticker);
        
        // Handle decoration placement
        if (this.decorationMode) {
            this.addTrackDecoration(x, y, this.decorationMode);
            // Reset dropdown to "Draw Track" option
            const decorationSelect = document.getElementById('decorationSelect');
            if (decorationSelect) {
                decorationSelect.value = '';
            }
            this.decorationMode = null;
            console.log('Decoration placed');
            return;
        }
        
        // Initialize replay stroke (if recording and not sticker/decoration)
        if (window.Replay && window.Replay.isRecording && !this.stickerMode && !this.decorationMode) {
            window.Replay.startStroke({
                tool: this.currentTool,
                color: this.getCurrentColor(),
                size: this.brushSize,
                start: {x, y}
            });
        }

        // Handle sticker placement
        if (this.stickerMode && this.selectedSticker) {
            console.log('Placing sticker at:', x, y);
            this.addStickerAt(this.selectedSticker, x, y);
            this.stickerMode = false;
            this.selectedSticker = null;
            this.canvas.style.cursor = 'crosshair';
            
            // Deactivate sticker tool
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tool="brush"]').classList.add('active');
            this.currentTool = 'brush';
            return;
        }
        
        // Initialize train track when starting to draw
        if (this.currentTool === 'train-track') {
            this.trainTracks = this.trainTracks || [];
            this.trains = this.trains || [];
            this.currentTrack = [];
        }
        
        this.isDrawing = true;
        this.lastPoint = { x, y };
        
        if (this.currentTool === 'brush') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.getCurrentColor();
            this.ctx.lineWidth = this.brushSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        } else if (this.currentTool === 'fireworks') {
            this.drawFireworks(x, y);
        } else if (this.currentTool === 'spray') {
            this.drawSpray(x, y);
        } else if (this.currentTool === 'fill') {
            this.floodFill(x, y);
        } else if (this.currentTool === 'neon') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            // Reset white points for rainbow neon effect
            this.neonWhitePoints = null;
        } else if (this.currentTool === 'wobbly-crayon') {
            // Start a new wiggly line
            this.currentWigglyLine = null; // Reset any existing line
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.getCurrentColor();
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        } else if (this.currentTool === 'smudge') {
            // Smudge tool doesn't need initial setup like other brushes
            this.startSmudging(x, y);
        } else if (this.currentTool === 'blend') {
            // Blend tool doesn't need initial canvas setup
            this.startBlending(x, y);
        } else if (this.currentTool === 'train-track') {
            this.drawTrainTrack(x, y);
        } else if (this.currentTool === 'leaf-trail') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.lastLeafTime = 0;
        } else if (this.currentTool === 'flower-chain') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.lastFlowerTime = 0;
            this.flowers = this.flowers || [];
        } else if (this.currentTool === 'grass-stamper') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.lastGrassTime = 0;
            this.grassBlades = this.grassBlades || [];
        } else if (this.currentTool === 'blocky-builder') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.blockSize = Math.max(4, this.brushSize * 0.8); // Size of each block
            // Reset position when starting a new stroke
            this.lastBlockX = null;
            this.lastBlockY = null;
            // Draw the first block immediately
            const gridX = Math.floor(x / this.blockSize) * this.blockSize;
            const gridY = Math.floor(y / this.blockSize) * this.blockSize;
            this.drawSingleBlock(gridX, gridY);
            this.lastBlockX = gridX;
            this.lastBlockY = gridY;
        } else if (this.currentTool === 'mirror-painting') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.getCurrentColor();
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            // Set up mirror parameters
            this.mirrorSections = 8; // Number of mirror sections (like kaleidoscope)
            this.centerX = this.canvas.width / 2;
            this.centerY = this.canvas.height / 2;
            
            // Start drawing all mirror paths
            for (let i = 0; i < this.mirrorSections; i++) {
                this.ctx.beginPath();
                const mirrorPoint = this.getMirrorPoint(x, y, i);
                this.ctx.moveTo(mirrorPoint.x, mirrorPoint.y);
            }
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (this.currentTool === 'brush') {
            if (this.isRainbowMode) {
                // For rainbow mode, draw individual segments
                this.ctx.strokeStyle = this.getCurrentColor();
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            } else {
                // Normal brush behavior
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        } else if (this.currentTool === 'eraser') {
            this.drawEraser(x, y);
        } else if (this.currentTool === 'fireworks') {
            this.drawFireworks(x, y);
        } else if (this.currentTool === 'spray') {
            this.drawSpray(x, y);
        } else if (this.currentTool === 'glitter') {
            this.drawGlitter(x, y);
        } else if (this.currentTool === 'neon') {
            this.drawNeon(x, y);
        } else if (this.currentTool === 'bubble') {
            this.drawBubbles(x, y);
        } else if (this.currentTool === 'confetti') {
            this.drawConfetti(x, y);
        } else if (this.currentTool === 'sparkles') {
            this.drawColorfulWorms(x, y);
        } else if (this.currentTool === 'lightning') {
            this.drawLightning(x, y);
        } else if (this.currentTool === 'bugs') {
            this.drawBugs(x, y);
        } else if (this.currentTool === 'streamers') {
            this.drawStreamers(x, y);
        } else if (this.currentTool === 'wobbly-crayon') {
            this.drawWobblyCrayon(x, y);
        } else if (this.currentTool === 'smudge') {
            this.drawSmudge(x, y);
        } else if (this.currentTool === 'blend') {
            this.drawBlend(x, y);
        } else if (this.currentTool === 'train-track') {
            this.drawTrainTrack(x, y);
        } else if (this.currentTool === 'leaf-trail') {
            this.drawLeafTrail(x, y);
        } else if (this.currentTool === 'flower-chain') {
            this.drawFlowerChain(x, y);
        } else if (this.currentTool === 'grass-stamper') {
            this.drawGrassStamper(x, y);
        } else if (this.currentTool === 'blocky-builder') {
            this.drawBlockyBuilder(x, y);
        } else if (this.currentTool === 'mirror-painting') {
            this.drawMirrorPainting(x, y);
        }

        // Record point into current stroke if replay recording active
        if (window.Replay && window.Replay.isRecording && window.Replay.currentStroke) {
            window.Replay.addPoint(x, y);
        }

        this.lastPoint = { x, y };
    }

    stopDrawing() {
        if (this.isDrawing) {
            // Finalize wiggly crayon line
            if (this.currentTool === 'wobbly-crayon' && this.currentWigglyLine) {
                this.wigglyLines.push(this.currentWigglyLine);
                this.currentWigglyLine = null;
                // Update static canvas data to exclude wiggly lines
                this.updateStaticCanvas();
            }
            
            // Finalize train track and create a train
            if (this.currentTool === 'train-track' && this.currentTrack.length > 1) {
                // Try to merge with existing tracks
                const merged = this.mergeTracksIfConnected();
                
                if (!merged) {
                    // No merge, add as new track
                    this.trainTracks.push(this.currentTrack);
                    const trackIndex = this.trainTracks.length - 1;
                    // Create a new train for this track
                    this.createTrainForTrack(this.currentTrack, trackIndex);
                }
                
                this.currentTrack = [];
            }
            
            // Reset neon white points
            this.neonWhitePoints = null;
            
            // Reset blocky builder position to prevent jumping
            this.lastBlockX = null;
            this.lastBlockY = null;
            
            this.isDrawing = false;
            this.saveState();

            // Finalize stroke recording
            if (window.Replay && window.Replay.isRecording) {
                window.Replay.endStroke();
            }
        }
    }
    
    updateStaticCanvas() {
        // This method would ideally separate static content from wiggly lines
        // For now, we'll just clear the static data when new wiggly lines are added
        this.staticCanvasData = null;
    }

    saveState() {
        this.historyIndex++;
        if (this.historyIndex < this.history.length) {
            this.history.length = this.historyIndex;
        }
        this.history.push(this.canvas.toDataURL());
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = this.history[this.historyIndex];
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = []; // Clear all particles including permanent glitter
        
        // Clear wiggly lines and overlay canvas
        this.wigglyLines = [];
        this.currentWigglyLine = null;
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // Clear train tracks
        this.trainTracks = [];
        this.trains = [];
        this.currentTrack = [];
        
        // Clear nature brushes
        this.flowers = [];
        this.grassBlades = [];
        this.flowerAnimationRunning = false;
        this.grassAnimationRunning = false;
        
        this.saveState();
    }

    saveDrawing() {
        const link = document.createElement('a');
        link.download = 'my-drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    drawEraser(x, y) {
        // More aggressive erasing with multiple passes
        const eraserSize = this.brushSize * 2;
        
        // Erase from main canvas with multiple passes for better coverage
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        
        // First pass - circular erase
        this.ctx.beginPath();
        this.ctx.arc(x, y, eraserSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Second pass - draw from last point for continuous erasing
        if (this.lastPoint) {
            this.ctx.lineWidth = eraserSize * 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();
        
        // Also erase from overlay canvas (effects like glitter, streamers, balloons, fireworks)
        this.overlayCtx.save();
        this.overlayCtx.globalCompositeOperation = 'destination-out';
        
        this.overlayCtx.beginPath();
        this.overlayCtx.arc(x, y, eraserSize, 0, Math.PI * 2);
        this.overlayCtx.fill();
        
        if (this.lastPoint) {
            this.overlayCtx.lineWidth = eraserSize * 2;
            this.overlayCtx.lineCap = 'round';
            this.overlayCtx.lineJoin = 'round';
            this.overlayCtx.beginPath();
            this.overlayCtx.moveTo(this.lastPoint.x, this.lastPoint.y);
            this.overlayCtx.lineTo(x, y);
            this.overlayCtx.stroke();
        }
        
        this.overlayCtx.globalCompositeOperation = 'source-over';
        this.overlayCtx.restore();
        
        // Remove particles in the erased area
        const eraserRadius = eraserSize;
        this.particles = this.particles.filter(particle => {
            const distance = Math.sqrt((particle.x - x) ** 2 + (particle.y - y) ** 2);
            return distance > eraserRadius; // Keep particles outside eraser radius
        });
        
        // Remove train tracks in the erased area
        if (this.trainTracks) {
            this.trainTracks = this.trainTracks.filter(track => {
                return !track.some(point => {
                    const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
                    return distance <= eraserRadius;
                });
            });
        }
        
        // Remove trains whose tracks were erased
        if (this.trains) {
            this.trains = this.trains.filter(train => {
                return !train.track.some(point => {
                    const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
                    return distance <= eraserRadius;
                });
            });
        }
        
        // Remove flowers in the erased area
        if (this.flowers) {
            this.flowers = this.flowers.filter(flower => {
                const distance = Math.sqrt((flower.x - x) ** 2 + (flower.y - y) ** 2);
                return distance > eraserRadius;
            });
        }
        
        // Remove grass blades in the erased area
        if (this.grassBlades) {
            this.grassBlades = this.grassBlades.filter(blade => {
                const distance = Math.sqrt((blade.x - x) ** 2 + (blade.y - y) ** 2);
                return distance > eraserRadius;
            });
        }
    }

    drawFireworks(x, y) {
        console.log('Creating fireworks particles at', x, y, 'pdfMode:', this.pdfMode);
        // Original fireworks - simple particle explosion
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 60,
                type: 'firework',
                color: this.getRandomFireworkColor()
            });
        }
    }

    drawSpray(x, y) {
        // Original spray effect
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.brushSize * 2;
            const sprayX = x + Math.cos(angle) * distance;
            const sprayY = y + Math.sin(angle) * distance;
            
            this.ctx.globalAlpha = Math.random() * 0.8 + 0.2;
            this.ctx.fillStyle = this.getCurrentColor();
            this.ctx.beginPath();
            this.ctx.arc(sprayX, sprayY, Math.random() * 2 + 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }

    drawGlitter(x, y) {
        // Simple glitter like spray brush but with twinkling sparkles
        for (let i = 0; i < 6; i++) {
            let px, py;
            let attempts = 0;
            
            // Try to find a position that doesn't overlap with existing particles
            do {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.brushSize;
                px = x + Math.cos(angle) * distance;
                py = y + Math.sin(angle) * distance;
                attempts++;
            } while (this.isPositionTooClose(px, py, 8) && attempts < 10); // 8px minimum distance
            
            this.particles.push({
                x: px,
                y: py,
                life: -1, // Permanent particles
                type: 'glitter',
                color: this.getCurrentColor(),
                size: Math.random() * 1.5 + 0.5,
                blinkTimer: Math.floor(Math.random() * 30) // Random starting point (0-29 frames)
            });
        }
    }

    // Helper function to check if position is too close to existing glitter particles
    isPositionTooClose(x, y, minDistance) {
        for (const particle of this.particles) {
            if (particle.type === 'glitter' && particle.life === -1) {
                const distance = Math.sqrt(Math.pow(x - particle.x, 2) + Math.pow(y - particle.y, 2));
                if (distance < minDistance) {
                    return true;
                }
            }
        }
        return false;
    }

    drawNeon(x, y) {
        // Neon with bright white center - scales with brush size
        this.ctx.save();
        
        const currentColor = this.getCurrentColor();
        
        if (this.isRainbowMode && this.lastPoint) {
            // For rainbow mode, draw individual segments for the outer glow
            this.ctx.shadowColor = currentColor;
            this.ctx.shadowBlur = this.brushSize * 0.5;
            this.ctx.strokeStyle = currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            
            // For the white center, maintain continuity by storing points and redrawing the entire path
            if (!this.neonWhitePoints) {
                this.neonWhitePoints = [{ x: this.lastPoint.x, y: this.lastPoint.y }];
            }
            this.neonWhitePoints.push({ x: x, y: y });
            
            // Redraw the entire white center path for continuity (thinner for rainbow mode)
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = this.brushSize * 0.2;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = this.brushSize * 0.25; // Thinner white center for rainbow mode
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(this.neonWhitePoints[0].x, this.neonWhitePoints[0].y);
            for (let i = 1; i < this.neonWhitePoints.length; i++) {
                this.ctx.lineTo(this.neonWhitePoints[i].x, this.neonWhitePoints[i].y);
            }
            this.ctx.stroke();
        } else {
            // Normal neon behavior - maintain continuous path for smooth appearance
            if (this.lastPoint) {
                // Draw the outer glow
                this.ctx.shadowColor = currentColor;
                this.ctx.shadowBlur = this.brushSize * 0.5;
                this.ctx.strokeStyle = currentColor;
                this.ctx.lineWidth = this.brushSize;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                
                // For white center, use the same technique as rainbow mode to maintain smoothness
                if (!this.neonWhitePoints) {
                    this.neonWhitePoints = [{ x: this.lastPoint.x, y: this.lastPoint.y }];
                }
                this.neonWhitePoints.push({ x: x, y: y });
                
                // Redraw entire white center path for smooth, continuous appearance
                this.ctx.shadowColor = '#ffffff';
                this.ctx.shadowBlur = this.brushSize * 0.3;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = this.brushSize * 0.4;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(this.neonWhitePoints[0].x, this.neonWhitePoints[0].y);
                for (let i = 1; i < this.neonWhitePoints.length; i++) {
                    this.ctx.lineTo(this.neonWhitePoints[i].x, this.neonWhitePoints[i].y);
                }
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }

    drawBubbles(x, y) {
        // Create floating balloons with strings - very limited quantity
        const numBalloons = Math.max(1, Math.floor(this.brushSize / 25)); // Much fewer balloons, max 1-2
        
        for (let i = 0; i < numBalloons; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * this.brushSize * 2, // Spread them out more
                y: y + (Math.random() - 0.5) * this.brushSize * 2,
                prevX: x + (Math.random() - 0.5) * this.brushSize * 2, // Store previous position
                prevY: y + (Math.random() - 0.5) * this.brushSize * 2,
                vx: (Math.random() - 0.5) * 1,
                vy: -Math.random() * 2 - 0.5, // Float upward slower for balloons
                life: 240 + Math.random() * 60, // Longer lifetime for balloons
                type: 'bubble',
                size: Math.random() * (this.brushSize / 2) + 5,
                color: this.getCurrentColor(),
                alpha: 0.8 + Math.random() * 0.2, // More opaque for balloons
                wobble: Math.random() * Math.PI * 2, // For floating movement
                stringLength: (15 + Math.random() * 10) * (this.brushSize / 10), // Scale with brush size
                windPhase: Math.random() * Math.PI * 2 // Individual wind phase for each balloon
            });
        }
    }

    drawConfetti(x, y) {
        // Original confetti - only big brush size
        const brushSize = Math.max(this.brushSize, 15); // Force big size
        const colors = ['#ff1744', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 100,
                type: 'confetti',
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.4,
                size: brushSize
            });
        }
    }

    drawColorfulWorms(x, y) {
        // Realistic wiggling worms
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e', '#00b894', '#e17055'];
        
        for (let i = 0; i < 4; i++) { // Fewer worms for better realism
            const angle = Math.random() * Math.PI * 2; // Random direction
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (Math.random() * 2 + 1), // Slower, more controlled movement
                vy: Math.sin(angle) * (Math.random() * 2 + 1),
                life: 120 + Math.random() * 60, // Longer life for worms
                type: 'worm',
                color: colors[Math.floor(Math.random() * colors.length)],
                trail: [],
                segmentLength: 18, // Longer worm body
                wiggle: Math.random() * Math.PI * 2, // Wiggle phase
                wiggleSpeed: 0.2 + Math.random() * 0.3, // How fast they wiggle
                direction: angle, // Current direction
                turnRate: 0.05 + Math.random() * 0.1 // How much they turn
            });
        }
    }

    drawLightning(x, y) {
        // Animated lightning bolts with player's color - MUCH LONGER strikes
        const numBolts = Math.max(1, Math.floor(this.brushSize / 15)); // Scale with brush size
        
        for (let i = 0; i < numBolts; i++) {
            // Create animated lightning particles with much longer reach
            this.particles.push({
                x: x,
                y: y,
                startX: x,
                startY: y,
                targetX: x + (Math.random() - 0.5) * 400, // Increased from 150 to 400
                targetY: y + (Math.random() - 0.5) * 400, // Increased from 150 to 400
                life: 20 + Math.random() * 15, // Short but dramatic
                maxLife: 35,
                type: 'lightning',
                color: this.getCurrentColor(), // Use player's selected color
                segments: [],
                intensity: Math.random() * 0.5 + 0.5, // Brightness variation
                branchChance: 0.3, // Chance to create branches
                width: Math.max(2, this.brushSize / 8) // Scale with brush size
            });
        }
    }

    drawBugs(x, y) {
        // Create cute running bugs that scurry around
        // Limit to 10 bugs on screen at a time
        const currentBugCount = this.particles.filter(p => p.type === 'bug').length;
        const maxBugs = 10;
        
        if (currentBugCount >= maxBugs) {
            return; // Don't add more bugs if we're at the limit
        }
        
        const bugTypes = ['🐞', '🐜', '🪲', '🦗', '🕷️'];
        const availableSlots = maxBugs - currentBugCount;
        const numBugs = Math.min(3 + Math.floor(Math.random() * 4), availableSlots); // 3-6 bugs, but not exceeding limit
        
        for (let i = 0; i < numBugs; i++) {
            // Random direction for each bug to run
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3; // Variable speed
            
            this.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 150 + Math.random() * 100, // 150-250 frames
                type: 'bug',
                emoji: bugTypes[Math.floor(Math.random() * bugTypes.length)],
                size: 12 + Math.random() * 8,
                wiggle: 0,
                wiggleSpeed: 0.2 + Math.random() * 0.3,
                direction: angle,
                changeDirectionTimer: 30 + Math.random() * 40,
                maxChangeTimer: 30 + Math.random() * 40
            });
        }
    }

    drawStreamers(x, y) {
        // Simple, elegant flowing streamers with curling motion
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
        const numStreamers = Math.max(2, Math.floor(this.brushSize / 6)); // Scale with brush size
        
        for (let i = 0; i < numStreamers; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * this.brushSize,
                y: y + (Math.random() - 0.5) * this.brushSize,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * -4 - 2,
                life: 120 + Math.random() * 60,
                type: 'streamer',
                color: colors[Math.floor(Math.random() * colors.length)],
                width: (Math.random() * 6 + 10) * (this.brushSize / 10), // Extra wide ribbons
                length: (Math.random() * 80 + 60) * (this.brushSize / 8), // Much longer streamers
                wave: Math.random() * Math.PI * 2,
                curl: Math.random() * 0.3 + 0.1, // How much the ribbon curls
                twist: Math.random() * Math.PI * 2 // Initial twist rotation
            });
        }
    }

    floodFill(x, y) {
        // Simple flood fill implementation
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const targetColor = this.getPixelColor(imageData, Math.floor(x), Math.floor(y));
        const fillColor = this.hexToRgb(this.currentColor);
        
        if (this.colorsMatch(targetColor, fillColor)) return;
        
        this.floodFillRecursive(imageData, Math.floor(x), Math.floor(y), targetColor, fillColor);
        this.ctx.putImageData(imageData, 0, 0);
        this.saveState();
    }

    getPixelColor(imageData, x, y) {
        if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
            return { r: 0, g: 0, b: 0, a: 0 };
        }
        
        const index = (y * imageData.width + x) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }

    setPixelColor(imageData, x, y, color) {
        if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) return;
        
        const index = (y * imageData.width + x) * 4;
        imageData.data[index] = color.r;
        imageData.data[index + 1] = color.g;
        imageData.data[index + 2] = color.b;
        imageData.data[index + 3] = 255;
    }

    colorsMatch(color1, color2) {
        return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b && color1.a === color2.a;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 255
        } : { r: 0, g: 0, b: 0, a: 255 };
    }

    floodFillRecursive(imageData, x, y, targetColor, fillColor) {
        const currentColor = this.getPixelColor(imageData, x, y);
        
        if (!this.colorsMatch(currentColor, targetColor) || this.colorsMatch(currentColor, fillColor)) {
            return;
        }
        
        this.setPixelColor(imageData, x, y, fillColor);
        
        // Use iterative approach to avoid stack overflow
        const stack = [{ x, y }];
        
        while (stack.length > 0) {
            const { x: currentX, y: currentY } = stack.pop();
            
            // Check 4 directions
            const directions = [
                { x: currentX + 1, y: currentY },
                { x: currentX - 1, y: currentY },
                { x: currentX, y: currentY + 1 },
                { x: currentX, y: currentY - 1 }
            ];
            
            for (const dir of directions) {
                const pixelColor = this.getPixelColor(imageData, dir.x, dir.y);
                if (this.colorsMatch(pixelColor, targetColor)) {
                    this.setPixelColor(imageData, dir.x, dir.y, fillColor);
                    stack.push(dir);
                }
            }
        }
    }

    getRandomFireworkColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomGlitterColor() {
        const glitterColors = ['#ffffff', '#ffff00', '#ffd700', '#ffb6c1', '#87ceeb', '#98fb98', '#dda0dd', '#f0e68c'];
        return glitterColors[Math.floor(Math.random() * glitterColors.length)];
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    drawFireworks(x, y) {
        // Create realistic fireworks with rocket launch and sparkling trail
        const launchHeight = 100 + Math.random() * 80; // Varied launch height
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ffa500', '#ff69b4', '#ffffff'];
        const fireworkColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Create the rocket that shoots upward
        this.particles.push({
            x: x,
            y: y,
            startY: y,
            targetY: y - launchHeight,
            vx: (Math.random() - 0.5) * 2, // Slight horizontal drift
            vy: 0,
            life: 60, // Launch duration
            type: 'firework_rocket',
            color: fireworkColor,
            size: 3,
            exploded: false,
            trailTimer: 0
        });
    }

    // Coloring books feature removed; placeholder to avoid reference errors if any remain
    setupColoringBooks() {}

    // Removed PDF modal methods
    async showColoringBooksModal() {}

    hideColoringBooksModal() {}

    async loadPdfFiles() { return []; }

    async handlePdfFileInput() {}

    async selectPdf() {}

    async showPageSelectionModal() {}

    async generatePageThumbnail() {}

    hidePageSelectionModal() {}

    async selectPage() {}

    async enterPdfMode() {}

    zoomPdf() {}
    
    resetPdfZoom() {}
    
    updateZoomDisplay() {}

    toggleMagnifier() {
        this.magnifierActive = !this.magnifierActive;
        
        const magnifierTool = document.getElementById('magnifierTool');
        if (this.magnifierActive) {
            // Activate magnifier
            if (magnifierTool) magnifierTool.classList.add('active');
            // Keep crosshair visible initially; we'll hide only while directly over magnifier
            this.canvas.style.cursor = 'crosshair';
            
            // Position magnifier in center initially
            this.magnifierX = this.canvas.width / 2;
            this.magnifierY = this.canvas.height / 2;
            
            // Create magnifier UI if it doesn't exist
            if (!this.magnifierUI) {
                this.createMagnifierUI();
            }
            this.magnifierUI.style.display = 'block';
            this.updateMagnifierPosition();
            
            // Start magnifier rendering
            if (!this.magnifierAnimationRunning) {
                this.magnifierAnimationRunning = true;
                this.renderMagnifier();
            }
        } else {
            // Deactivate magnifier
            if (magnifierTool) magnifierTool.classList.remove('active');
            this.canvas.style.cursor = 'crosshair';
            
            if (this.magnifierUI) {
                this.magnifierUI.style.display = 'none';
            }
            this.magnifierAnimationRunning = false;
        }
    }
    
    createMagnifierUI() {
        // Create magnifier overlay container
        const container = document.createElement('div');
        container.id = 'magnifierContainer';
        container.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            display: none;
        `;
        
        // Create magnifier circle canvas
        const magnifierCanvas = document.createElement('canvas');
        magnifierCanvas.width = this.magnifierRadius * 2 + 20; // Extra space for border
        magnifierCanvas.height = this.magnifierRadius * 2 + 80; // Extra space for slider
        magnifierCanvas.style.cssText = 'pointer-events: auto; cursor: move;';
        
        // Create zoom slider
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 8px 12px;
            border-radius: 20px;
            border: 3px solid #FF69B4;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        const zoomLabel = document.createElement('span');
        zoomLabel.textContent = '🔍';
        zoomLabel.style.cssText = 'font-size: 16px;';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1.5';
        slider.max = '5';
        slider.step = '0.5';
        slider.value = this.magnifierZoom.toString();
        slider.style.cssText = 'width: 100px; cursor: pointer;';
        
        const zoomValue = document.createElement('span');
        zoomValue.textContent = this.magnifierZoom + 'x';
        zoomValue.style.cssText = 'font-size: 12px; font-weight: bold; color: #8B008B; min-width: 30px;';
        
        slider.addEventListener('input', (e) => {
            this.magnifierZoom = parseFloat(e.target.value);
            zoomValue.textContent = this.magnifierZoom + 'x';
        });
        
        sliderContainer.appendChild(zoomLabel);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(zoomValue);
        
        container.appendChild(magnifierCanvas);
        container.appendChild(sliderContainer);
        document.body.appendChild(container);
        
        this.magnifierUI = container;
        this.magnifierCanvas = magnifierCanvas;
        this.magnifierCtx = magnifierCanvas.getContext('2d');
        
        // Add handlers for drawing and dragging
        let isDraggingMagnifier = false;
        let isDrawingInMagnifier = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;
        
        magnifierCanvas.addEventListener('mousedown', (e) => {
            const rect = magnifierCanvas.getBoundingClientRect();
            const localX = e.clientX - rect.left;
            const localY = e.clientY - rect.top;
            const centerX = this.magnifierRadius + 10;
            const centerY = this.magnifierRadius + 10;
            
            // Check if click is inside the magnifier circle
            const distanceFromCenter = Math.sqrt(
                Math.pow(localX - centerX, 2) + Math.pow(localY - centerY, 2)
            );
            
            if (distanceFromCenter <= this.magnifierRadius) {
                // Click inside circle - start drawing
                isDrawingInMagnifier = true;
                const canvasCoords = this.magnifierToCanvasCoords(localX, localY);
                this.startDrawingAtCoords(canvasCoords.x, canvasCoords.y);
            } else {
                // Click outside circle - drag magnifier
                isDraggingMagnifier = true;
                dragOffsetX = e.clientX - rect.left - this.magnifierRadius - 10;
                dragOffsetY = e.clientY - rect.top - this.magnifierRadius - 10;
            }
        });

        // Cursor visibility management: hide base canvas cursor only while over magnifier surface
        magnifierCanvas.addEventListener('mouseenter', () => {
            if (this.magnifierActive) {
                this.canvas.style.cursor = 'none';
            }
        });
        magnifierCanvas.addEventListener('mouseleave', () => {
            if (this.magnifierActive) {
                this.canvas.style.cursor = 'crosshair';
            }
        });
        
        magnifierCanvas.addEventListener('mousemove', (e) => {
            if (isDrawingInMagnifier) {
                const rect = magnifierCanvas.getBoundingClientRect();
                const localX = e.clientX - rect.left;
                const localY = e.clientY - rect.top;
                const canvasCoords = this.magnifierToCanvasCoords(localX, localY);
                this.drawAtCoords(canvasCoords.x, canvasCoords.y);
            }
        });
        
        magnifierCanvas.addEventListener('mouseup', () => {
            if (isDrawingInMagnifier) {
                this.stopDrawing();
                isDrawingInMagnifier = false;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDraggingMagnifier && this.magnifierActive) {
                const canvasRect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / canvasRect.width;
                const scaleY = this.canvas.height / canvasRect.height;
                
                this.magnifierX = (e.clientX - canvasRect.left - dragOffsetX) * scaleX;
                this.magnifierY = (e.clientY - canvasRect.top - dragOffsetY) * scaleY;
                
                // Clamp to canvas bounds
                this.magnifierX = Math.max(this.magnifierRadius, Math.min(this.canvas.width - this.magnifierRadius, this.magnifierX));
                this.magnifierY = Math.max(this.magnifierRadius, Math.min(this.canvas.height - this.magnifierRadius, this.magnifierY));
                
                this.updateMagnifierPosition();
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDraggingMagnifier = false;
        });
        
        // Touch support
        magnifierCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = magnifierCanvas.getBoundingClientRect();
            const localX = touch.clientX - rect.left;
            const localY = touch.clientY - rect.top;
            const centerX = this.magnifierRadius + 10;
            const centerY = this.magnifierRadius + 10;
            
            // Check if touch is inside the magnifier circle
            const distanceFromCenter = Math.sqrt(
                Math.pow(localX - centerX, 2) + Math.pow(localY - centerY, 2)
            );
            
            if (distanceFromCenter <= this.magnifierRadius) {
                // Touch inside circle - start drawing
                isDrawingInMagnifier = true;
                const canvasCoords = this.magnifierToCanvasCoords(localX, localY);
                this.startDrawingAtCoords(canvasCoords.x, canvasCoords.y);
            } else {
                // Touch outside circle - drag magnifier
                isDraggingMagnifier = true;
                dragOffsetX = touch.clientX - rect.left - this.magnifierRadius - 10;
                dragOffsetY = touch.clientY - rect.top - this.magnifierRadius - 10;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            
            if (isDrawingInMagnifier) {
                const rect = magnifierCanvas.getBoundingClientRect();
                const localX = touch.clientX - rect.left;
                const localY = touch.clientY - rect.top;
                const canvasCoords = this.magnifierToCanvasCoords(localX, localY);
                this.drawAtCoords(canvasCoords.x, canvasCoords.y);
            } else if (isDraggingMagnifier && this.magnifierActive) {
                const canvasRect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / canvasRect.width;
                const scaleY = this.canvas.height / canvasRect.height;
                
                this.magnifierX = (touch.clientX - canvasRect.left - dragOffsetX) * scaleX;
                this.magnifierY = (touch.clientY - canvasRect.top - dragOffsetY) * scaleY;
                
                // Clamp to canvas bounds
                this.magnifierX = Math.max(this.magnifierRadius, Math.min(this.canvas.width - this.magnifierRadius, this.magnifierX));
                this.magnifierY = Math.max(this.magnifierRadius, Math.min(this.canvas.height - this.magnifierRadius, this.magnifierY));
                
                this.updateMagnifierPosition();
            }
        });
        
        document.addEventListener('touchend', () => {
            if (isDrawingInMagnifier) {
                this.stopDrawing();
                isDrawingInMagnifier = false;
            }
            isDraggingMagnifier = false;
        });
    }
    
    updateMagnifierPosition() {
        if (!this.magnifierUI) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / this.canvas.width;
        const scaleY = canvasRect.height / this.canvas.height;
        
        const screenX = canvasRect.left + this.magnifierX * scaleX;
        const screenY = canvasRect.top + this.magnifierY * scaleY;
        
        this.magnifierUI.style.left = (screenX - this.magnifierRadius - 10) + 'px';
        this.magnifierUI.style.top = (screenY - this.magnifierRadius - 10) + 'px';
    }
    
    renderMagnifier() {
        if (!this.magnifierActive || !this.magnifierCtx) return;
        
        const ctx = this.magnifierCtx;
        const radius = this.magnifierRadius;
        
        // Clear the magnifier canvas
        ctx.clearRect(0, 0, this.magnifierCanvas.width, this.magnifierCanvas.height);
        
        // Draw circular clipping mask
        ctx.save();
        ctx.beginPath();
        ctx.arc(radius + 10, radius + 10, radius, 0, Math.PI * 2);
        ctx.clip();
        
        // Calculate source region
        const sourceSize = radius / this.magnifierZoom;
        const sourceX = this.magnifierX - sourceSize;
        const sourceY = this.magnifierY - sourceSize;
        const sourceWidth = sourceSize * 2;
        const sourceHeight = sourceSize * 2;
        
        // Draw magnified content from main canvas
        ctx.drawImage(
            this.canvas,
            sourceX, sourceY, sourceWidth, sourceHeight,
            10, 10, radius * 2, radius * 2
        );
        
        // Also draw overlay canvas content (trains, particles, etc.)
        if (this.overlayCanvas) {
            ctx.drawImage(
                this.overlayCanvas,
                sourceX, sourceY, sourceWidth, sourceHeight,
                10, 10, radius * 2, radius * 2
            );
        }
        
        ctx.restore();
        
        // Draw magnifier border
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(radius + 10, radius + 10, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw crosshair at center
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(radius + 10 - 10, radius + 10);
        ctx.lineTo(radius + 10 + 10, radius + 10);
        ctx.moveTo(radius + 10, radius + 10 - 10);
        ctx.lineTo(radius + 10, radius + 10 + 10);
        ctx.stroke();
        
        // Continue animation
        if (this.magnifierAnimationRunning) {
            requestAnimationFrame(() => this.renderMagnifier());
        }
    }
    
    magnifierToCanvasCoords(localX, localY) {
        // Convert magnifier canvas coordinates to main canvas coordinates
        const centerX = this.magnifierRadius + 10;
        const centerY = this.magnifierRadius + 10;
        
        // Get offset from center of magnifier
        const offsetX = localX - centerX;
        const offsetY = localY - centerY;
        
        // Scale by zoom level (inverse)
        const sourceSize = this.magnifierRadius / this.magnifierZoom;
        const scaleFactor = sourceSize / this.magnifierRadius;
        
        // Convert to canvas coordinates
        const canvasX = this.magnifierX + (offsetX * scaleFactor);
        const canvasY = this.magnifierY + (offsetY * scaleFactor);
        
        return { x: canvasX, y: canvasY };
    }
    
    startDrawingAtCoords(x, y) {
        // Start drawing at specific canvas coordinates (for magnifier)
        // Initialize train track when starting to draw
        if (this.currentTool === 'train-track') {
            this.trainTracks = this.trainTracks || [];
            this.trains = this.trains || [];
            this.currentTrack = [];
        }

        this.isDrawing = true;
        this.lastPoint = { x, y };

        // Start replay stroke if recording
        if (window.Replay && window.Replay.isRecording) {
            window.Replay.startStroke({
                tool: this.currentTool,
                color: this.getCurrentColor(),
                size: this.brushSize,
                start: { x, y }
            });
        }

        if (this.currentTool === 'brush') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.getCurrentColor();
            this.ctx.lineWidth = this.brushSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        } else if (this.currentTool === 'fireworks') {
            this.drawFireworks(x, y);
        } else if (this.currentTool === 'spray') {
            this.drawSpray(x, y);
        } else if (this.currentTool === 'fill') {
            this.floodFill(x, y);
        } else if (this.currentTool === 'neon') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.neonWhitePoints = null;
        } else if (this.currentTool === 'wobbly-crayon') {
            this.currentWigglyLine = null;
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.getCurrentColor();
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        } else if (this.currentTool === 'smudge') {
            this.startSmudging(x, y);
        } else if (this.currentTool === 'blend') {
            this.startBlending(x, y);
        } else if (this.currentTool === 'train-track') {
            this.drawTrainTrack(x, y);
        } else if (this.currentTool === 'leaf-trail') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.lastLeafTime = 0;
        } else if (this.currentTool === 'flower-chain') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.lastFlowerTime = 0;
            this.flowers = this.flowers || [];
        } else if (this.currentTool === 'grass-stamper') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.lastGrassTime = 0;
            this.grassBlades = this.grassBlades || [];
        } else if (this.currentTool === 'blocky-builder') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.blockSize = Math.max(4, this.brushSize * 0.8);
            this.lastBlockX = null;
            this.lastBlockY = null;
            const gridX = Math.floor(x / this.blockSize) * this.blockSize;
            const gridY = Math.floor(y / this.blockSize) * this.blockSize;
            this.drawSingleBlock(gridX, gridY);
            this.lastBlockX = gridX;
            this.lastBlockY = gridY;
        } else if (this.currentTool === 'mirror-painting') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.getCurrentColor();
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.mirrorSections = 8;
            this.centerX = this.canvas.width / 2;
            this.centerY = this.canvas.height / 2;
            for (let i = 0; i < this.mirrorSections; i++) {
                this.ctx.beginPath();
                const mirrorPoint = this.getMirrorPoint(x, y, i);
                this.ctx.moveTo(mirrorPoint.x, mirrorPoint.y);
            }
        } else if (this.currentTool === 'eraser') {
            this.drawEraser(x, y);
        }
    }
    
    drawAtCoords(x, y) {
        if (!this.isDrawing) return;

        if (this.currentTool === 'brush') {
            if (this.isRainbowMode) {
                this.ctx.strokeStyle = this.getCurrentColor();
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            } else {
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        } else if (this.currentTool === 'eraser') {
            this.drawEraser(x, y);
        } else if (this.currentTool === 'fireworks') {
            this.drawFireworks(x, y);
        } else if (this.currentTool === 'spray') {
            this.drawSpray(x, y);
        } else if (this.currentTool === 'glitter') {
            this.drawGlitter(x, y);
        } else if (this.currentTool === 'neon') {
            this.drawNeon(x, y);
        } else if (this.currentTool === 'bubble') {
            this.drawBubbles(x, y);
        } else if (this.currentTool === 'confetti') {
            this.drawConfetti(x, y);
        } else if (this.currentTool === 'sparkles') {
            this.drawColorfulWorms(x, y);
        } else if (this.currentTool === 'lightning') {
            this.drawLightning(x, y);
        } else if (this.currentTool === 'bugs') {
            this.drawBugs(x, y);
        } else if (this.currentTool === 'streamers') {
            this.drawStreamers(x, y);
        } else if (this.currentTool === 'wobbly-crayon') {
            this.drawWobblyCrayon(x, y);
        } else if (this.currentTool === 'smudge') {
            this.drawSmudge(x, y);
        } else if (this.currentTool === 'blend') {
            this.drawBlend(x, y);
        } else if (this.currentTool === 'train-track') {
            this.drawTrainTrack(x, y);
        } else if (this.currentTool === 'leaf-trail') {
            this.drawLeafTrail(x, y);
        } else if (this.currentTool === 'flower-chain') {
            this.drawFlowerChain(x, y);
        } else if (this.currentTool === 'grass-stamper') {
            this.drawGrassStamper(x, y);
        } else if (this.currentTool === 'blocky-builder') {
            this.drawBlockyBuilder(x, y);
        } else if (this.currentTool === 'mirror-painting') {
            this.drawMirrorPainting(x, y);
        }

        // Record for replay if active
        if (window.Replay && window.Replay.isRecording && window.Replay.currentStroke) {
            window.Replay.addPoint(x, y);
        }

        this.lastPoint = { x, y };
    }

    async renderPdfPage() {}

    setupPdfDrawingEvents() {}

    startPdfDrawing() {}

    drawOnPdf() {}

    stopPdfDrawing() {}

    handlePdfTouch() {}

    clearPdfDrawing() {}

    exitPdfMode() {}

    startAnimationLoop() {
        const animate = () => {
            this.updateParticles();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    // Helper function to get adjusted coordinates for PDF mode
    getAdjustedCoords(x, y) {
        // Particles are now stored in canvas coordinates directly, no adjustment needed
        return { x, y };
    }

    updateParticles() {
        // Determine which overlay context to use based on current mode
    const overlayCtx = this.overlayCtx;
    const overlayCanvas = this.overlayCanvas;
        
        if (this.particles.length > 0) {
            console.log('updateParticles - pdfMode:', this.pdfMode, 'overlayCtx exists:', !!overlayCtx, 'particles:', this.particles.length, 'overlayCanvas size:', overlayCanvas ? `${overlayCanvas.width}x${overlayCanvas.height}` : 'null');
            if (this.pdfMode && this.pdfOverlayCanvas) {
                console.log('PDF overlay canvas position:', this.pdfOverlayCanvas.style.left, this.pdfOverlayCanvas.style.top, 'z-index:', this.pdfOverlayCanvas.style.zIndex);
            }
        }
        
        // Clear overlay canvas for fresh animation frame
        if (overlayCtx && overlayCanvas) {
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
        
        // Draw snap point indicator if train-track tool is selected and near a snap point
        if (this.currentSnapPoint && this.currentTool === 'train-track' && overlayCtx) {
            const adjustedCoords = this.getAdjustedCoords(this.currentSnapPoint.point.x, this.currentSnapPoint.point.y);
            
            // Animated pulsing effect
            const pulseSize = 15 + Math.sin(Date.now() * 0.005) * 5;
            
            overlayCtx.save();
            overlayCtx.strokeStyle = '#00FF00';
            overlayCtx.lineWidth = 3;
            overlayCtx.globalAlpha = 0.8;
            overlayCtx.beginPath();
            overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, pulseSize, 0, Math.PI * 2);
            overlayCtx.stroke();
            
            // Inner dot
            overlayCtx.fillStyle = '#00FF00';
            overlayCtx.globalAlpha = 0.6;
            overlayCtx.beginPath();
            overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, 4, 0, Math.PI * 2);
            overlayCtx.fill();
            
            overlayCtx.restore();
        }
        
        // Animate trains first so they appear underneath other effects
        this.animateTrains(overlayCtx, overlayCanvas);
        
        // For blinking to work, we need to clear and redraw particles each frame
        // But we don't want to clear the user's artwork
        // So we'll use a composite operation approach
        
        for (const particle of this.particles) {
            if (particle.type === 'firework_rocket') {
                // Rocket launch phase with sparkling trail
                particle.life--;
                particle.trailTimer++;
                
                // Calculate rocket position with realistic physics
                const progress = 1 - (particle.life / 60);
                const easedProgress = 1 - Math.pow(1 - progress, 2.2); // Realistic deceleration
                particle.y = particle.startY + (particle.targetY - particle.startY) * easedProgress;
                particle.x += particle.vx * (1 - progress * 0.5); // Horizontal drift slows down
                
                // Add sparkling trail particles
                if (particle.trailTimer % 2 === 0 && particle.life > 5) {
                    this.particles.push({
                        x: particle.x + (Math.random() - 0.5) * 4,
                        y: particle.y + Math.random() * 8,
                        vx: (Math.random() - 0.5) * 1,
                        vy: Math.random() * 2 + 1,
                        life: 20,
                        type: 'rocket_trail',
                        color: particle.color,
                        size: 1 + Math.random()
                    });
                }
                
                // Draw the rocket
                if (overlayCtx) {
                    // Adjust coordinates for PDF mode
                    const adjustedCoords = this.getAdjustedCoords(particle.x, particle.y);
                    
                    overlayCtx.save();
                    overlayCtx.globalAlpha = 0.9;
                    overlayCtx.fillStyle = particle.color;
                    overlayCtx.shadowColor = particle.color;
                    overlayCtx.shadowBlur = 12;
                    overlayCtx.beginPath();
                    overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, particle.size, 0, Math.PI * 2);
                    overlayCtx.fill();
                    
                    // Bright white center
                    overlayCtx.fillStyle = '#ffffff';
                    overlayCtx.shadowBlur = 6;
                    overlayCtx.beginPath();
                    overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, particle.size * 0.4, 0, Math.PI * 2);
                    overlayCtx.fill();
                    overlayCtx.restore();
                }
                
                // Explode when reaching target or life ends
                if (particle.life <= 0 || particle.y <= particle.targetY) {
                    particle.exploded = true;
                    
                    // Create explosion burst
                    const particleCount = 20 + Math.floor(Math.random() * 15);
                    
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
                        const speed = 3 + Math.random() * 4;
                        
                        this.particles.push({
                            x: particle.x,
                            y: particle.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 50 + Math.random() * 30,
                            type: 'firework_particle',
                            color: particle.color,
                            size: 2 + Math.random() * 2
                        });
                    }
                    
                    // Add bright white center sparks
                    for (let i = 0; i < 8; i++) {
                        this.particles.push({
                            x: particle.x,
                            y: particle.y,
                            vx: (Math.random() - 0.5) * 3,
                            vy: (Math.random() - 0.5) * 3,
                            life: 30,
                            type: 'firework_particle',
                            color: '#ffffff',
                            size: 3
                        });
                    }
                }
            } else if (particle.type === 'rocket_trail') {
                // Sparkling trail particles from rocket
                particle.life--;
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.15; // Light gravity
                particle.vx *= 0.97; // Air resistance
                
                const alpha = particle.life / 20;
                
                if (overlayCtx) {
                    overlayCtx.save();
                    overlayCtx.globalAlpha = alpha * 0.9;
                    overlayCtx.fillStyle = particle.color;
                    overlayCtx.shadowColor = particle.color;
                    overlayCtx.shadowBlur = 6;
                    overlayCtx.beginPath();
                    overlayCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    overlayCtx.fill();
                    overlayCtx.restore();
                }
            } else if (particle.type === 'firework_particle') {
                // Simple realistic firework particles
                particle.life--;
                particle.vx *= 0.995; // Air resistance
                particle.vy *= 0.995;
                particle.vy += 0.08; // Gravity
                
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                const alpha = particle.life / 80;
                
                if (overlayCtx && alpha > 0) {
                    overlayCtx.save();
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.fillStyle = particle.color;
                    overlayCtx.shadowColor = particle.color;
                    overlayCtx.shadowBlur = 8;
                    overlayCtx.beginPath();
                    overlayCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    overlayCtx.fill();
                    overlayCtx.restore();
                }
            } else if (particle.type === 'glitter') {
                // Fast blinking particles - ensure ALL particles blink (WORKING VERSION)
                if (particle.life === -1) {
                    // Force initialization if missing
                    if (particle.blinkTimer === undefined) {
                        particle.blinkTimer = Math.floor(Math.random() * 20);
                    }
                    
                    // Increment blink timer every frame - ALWAYS
                    particle.blinkTimer += 1;
                    
                    // MUCH faster cycle: 20 frames = 0.33 seconds at 60fps
                    // ON for 5 frames, OFF for 15 frames (mostly off)
                    const cyclePosition = particle.blinkTimer % 20;
                    const isBlinkingOn = cyclePosition < 5;
                    
                    if (overlayCtx) {
                        // Apply coordinate adjustment for PDF mode
                        const adjustedCoords = this.getAdjustedCoords(particle.x, particle.y);
                        
                        // Clear the area where this particle might be drawn - minimal area
                        overlayCtx.save();
                        overlayCtx.globalCompositeOperation = 'destination-out';
                        overlayCtx.beginPath();
                        overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, 2.5, 0, Math.PI * 2); // Much smaller clear area
                        overlayCtx.fill();
                        overlayCtx.restore();
                        
                        // ONLY draw when blinking ON - otherwise draw nothing
                        if (isBlinkingOn) {
                            // Use player's selected color when ON
                            overlayCtx.save();
                            overlayCtx.globalAlpha = 1;
                            overlayCtx.globalCompositeOperation = 'source-over';
                            overlayCtx.fillStyle = particle.color; // Player's selected color
                            overlayCtx.beginPath();
                            overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, 2, 0, Math.PI * 2); // Small dots
                            overlayCtx.fill();
                            
                            // Thin white border for visibility
                            overlayCtx.strokeStyle = '#ffffff';
                            overlayCtx.lineWidth = 1;
                            overlayCtx.stroke();
                            overlayCtx.restore();
                        }
                    }
                    // When OFF: area is already cleared above
                } else {
                    // Temporary glitter (for other effects)
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.life--;
                    
                    if (overlayCtx) {
                        // Apply coordinate adjustment for PDF mode
                        const adjustedCoords = this.getAdjustedCoords(particle.x, particle.y);
                        
                        const alpha = particle.life / 40;
                        overlayCtx.save();
                        overlayCtx.globalAlpha = alpha;
                        overlayCtx.fillStyle = particle.color;
                        overlayCtx.beginPath();
                        overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, particle.size, 0, Math.PI * 2);
                        overlayCtx.fill();
                        overlayCtx.restore();
                    }
                }
            } else if (particle.type === 'bubble') {
                // Clear previous balloon position first (including string area) on overlay
                if (overlayCtx) {
                    overlayCtx.save();
                    overlayCtx.globalCompositeOperation = 'destination-out';
                    overlayCtx.globalAlpha = 1; // Full clearing
                    
                    // Apply coordinate adjustment for PDF mode
                    const prevCoords = this.getAdjustedCoords(particle.prevX, particle.prevY);
                    
                    overlayCtx.beginPath();
                    // Clear balloon area
                    overlayCtx.arc(prevCoords.x, prevCoords.y, particle.size + 3, 0, Math.PI * 2);
                    overlayCtx.fill();
                    // Clear string area (wider to account for wave)
                    overlayCtx.beginPath();
                    overlayCtx.rect(prevCoords.x - 8, prevCoords.y + particle.size, 16, particle.stringLength + 5);
                    overlayCtx.fill();
                    overlayCtx.restore();
                }
                
                // Store current position as previous for next frame
                particle.prevX = particle.x;
                particle.prevY = particle.y;
                
                // Update balloon physics
                particle.wobble += 0.05; // Slower wobble for balloons
                particle.windPhase += 0.08; // Wind animation speed
                particle.x += particle.vx + Math.sin(particle.wobble) * 0.3; // Gentle wobble
                particle.y += particle.vy;
                particle.vy -= 0.01; // Slight upward acceleration (helium effect)
                particle.life--;
                
                // Draw balloon if still alive on overlay
                const alpha = Math.min(1, particle.life / 80) * particle.alpha;
                if (alpha > 0.01 && overlayCtx) {
                    overlayCtx.save();
                    
                    // Apply coordinate adjustment for PDF mode
                    const adjustedCoords = this.getAdjustedCoords(particle.x, particle.y);
                    
                    // Draw wavy balloon string (behind balloon)
                    overlayCtx.globalAlpha = alpha * 0.8;
                    overlayCtx.strokeStyle = '#333333'; // Dark string color
                    overlayCtx.lineWidth = Math.max(1, this.brushSize / 20); // String thickness scales with brush
                    overlayCtx.beginPath();
                    
                    // Create wavy string effect
                    const segments = Math.max(5, Math.floor(particle.stringLength / 3)); // More segments for longer strings
                    overlayCtx.moveTo(adjustedCoords.x, adjustedCoords.y + particle.size);
                    
                    for (let i = 1; i <= segments; i++) {
                        const segmentY = adjustedCoords.y + particle.size + (particle.stringLength * i / segments);
                        // Wave effect gets stronger towards the bottom of the string
                        const waveStrength = (i / segments) * 6; // Stronger wave at bottom
                        const waveX = adjustedCoords.x + Math.sin(particle.windPhase + i * 0.5) * waveStrength;
                        overlayCtx.lineTo(waveX, segmentY);
                    }
                    overlayCtx.stroke();
                    
                    // Main balloon body - more solid and opaque
                    overlayCtx.globalAlpha = alpha * 0.9;
                    overlayCtx.fillStyle = particle.color;
                    overlayCtx.beginPath();
                    overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, particle.size, 0, Math.PI * 2);
                    overlayCtx.fill();
                    
                    // Balloon rim - darker outline
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.strokeStyle = particle.color;
                    overlayCtx.lineWidth = 2;
                    overlayCtx.beginPath();
                    overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, particle.size, 0, Math.PI * 2);
                    overlayCtx.stroke();
                    
                    // Balloon highlight - white shine
                    overlayCtx.globalAlpha = alpha * 0.7;
                    overlayCtx.fillStyle = 'white';
                    overlayCtx.beginPath();
                    overlayCtx.arc(
                        adjustedCoords.x - particle.size * 0.4, 
                        adjustedCoords.y - particle.size * 0.4, 
                        particle.size * 0.25, 
                        0, Math.PI * 2
                    );
                    overlayCtx.fill();
                    
                    overlayCtx.restore();
                }
            } else if (particle.type === 'confetti') {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.15; // gravity
                particle.rotation += particle.rotationSpeed;
                particle.life--;
                
                const adjustedCoords = this.getAdjustedCoords(particle.x, particle.y);
                const alpha = particle.life / 100;
                if (overlayCtx) {
                    overlayCtx.save();
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.translate(adjustedCoords.x, adjustedCoords.y);
                    overlayCtx.rotate(particle.rotation);
                    overlayCtx.fillStyle = particle.color;
                    overlayCtx.fillRect(-particle.size/4, -particle.size/8, particle.size/2, particle.size/4);
                    overlayCtx.restore();
                }
            } else if (particle.type === 'worm') {
                // Realistic worm movement with wiggling
                particle.wiggle += particle.wiggleSpeed;
                particle.direction += (Math.random() - 0.5) * particle.turnRate; // Random turning
                
                // Wiggling motion - side to side movement
                const wiggleOffset = Math.sin(particle.wiggle) * 2;
                const perpX = -Math.sin(particle.direction) * wiggleOffset;
                const perpY = Math.cos(particle.direction) * wiggleOffset;
                
                // Forward movement in current direction
                particle.vx = Math.cos(particle.direction) * 1.5;
                particle.vy = Math.sin(particle.direction) * 1.5;
                
                // Apply movement with wiggle
                particle.x += particle.vx + perpX;
                particle.y += particle.vy + perpY;
                particle.life--;
                
                // Add current position to trail
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > particle.segmentLength) {
                    particle.trail.shift();
                }
                
                // Draw realistic worm body on overlay canvas
                if (particle.trail.length > 1 && overlayCtx) {
                    overlayCtx.save();
                    
                    // Draw worm body segments
                    for (let i = 1; i < particle.trail.length; i++) {
                        const progress = i / particle.trail.length;
                        const alpha = progress * (particle.life / 150);
                        
                        // Worm gets thicker in the middle, thinner at ends
                        const thickness = Math.sin(progress * Math.PI) * 6 + 2;
                        
                        const prevCoords = this.getAdjustedCoords(particle.trail[i-1].x, particle.trail[i-1].y);
                        const currentCoords = this.getAdjustedCoords(particle.trail[i].x, particle.trail[i].y);
                        
                        overlayCtx.globalAlpha = alpha;
                        overlayCtx.strokeStyle = particle.color;
                        overlayCtx.lineWidth = thickness;
                        overlayCtx.lineCap = 'round';
                        overlayCtx.lineJoin = 'round';
                        
                        overlayCtx.beginPath();
                        overlayCtx.moveTo(prevCoords.x, prevCoords.y);
                        overlayCtx.lineTo(currentCoords.x, currentCoords.y);
                        overlayCtx.stroke();
                    }
                    
                    // Draw worm head (bigger and brighter)
                    if (particle.trail.length > 0) {
                        const head = particle.trail[particle.trail.length - 1];
                        const headCoords = this.getAdjustedCoords(head.x, head.y);
                        overlayCtx.globalAlpha = particle.life / 150;
                        overlayCtx.fillStyle = particle.color;
                        overlayCtx.beginPath();
                        overlayCtx.arc(headCoords.x, headCoords.y, 4, 0, Math.PI * 2);
                        overlayCtx.fill();
                        
                        // Add eyes to the head
                        overlayCtx.fillStyle = '#000000';
                        overlayCtx.beginPath();
                        overlayCtx.arc(headCoords.x - 1.5, headCoords.y - 1, 0.8, 0, Math.PI * 2);
                        overlayCtx.arc(headCoords.x + 1.5, headCoords.y - 1, 0.8, 0, Math.PI * 2);
                        overlayCtx.fill();
                    }
                    
                    overlayCtx.restore();
                }
            } else if (particle.type === 'lightning') {
                // Animated lightning with player's color
                particle.life--;
                
                // Generate jagged lightning path
                const segmentCount = 8;
                particle.segments = [];
                
                for (let i = 0; i <= segmentCount; i++) {
                    const progress = i / segmentCount;
                    const baseX = particle.startX + (particle.targetX - particle.startX) * progress;
                    const baseY = particle.startY + (particle.targetY - particle.startY) * progress;
                    
                    // Add random jagged offsets (more jagged in middle)
                    const jaggedIntensity = Math.sin(progress * Math.PI) * 30;
                    const offsetX = (Math.random() - 0.5) * jaggedIntensity;
                    const offsetY = (Math.random() - 0.5) * jaggedIntensity;
                    
                    particle.segments.push({
                        x: baseX + offsetX,
                        y: baseY + offsetY
                    });
                }
                
                // Draw lightning bolt on overlay canvas
                if (overlayCtx && particle.segments.length > 1) {
                    const alpha = (particle.life / particle.maxLife) * particle.intensity;
                    
                    overlayCtx.save();
                    
                    // Main lightning bolt
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.strokeStyle = particle.color;
                    overlayCtx.lineWidth = particle.width;
                    overlayCtx.lineCap = 'round';
                    overlayCtx.lineJoin = 'round';
                    overlayCtx.shadowColor = particle.color;
                    overlayCtx.shadowBlur = 15;
                    
                    overlayCtx.beginPath();
                    // Apply coordinate adjustment for PDF mode to first segment
                    const firstCoords = this.getAdjustedCoords(particle.segments[0].x, particle.segments[0].y);
                    overlayCtx.moveTo(firstCoords.x, firstCoords.y);
                    for (let i = 1; i < particle.segments.length; i++) {
                        const adjustedCoords = this.getAdjustedCoords(particle.segments[i].x, particle.segments[i].y);
                        overlayCtx.lineTo(adjustedCoords.x, adjustedCoords.y);
                    }
                    overlayCtx.stroke();
                    
                    // Bright white core
                    overlayCtx.globalAlpha = alpha * 0.8;
                    overlayCtx.strokeStyle = '#ffffff';
                    overlayCtx.lineWidth = Math.max(1, particle.width * 0.4);
                    overlayCtx.shadowBlur = 8;
                    
                    overlayCtx.beginPath();
                    // Apply coordinate adjustment for white core as well
                    overlayCtx.moveTo(firstCoords.x, firstCoords.y);
                    for (let i = 1; i < particle.segments.length; i++) {
                        const adjustedCoords = this.getAdjustedCoords(particle.segments[i].x, particle.segments[i].y);
                        overlayCtx.lineTo(adjustedCoords.x, adjustedCoords.y);
                    }
                    overlayCtx.stroke();
                    
                    // Add random branches
                    if (Math.random() < particle.branchChance && particle.life > particle.maxLife * 0.5) {
                        const branchStart = Math.floor(Math.random() * (particle.segments.length - 2)) + 1;
                        const startSeg = particle.segments[branchStart];
                        const branchLength = 3 + Math.random() * 4;
                        
                        overlayCtx.globalAlpha = alpha * 0.6;
                        overlayCtx.strokeStyle = particle.color;
                        overlayCtx.lineWidth = particle.width * 0.6;
                        overlayCtx.shadowBlur = 10;
                        
                        overlayCtx.beginPath();
                        const startCoords = this.getAdjustedCoords(startSeg.x, startSeg.y);
                        overlayCtx.moveTo(startCoords.x, startCoords.y);
                        
                        let branchX = startSeg.x;
                        let branchY = startSeg.y;
                        for (let j = 1; j <= branchLength; j++) {
                            branchX += (Math.random() - 0.5) * 25;
                            branchY += (Math.random() - 0.5) * 25;
                            const branchCoords = this.getAdjustedCoords(branchX, branchY);
                            overlayCtx.lineTo(branchCoords.x, branchCoords.y);
                        }
                        overlayCtx.stroke();
                    }
                    
                    overlayCtx.restore();
                }
            } else if (particle.type === 'bug') {
                // Bugs that run around and change direction
                particle.life--;
                particle.wiggle += particle.wiggleSpeed;
                particle.changeDirectionTimer--;
                
                // Change direction occasionally
                if (particle.changeDirectionTimer <= 0) {
                    particle.direction += (Math.random() - 0.5) * Math.PI; // Turn up to 90 degrees
                    particle.vx = Math.cos(particle.direction) * (2 + Math.random() * 3);
                    particle.vy = Math.sin(particle.direction) * (2 + Math.random() * 3);
                    particle.changeDirectionTimer = particle.maxChangeTimer;
                }
                
                // Move with slight wiggling motion
                particle.x += particle.vx + Math.sin(particle.wiggle) * 0.5;
                particle.y += particle.vy + Math.cos(particle.wiggle) * 0.5;
                
                // Bounce off screen edges
                if (particle.x < 0 || particle.x > this.overlayCanvas.width) {
                    particle.vx *= -1;
                    particle.direction = Math.atan2(particle.vy, particle.vx);
                }
                if (particle.y < 0 || particle.y > this.overlayCanvas.height) {
                    particle.vy *= -1;
                    particle.direction = Math.atan2(particle.vy, particle.vx);
                }
                
                const alpha = Math.min(1, particle.life / 50); // Fade out at end
                
                if (overlayCtx) {
                    overlayCtx.save();
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.font = `${particle.size}px Arial`;
                    overlayCtx.textAlign = 'center';
                    overlayCtx.textBaseline = 'middle';
                    
                    // Rotate bug slightly based on direction for realistic movement
                    overlayCtx.translate(particle.x, particle.y);
                    overlayCtx.rotate(particle.direction + Math.sin(particle.wiggle) * 0.2);
                    overlayCtx.fillText(particle.emoji, 0, 0);
                    
                    overlayCtx.restore();
                }
            } else if (particle.type === 'streamer') {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.08; // gentle gravity
                particle.wave += 0.12;
                particle.twist += particle.curl; // Add curling rotation
                particle.life--;
                
                const alpha = particle.life / 150;
                
                // Draw curling streamers with twisting motion on overlay canvas
                if (overlayCtx) {
                    overlayCtx.save();
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.strokeStyle = particle.color;
                    overlayCtx.lineWidth = particle.width;
                    overlayCtx.lineCap = 'round';
                    
                    // Draw curling streamer with spiral/twist motion
                    overlayCtx.beginPath();
                    
                    // Create a curling ribbon effect with more segments for longer streamers
                    for (let i = 0; i <= 8; i++) {
                        const progress = i / 8;
                        const segmentY = particle.y + (particle.length * progress);
                        
                        // Create curling motion that gets more pronounced down the ribbon
                        const curlRadius = progress * 15; // Curl gets wider down the ribbon
                        const curlAngle = particle.twist + progress * Math.PI * 3; // Multiple rotations
                        const curlX = Math.cos(curlAngle) * curlRadius;
                        const curlZ = Math.sin(curlAngle) * curlRadius * 0.5; // Depth effect
                        
                        // Add wave motion on top of curl
                        const waveX = Math.sin(particle.wave + progress * 2) * (8 - progress * 2);
                        
                        const finalX = particle.x + curlX + waveX;
                        const finalY = segmentY + curlZ; // Slight vertical offset from curl depth
                        
                        if (i === 0) {
                            overlayCtx.moveTo(finalX, finalY);
                        } else {
                            overlayCtx.lineTo(finalX, finalY);
                        }
                    }
                    
                    overlayCtx.stroke();
                    
                    // Add a subtle shadow/depth effect
                    overlayCtx.globalAlpha = alpha * 0.3;
                    overlayCtx.strokeStyle = '#00000020';
                    overlayCtx.lineWidth = particle.width * 1.2;
                    overlayCtx.stroke();
                    
                    overlayCtx.restore();
                }
            } else if (particle.type === 'train_smoke') {
                // Animated train smoke particles with fun shapes
                particle.life--;
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy *= 0.98; // Slight deceleration
                particle.vx *= 0.99; // Air resistance
                particle.size *= particle.growth; // Smoke expands as it rises
                particle.rotation += particle.rotationSpeed; // Rotate the shape
                
                const alpha = (particle.life / 60) * particle.alpha;
                
                if (overlayCtx && alpha > 0.01) {
                    overlayCtx.save();
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.translate(particle.x, particle.y);
                    overlayCtx.rotate(particle.rotation);
                    
                    // Draw different smoke shapes
                    switch(particle.shape) {
                        case 'heart':
                            overlayCtx.fillStyle = particle.color;
                            overlayCtx.beginPath();
                            overlayCtx.moveTo(0, particle.size/4);
                            overlayCtx.bezierCurveTo(-particle.size/2, -particle.size/4, -particle.size/2, -particle.size/2, 0, -particle.size/8);
                            overlayCtx.bezierCurveTo(particle.size/2, -particle.size/2, particle.size/2, -particle.size/4, 0, particle.size/4);
                            overlayCtx.fill();
                            break;
                            
                        case 'star':
                            overlayCtx.fillStyle = particle.color;
                            overlayCtx.beginPath();
                            for (let i = 0; i < 5; i++) {
                                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                                const radius = i % 2 === 0 ? particle.size : particle.size / 2;
                                const px = Math.cos(angle) * radius;
                                const py = Math.sin(angle) * radius;
                                if (i === 0) overlayCtx.moveTo(px, py);
                                else overlayCtx.lineTo(px, py);
                            }
                            overlayCtx.closePath();
                            overlayCtx.fill();
                            break;
                            
                        case 'circle':
                            overlayCtx.fillStyle = particle.color;
                            overlayCtx.strokeStyle = '#FFFFFF';
                            overlayCtx.lineWidth = 2;
                            overlayCtx.beginPath();
                            overlayCtx.arc(0, 0, particle.size, 0, Math.PI * 2);
                            overlayCtx.fill();
                            overlayCtx.stroke();
                            break;
                            
                        case 'puff':
                        default:
                            // Traditional puffy smoke cloud
                            overlayCtx.fillStyle = particle.color;
                            overlayCtx.beginPath();
                            overlayCtx.arc(0, 0, particle.size, 0, Math.PI * 2);
                            overlayCtx.fill();
                            
                            // Add highlight for more realistic look
                            overlayCtx.globalAlpha = alpha * 0.5;
                            overlayCtx.fillStyle = '#FFFFFF';
                            overlayCtx.beginPath();
                            overlayCtx.arc(-particle.size * 0.3, -particle.size * 0.3, particle.size * 0.6, 0, Math.PI * 2);
                            overlayCtx.fill();
                            break;
                    }
                    
                    overlayCtx.restore();
                }
            } else if (particle.type === 'train_honk') {
                // Train honk text effect
                particle.life--;
                particle.y += particle.vy;
                
                const alpha = particle.life / 45;
                
                if (overlayCtx && alpha > 0.01) {
                    const adjustedCoords = this.getAdjustedCoords(particle.x, particle.y);
                    
                    overlayCtx.save();
                    overlayCtx.globalAlpha = alpha;
                    overlayCtx.font = 'bold 20px Arial';
                    overlayCtx.fillStyle = '#FFD700';
                    overlayCtx.strokeStyle = '#000';
                    overlayCtx.lineWidth = 3;
                    overlayCtx.textAlign = 'center';
                    overlayCtx.strokeText('HONK!', adjustedCoords.x, adjustedCoords.y);
                    overlayCtx.fillText('HONK!', adjustedCoords.x, adjustedCoords.y);
                    overlayCtx.restore();
                }
            }
        }
        
        // Keep all particles that are still alive (life > 0 or permanent life = -1)
        this.particles = this.particles.filter(p => p.life > 0 || p.life === -1);
    }

    showToolFeedback(toolName) {
        const toolNames = {
            brush: '🖌️ Brush',
            spray: '💨 Spray',
            fill: '🪣 Fill',
            eraser: '🧽 Eraser',
            glitter: '✨ Glitter',
            neon: '💡 Neon',
            bubble: '🎈 Balloons',
            fireworks: '🎆 Fireworks',
            streamers: '🎗️ Streamers',
            confetti: '🎊 Confetti',
            sparkles: '🐛 Colorful Worms',
            lightning: '⚡ Lightning',
            bugs: '🐞 Bugs'
        };
        
        console.log('Selected tool:', toolNames[toolName] || toolName);
    }

    showStickerPanel() {
        console.log('showStickerPanel called');
        const panel = document.getElementById('stickerPanel');
        if (panel) {
            console.log('Panel found, showing panel');
            
            // Show the panel with proper styling
            panel.style.display = 'block';
            panel.style.position = 'absolute';
            panel.style.right = '0px';
            panel.style.top = '20px';
            panel.style.width = '380px';
            panel.style.height = 'calc(100% - 40px)';
            panel.style.zIndex = '2000';
            panel.classList.add('show');
            
            console.log('Panel should now be visible');
        } else {
            console.log('Panel NOT found');
        }
    }

    hideStickerPanel() {
        console.log('hideStickerPanel called');
        const panel = document.getElementById('stickerPanel');
        if (panel) {
            console.log('Panel found, hiding panel');
            panel.style.display = 'none';
            panel.classList.remove('show');
            console.log('Panel hidden');
        } else {
            console.log('Panel NOT found in hideStickerPanel');
        }
    }

    addStickerAt(stickerText, x, y) {
        console.log('addStickerAt called:', stickerText, 'at position:', x, y);
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#000000'; // Use black color for visibility
        this.ctx.fillText(stickerText, x, y);
        this.saveState();
        console.log('Sticker placed successfully');
    }

    // Art Tool Methods
    drawWobblyCrayon(x, y) {
        // Add this point to the current wiggly line being drawn
        if (!this.currentWigglyLine) {
            this.currentWigglyLine = {
                points: [],
                color: this.getCurrentColor(),
                brushSize: this.brushSize,
                createdTime: Date.now(),
                isRainbow: this.isRainbowMode // Track if this line should use rainbow colors
            };
        }
        
        // Store the original drawing point with color info for rainbow mode
        const pointData = {
            originalX: x,
            originalY: y,
            currentX: x,
            currentY: y
        };
        
        // For rainbow mode, store the color for each point
        if (this.isRainbowMode) {
            pointData.color = this.getCurrentColor();
        }
        
        this.currentWigglyLine.points.push(pointData);
        
        // DON'T draw the normal stroke - only draw the wiggly version
        // This prevents the double line issue
        
        // Start the wiggle animation if not already running
        if (!this.animationRunning) {
            this.startWiggleAnimation();
        }
    }
    
    startWiggleAnimation() {
        this.animationRunning = true;
        this.animateWigglyLines();
    }
    
    animateWigglyLines() {
        if (this.wigglyLines.length === 0 && !this.currentWigglyLine) {
            this.animationRunning = false;
            return;
        }
        
        // Determine which overlay context to use based on current mode
        const overlayCtx = this.pdfMode ? this.pdfOverlayCtx : this.overlayCtx;
        const overlayCanvas = this.pdfMode ? this.pdfOverlayCanvas : this.overlayCanvas;
        
        if (!overlayCtx) {
            // Retry next frame if overlay context not ready
            requestAnimationFrame(() => this.animateWigglyLines());
            return;
        }
        
        // Clear and redraw only the wiggly parts
        this.clearWigglyArea(overlayCtx, overlayCanvas);
        
        // Update and draw all wiggly lines
        const currentTime = Date.now();
        
        this.wigglyLines.forEach(line => {
            this.drawWigglyLine(line, currentTime, overlayCtx);
        });
        
        // Draw current line being drawn
        if (this.currentWigglyLine && this.currentWigglyLine.points.length > 0) {
            this.drawWigglyLine(this.currentWigglyLine, currentTime, overlayCtx);
        }
        
        // Continue animation
        requestAnimationFrame(() => this.animateWigglyLines());
    }
    
    clearWigglyArea(overlayCtx = this.overlayCtx, overlayCanvas = this.overlayCanvas) {
        if (!overlayCtx) return;
        
        // Clear previous wiggly line positions on overlay canvas
        this.wigglyLines.forEach(line => {
            if (line.lastBounds) {
                const padding = Math.max(20, line.brushSize + 10); // Dynamic padding based on brush size
                overlayCtx.clearRect(
                    line.lastBounds.minX - padding, 
                    line.lastBounds.minY - padding, 
                    line.lastBounds.maxX - line.lastBounds.minX + (padding * 2), 
                    line.lastBounds.maxY - line.lastBounds.minY + (padding * 2)
                );
            }
        });
        
        if (this.currentWigglyLine && this.currentWigglyLine.lastBounds) {
            const padding = Math.max(20, this.currentWigglyLine.brushSize + 10);
            overlayCtx.clearRect(
                this.currentWigglyLine.lastBounds.minX - padding, 
                this.currentWigglyLine.lastBounds.minY - padding, 
                this.currentWigglyLine.lastBounds.maxX - this.currentWigglyLine.lastBounds.minX + (padding * 2), 
                this.currentWigglyLine.lastBounds.maxY - this.currentWigglyLine.lastBounds.minY + (padding * 2)
            );
        }
    }
    
    drawWigglyLine(line, currentTime, overlayCtx = this.overlayCtx) {
        if (line.points.length < 2 || !overlayCtx) return;
        
        // Calculate wiggle based on time
        const timeOffset = (currentTime - line.createdTime) * 0.005;
        
        // Scale wiggle based on brush size - larger brushes need more wiggle room
        const wiggleScale = Math.max(3, line.brushSize * 0.1);
        
        // Track bounds for efficient clearing
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        // Update all point positions first
        line.points.forEach((point, index) => {
            // Create wiggly movement around the original point
            const wiggleX = Math.sin(timeOffset + index * 0.5) * wiggleScale;
            const wiggleY = Math.cos(timeOffset + index * 0.3) * wiggleScale;
            
            point.currentX = point.originalX + wiggleX;
            point.currentY = point.originalY + wiggleY;
            
            // Update bounds with extra padding for larger brushes
            const brushPadding = line.brushSize / 2;
            minX = Math.min(minX, point.currentX - brushPadding);
            minY = Math.min(minY, point.currentY - brushPadding);
            maxX = Math.max(maxX, point.currentX + brushPadding);
            maxY = Math.max(maxY, point.currentY + brushPadding);
        });
        
        // Store bounds for next frame clearing
        line.lastBounds = { minX, minY, maxX, maxY };
        
        // Set up drawing context
        overlayCtx.lineWidth = line.brushSize;
        overlayCtx.lineCap = 'round';
        overlayCtx.lineJoin = 'round';
        
        if (line.isRainbow) {
            // For rainbow mode, draw individual segments with different colors
            for (let i = 1; i < line.points.length; i++) {
                const prevPoint = line.points[i - 1];
                const currentPoint = line.points[i];
                
                // Apply coordinate adjustment for PDF mode
                const prevCoords = this.getAdjustedCoords(prevPoint.currentX, prevPoint.currentY);
                const currentCoords = this.getAdjustedCoords(currentPoint.currentX, currentPoint.currentY);
                
                // Use the color stored with each point
                overlayCtx.strokeStyle = currentPoint.color || line.color;
                overlayCtx.beginPath();
                overlayCtx.moveTo(prevCoords.x, prevCoords.y);
                overlayCtx.lineTo(currentCoords.x, currentCoords.y);
                overlayCtx.stroke();
            }
        } else {
            // For normal mode, draw as one continuous line
            overlayCtx.strokeStyle = line.color;
            overlayCtx.beginPath();
            
            line.points.forEach((point, index) => {
                // Apply coordinate adjustment for PDF mode
                const adjustedCoords = this.getAdjustedCoords(point.currentX, point.currentY);
                
                if (index === 0) {
                    overlayCtx.moveTo(adjustedCoords.x, adjustedCoords.y);
                } else {
                    overlayCtx.lineTo(adjustedCoords.x, adjustedCoords.y);
                }
            });
            
            overlayCtx.stroke();
        }
    }

    startSmudging(x, y) {
        // Store the starting point for smudging
        this.smudgeStartX = x;
        this.smudgeStartY = y;
    }

    drawSmudge(x, y) {
        // Get image data from the area we're smudging
        const radius = this.brushSize;
        const imageData = this.ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        
        // Blend the colors by shifting pixels slightly
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() > 0.7) { // Only smudge some pixels for realistic effect
                const shiftDirection = Math.random() * Math.PI * 2;
                const shiftDistance = Math.random() * 3;
                // This creates a subtle blending effect
                const alpha = data[i + 3];
                if (alpha > 0) {
                    data[i + 3] = Math.max(alpha * 0.9, 50); // Slightly fade
                }
            }
        }
        
        // Apply the smudged data back
        this.ctx.putImageData(imageData, x - radius, y - radius);
        
        // Add a subtle blend stroke
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.globalAlpha = 0.1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    startBlending(x, y) {
        // Store the starting point for blending
        this.blendStartX = x;
        this.blendStartY = y;
    }

    drawBlend(x, y) {
        // Get surrounding pixels to blend
        const radius = this.brushSize;
        const imageData = this.ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        const data = imageData.data;
        
        // Create arrays to store color channels for averaging
        const avgColors = { r: [], g: [], b: [], a: [] };
        
        // Sample colors in the brush area
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) { // Only blend non-transparent pixels
                avgColors.r.push(data[i]);
                avgColors.g.push(data[i + 1]);
                avgColors.b.push(data[i + 2]);
                avgColors.a.push(data[i + 3]);
            }
        }
        
        // Calculate average colors
        if (avgColors.r.length > 0) {
            const avgR = avgColors.r.reduce((a, b) => a + b, 0) / avgColors.r.length;
            const avgG = avgColors.g.reduce((a, b) => a + b, 0) / avgColors.g.length;
            const avgB = avgColors.b.reduce((a, b) => a + b, 0) / avgColors.b.length;
            const avgA = avgColors.a.reduce((a, b) => a + b, 0) / avgColors.a.length;
            
            // Apply blending by replacing colors with averaged colors
            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha > 0) {
                    // Calculate distance from center for smooth blending
                    const pixelX = (i / 4) % (radius * 2);
                    const pixelY = Math.floor((i / 4) / (radius * 2));
                    const centerX = radius;
                    const centerY = radius;
                    const distance = Math.sqrt((pixelX - centerX) ** 2 + (pixelY - centerY) ** 2);
                    const blendFactor = Math.max(0, 1 - (distance / radius)) * 0.4; // Softer blending
                    
                    // Blend current pixel with average color
                    data[i] = data[i] * (1 - blendFactor) + avgR * blendFactor;
                    data[i + 1] = data[i + 1] * (1 - blendFactor) + avgG * blendFactor;
                    data[i + 2] = data[i + 2] * (1 - blendFactor) + avgB * blendFactor;
                }
            }
            
            // Apply the blended data back to canvas
            this.ctx.putImageData(imageData, x - radius, y - radius);
        }
    }

    // Train Track Brush Methods
    drawTrainTrack(x, y) {
        // Check for snapping on first point
        if (this.currentTrack.length === 0) {
            const snapPoint = this.findNearbyTrackEndpoint(x, y, 30);
            if (snapPoint) {
                // Snap to the endpoint
                x = snapPoint.point.x;
                y = snapPoint.point.y;
                // Visual feedback is now handled by updateParticles animation loop
            }
        }
        
        // Smooth the track by filtering out points that are too close or create sharp angles
        if (this.currentTrack.length > 0) {
            const lastPoint = this.currentTrack[this.currentTrack.length - 1];
            const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
            
            // Only add point if it's far enough from the last point
            if (distance < 8) return; // Minimum distance between points for smoothness
            
            // Check for sharp angles if we have at least 2 points
            if (this.currentTrack.length >= 2) {
                const prevPoint = this.currentTrack[this.currentTrack.length - 2];
                const angle1 = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
                const angle2 = Math.atan2(y - lastPoint.y, x - lastPoint.x);
                let angleDiff = Math.abs(angle2 - angle1);
                
                // Normalize angle difference to 0-PI range
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                
                // If angle is too sharp (more than 45 degrees), skip this point for smoother curves
                if (angleDiff > Math.PI / 4 && distance < 15) return;
            }
        }
        
        // Add point to current track for train movement
        this.currentTrack.push({ x, y });
        
        if (this.currentTrack.length === 1) {
            // First point - initialize rail paths
            this.leftRailPath = new Path2D();
            this.rightRailPath = new Path2D();
            this.lastTiePosition = 0;
            
            // Start the rail paths
            this.leftRailPath.moveTo(x, y);
            this.rightRailPath.moveTo(x, y);
        } else {
            // Continue drawing continuous rails
            this.drawContinuousTrack(x, y);
        }
    }
    
    drawContinuousTrack(x, y) {
        const prevPoint = this.currentTrack[this.currentTrack.length - 2];
        const currentPoint = { x, y };
        
        // Calculate direction and perpendicular offset for rails
        const angle = Math.atan2(y - prevPoint.y, x - prevPoint.x);
        const railOffset = this.brushSize * 0.6;
        const perpX = -Math.sin(angle) * railOffset;
        const perpY = Math.cos(angle) * railOffset;
        
        // Draw continuous rails
        this.ctx.strokeStyle = '#C0C0C0';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Left rail
        this.ctx.beginPath();
        this.ctx.moveTo(prevPoint.x + perpX, prevPoint.y + perpY);
        this.ctx.lineTo(x + perpX, y + perpY);
        this.ctx.stroke();
        
        // Right rail
        this.ctx.beginPath();
        this.ctx.moveTo(prevPoint.x - perpX, prevPoint.y - perpY);
        this.ctx.lineTo(x - perpX, y - perpY);
        this.ctx.stroke();
        
        // Draw railroad ties at regular intervals
        const segmentLength = Math.sqrt((x - prevPoint.x) ** 2 + (y - prevPoint.y) ** 2);
        const tieSpacing = this.brushSize * 1.2; // Space between ties
        const numTies = Math.floor(segmentLength / tieSpacing);
        
        for (let i = 0; i <= numTies; i++) {
            const progress = i / Math.max(numTies, 1);
            const tieX = prevPoint.x + (x - prevPoint.x) * progress;
            const tieY = prevPoint.y + (y - prevPoint.y) * progress;
            
            // Check if we should draw a tie at this position
            const distanceFromLast = Math.sqrt(
                (tieX - (this.lastTieX || prevPoint.x)) ** 2 + 
                (tieY - (this.lastTieY || prevPoint.y)) ** 2
            );
            
            if (distanceFromLast >= tieSpacing * 0.8) {
                this.drawRailroadTie(tieX, tieY, angle);
                this.lastTieX = tieX;
                this.lastTieY = tieY;
            }
        }
    }
    
    drawRailroadTie(x, y, angle) {
        const tieLength = this.brushSize * 2;
        const tieWidth = this.brushSize * 0.3;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle + Math.PI / 2); // Perpendicular to track
        
        // Draw railroad tie (brown rectangle)
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-tieLength / 2, -tieWidth / 2, tieLength, tieWidth);
        
        // Add some detail with darker edges
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-tieLength / 2, -tieWidth / 2, tieLength, tieWidth);
        
        this.ctx.restore();
    }

    // Draw snap point indicators on overlay
    drawSnapPointIndicators(x, y) {
        if (this.currentTool !== 'train-track') return;
        
        const snapPoint = this.findNearbyTrackEndpoint(x, y, 30);
        const overlayCtx = this.pdfMode ? this.pdfOverlayCtx : this.overlayCtx;
        const overlayCanvas = this.pdfMode ? this.pdfOverlayCanvas : this.overlayCanvas;
        
        if (!overlayCtx || !overlayCanvas) return;
        
        // Clear previous snap indicators (we'll redraw in the animation loop)
        // Store the snap point for the animation loop to draw
        this.currentSnapPoint = snapPoint;
    }

    // Update snap point indicators based on mouse position
    updateSnapPointIndicators(e) {
        // Only show snap points when train-track tool is selected
        if (this.currentTool !== 'train-track') {
            this.currentSnapPoint = null;
            return;
        }
        
        // Get mouse coordinates based on mode
        let x, y;
        if (this.pdfMode && this.pdfDrawingCanvas) {
            const rect = this.pdfDrawingCanvas.getBoundingClientRect();
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        } else if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            x = (e.clientX - rect.left) * scaleX;
            y = (e.clientY - rect.top) * scaleY;
        } else {
            return;
        }
        
        // Find nearby snap point
        const snapPoint = this.findNearbyTrackEndpoint(x, y, 30);
        this.currentSnapPoint = snapPoint;
    }

    // Helper method to find nearby track endpoints for snapping
    findNearbyTrackEndpoint(x, y, snapDistance = 30) {
        for (let i = 0; i < this.trainTracks.length; i++) {
            const track = this.trainTracks[i];
            if (track.length === 0) continue;
            
            // Check start point of track
            const startPoint = track[0];
            const startDist = Math.sqrt((x - startPoint.x) ** 2 + (y - startPoint.y) ** 2);
            if (startDist < snapDistance) {
                return { trackIndex: i, pointIndex: 0, point: startPoint, isStart: true };
            }
            
            // Check end point of track
            const endPoint = track[track.length - 1];
            const endDist = Math.sqrt((x - endPoint.x) ** 2 + (y - endPoint.y) ** 2);
            if (endDist < snapDistance) {
                return { trackIndex: i, pointIndex: track.length - 1, point: endPoint, isStart: false };
            }
        }
        return null;
    }

    // Merge two tracks when they connect
    mergeTracksIfConnected() {
        if (this.currentTrack.length < 2) return false;
        
        const snapDistance = 30;
        const startPoint = this.currentTrack[0];
        const endPoint = this.currentTrack[this.currentTrack.length - 1];
        
        // Find if start or end connects to existing tracks
        const startSnap = this.findNearbyTrackEndpoint(startPoint.x, startPoint.y, snapDistance);
        const endSnap = this.findNearbyTrackEndpoint(endPoint.x, endPoint.y, snapDistance);
        
        // Snap the endpoints to exact positions
        if (startSnap) {
            this.currentTrack[0] = { ...startSnap.point };
        }
        if (endSnap) {
            this.currentTrack[this.currentTrack.length - 1] = { ...endSnap.point };
        }
        
        // Visual feedback is now handled by the animation loop
        
        if (startSnap && endSnap && startSnap.trackIndex === endSnap.trackIndex) {
            // Current track creates a loop with existing track
            const existingTrack = this.trainTracks[startSnap.trackIndex];
            
            // Merge into one continuous loop
            let mergedTrack;
            if (startSnap.isStart && !endSnap.isStart) {
                // Connect end of current to start, then to end of existing
                mergedTrack = [...this.currentTrack.reverse(), ...existingTrack];
            } else if (!startSnap.isStart && endSnap.isStart) {
                // Connect start of existing, to current, to end of existing
                mergedTrack = [...existingTrack, ...this.currentTrack];
            } else {
                mergedTrack = [...existingTrack, ...this.currentTrack];
            }
            
            // Replace the existing track
            this.trainTracks[startSnap.trackIndex] = mergedTrack;
            
            // Update the train for this track
            const trainIndex = this.trains.findIndex(t => t.trackIndex === startSnap.trackIndex);
            if (trainIndex >= 0) {
                this.trains[trainIndex].track = mergedTrack;
            }
            
            return true; // Merged
        } else if (startSnap) {
            // Connect start of current track to existing track
            const existingTrack = this.trainTracks[startSnap.trackIndex];
            let mergedTrack;
            
            if (startSnap.isStart) {
                // Reverse current and prepend to existing
                mergedTrack = [...this.currentTrack.reverse(), ...existingTrack];
            } else {
                // Append current to end of existing
                mergedTrack = [...existingTrack, ...this.currentTrack];
            }
            
            this.trainTracks[startSnap.trackIndex] = mergedTrack;
            
            // Update train
            const trainIndex = this.trains.findIndex(t => t.trackIndex === startSnap.trackIndex);
            if (trainIndex >= 0) {
                this.trains[trainIndex].track = mergedTrack;
            }
            
            return true; // Merged
        } else if (endSnap) {
            // Connect end of current track to existing track
            const existingTrack = this.trainTracks[endSnap.trackIndex];
            let mergedTrack;
            
            if (endSnap.isStart) {
                // Append existing to end of current
                mergedTrack = [...this.currentTrack, ...existingTrack];
            } else {
                // Reverse existing and append to current
                mergedTrack = [...this.currentTrack, ...existingTrack.reverse()];
            }
            
            this.trainTracks[endSnap.trackIndex] = mergedTrack;
            
            // Update train
            const trainIndex = this.trains.findIndex(t => t.trackIndex === endSnap.trackIndex);
            if (trainIndex >= 0) {
                this.trains[trainIndex].track = mergedTrack;
            }
            
            return true; // Merged
        }
        
        return false; // Not merged
    }

    // Find if a line segment intersects with any existing track
    findTrackIntersection(p1, p2) {
        if (!this.trainTracks || this.trainTracks.length === 0) {
            console.log('No existing tracks to check for intersection');
            return null;
        }
        
        console.log('Checking intersection for segment', p1, 'to', p2, 'against', this.trainTracks.length, 'tracks');
        
        for (let trackIndex = 0; trackIndex < this.trainTracks.length; trackIndex++) {
            const track = this.trainTracks[trackIndex];
            
            for (let i = 0; i < track.length - 1; i++) {
                const t1 = track[i];
                const t2 = track[i + 1];
                
                // Check if line segment (p1, p2) intersects with (t1, t2)
                const intersection = this.lineIntersection(p1, p2, t1, t2);
                
                if (intersection) {
                    console.log('Found raw intersection at', intersection);
                    // Don't count endpoints as intersections
                    const distToP1 = Math.sqrt((intersection.x - p1.x) ** 2 + (intersection.y - p1.y) ** 2);
                    const distToP2 = Math.sqrt((intersection.x - p2.x) ** 2 + (intersection.y - p2.y) ** 2);
                    const distToT1 = Math.sqrt((intersection.x - t1.x) ** 2 + (intersection.y - t1.y) ** 2);
                    const distToT2 = Math.sqrt((intersection.x - t2.x) ** 2 + (intersection.y - t2.y) ** 2);
                    
                    console.log('Distances: P1:', distToP1, 'P2:', distToP2, 'T1:', distToT1, 'T2:', distToT2);
                    
                    if (distToP1 > 5 && distToP2 > 5 && distToT1 > 5 && distToT2 > 5) {
                        console.log('Valid intersection! Creating junction');
                        return {
                            point: intersection,
                            trackIndex: trackIndex,
                            segmentIndex: i
                        };
                    } else {
                        console.log('Intersection too close to endpoints, skipping');
                    }
                }
            }
        }
        
        console.log('No valid intersections found');
        return null;
    }

    // Calculate intersection point of two line segments
    lineIntersection(p1, p2, p3, p4) {
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        if (Math.abs(denom) < 0.001) return null; // Lines are parallel
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        // Check if intersection is within both line segments
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }
        
        return null;
    }

    // Create a junction (switch) at track intersection
    createTrackJunction(intersection) {
        if (!this.trackJunctions) {
            this.trackJunctions = [];
        }
        
        // Check if junction already exists at this location
        const existingJunction = this.trackJunctions.find(j => {
            const dist = Math.sqrt((j.x - intersection.point.x) ** 2 + (j.y - intersection.point.y) ** 2);
            return dist < 10;
        });
        
        if (!existingJunction) {
            this.trackJunctions.push({
                x: intersection.point.x,
                y: intersection.point.y,
                tracks: [intersection.trackIndex, this.trainTracks.length], // Will be current track when finished
                activeTrack: 0 // Which track is currently active for trains passing through
            });
            
            // Draw the junction marker
            this.drawJunctionMarker(intersection.point.x, intersection.point.y);
        }
    }

    // Draw a visual marker for the junction
    drawJunctionMarker(x, y) {
        const ctx = this.pdfMode ? this.pdfDrawingCtx : this.ctx;
        if (!ctx) return;
        
        const adjustedCoords = this.getAdjustedCoords(x, y);
        
        ctx.save();
        ctx.fillStyle = '#FF6600';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Draw a small circle to indicate the junction
        ctx.beginPath();
        ctx.arc(adjustedCoords.x, adjustedCoords.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    // Draw all track junctions on the overlay canvas
    drawTrackJunctions(overlayCtx, overlayCanvas) {
        if (!this.trackJunctions || this.trackJunctions.length === 0 || !overlayCtx) return;
        
        this.trackJunctions.forEach(junction => {
            const adjustedCoords = this.getAdjustedCoords(junction.x, junction.y);
            
            overlayCtx.save();
            
            // Pulsing animation for junctions
            const pulseSize = 8 + Math.sin(Date.now() * 0.003) * 2;
            
            // Outer glow
            overlayCtx.fillStyle = 'rgba(255, 102, 0, 0.3)';
            overlayCtx.beginPath();
            overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, pulseSize + 4, 0, Math.PI * 2);
            overlayCtx.fill();
            
            // Main junction marker
            overlayCtx.fillStyle = '#FF6600';
            overlayCtx.strokeStyle = '#FFFFFF';
            overlayCtx.lineWidth = 2;
            overlayCtx.beginPath();
            overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, pulseSize, 0, Math.PI * 2);
            overlayCtx.fill();
            overlayCtx.stroke();
            
            // Inner highlight
            overlayCtx.fillStyle = '#FFA500';
            overlayCtx.beginPath();
            overlayCtx.arc(adjustedCoords.x, adjustedCoords.y, pulseSize / 2, 0, Math.PI * 2);
            overlayCtx.fill();
            
            overlayCtx.restore();
        });
    }

    // Helper function to darken a color
    darkenColor(color, amount) {
        // Convert hex to RGB
        let r, g, b;
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            return color; // Return original if not hex
        }
        
        // Darken by reducing RGB values
        r = Math.floor(r * (1 - amount));
        g = Math.floor(g * (1 - amount));
        b = Math.floor(b * (1 - amount));
        
        // Convert back to hex
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    createTrainForTrack(track, trackIndex) {
        if (track.length < 2) return;
        
        // Array of fun train colors
        const trainColors = [
            { body: '#1E90FF', name: 'Blue' },      // Classic blue
            { body: '#FF4500', name: 'Red' },       // Fire red
            { body: '#32CD32', name: 'Green' },     // Lime green
            { body: '#FFD700', name: 'Gold' },      // Golden
            { body: '#FF69B4', name: 'Pink' },      // Hot pink
            { body: '#9370DB', name: 'Purple' },    // Medium purple
            { body: '#FF8C00', name: 'Orange' },    // Dark orange
            { body: '#00CED1', name: 'Turquoise' }, // Dark turquoise
            { body: '#DC143C', name: 'Crimson' },   // Crimson
            { body: '#20B2AA', name: 'Teal' }       // Light sea green
        ];
        
        // Randomly select a train color
        const randomColor = trainColors[Math.floor(Math.random() * trainColors.length)];
        
        // Random speed variation (80% to 120% of base speed)
        const baseSpeed = 0.002;
        const speedVariation = 0.8 + Math.random() * 0.4;
        
        const train = {
            track: [...track], // Copy of the track points
            position: 0, // Current position along track (0 to 1)
            speed: baseSpeed * speedVariation, // Randomized speed
            originalSpeed: baseSpeed * speedVariation, // Store original speed for interactions
            size: Math.max(16, this.brushSize * 2.0), // Made train even bigger
            id: Date.now() + Math.random(),
            trackIndex: trackIndex, // Store which track this train belongs to
            color: randomColor.body, // Assign random color
            colorName: randomColor.name, // Store color name (optional, for debugging)
            cars: [] // Array to store train cars (will be populated by flags)
        };
        
        this.trains.push(train);
    }
    
    // Generate random train car
    getRandomTrainCar(trainColor) {
        const app = this; // Store reference to app instance for use in draw functions
        console.log('🚂 getRandomTrainCar called - VERSION 2.0 WITH CARGO FIXES!');
        const carTypes = [
            {
                type: 'passenger',
                draw: (ctx, x, y, size, color, cargo) => {
                    // Passenger car with windows
                    ctx.fillStyle = color;
                    ctx.fillRect(-size * 0.7, -size * 0.3, size * 1.4, size * 0.6);
                    ctx.strokeStyle = app.darkenColor(color, 0.3);
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-size * 0.7, -size * 0.3, size * 1.4, size * 0.6);
                    
                    // Windows with passengers
                    ctx.fillStyle = '#87CEEB';
                    for (let i = 0; i < 3; i++) {
                        const windowX = -size * 0.5 + i * size * 0.4;
                        ctx.fillRect(windowX, -size * 0.25, size * 0.25, size * 0.2);
                        
                        // Draw passenger faces in windows
                        if (cargo && cargo[i]) {
                            console.log('Drawing passenger:', cargo[i], 'at window', i);
                            app.drawPassenger(ctx, windowX + size * 0.125, -size * 0.15, size * 0.1, cargo[i]);
                        }
                    }
                }
            },
            {
                type: 'cargo',
                draw: (ctx, x, y, size, color, cargo) => {
                    // Cargo/box car
                    ctx.fillStyle = app.darkenColor(color, 0.2);
                    ctx.fillRect(-size * 0.7, -size * 0.35, size * 1.4, size * 0.7);
                    ctx.strokeStyle = app.darkenColor(color, 0.5);
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-size * 0.7, -size * 0.35, size * 1.4, size * 0.7);
                    
                    console.log('Drawing cargo car, cargo length:', cargo ? cargo.length : 0);
                    
                    // Draw cargo items
                    if (cargo && cargo.length > 0) {
                        cargo.forEach((item, i) => {
                            const offsetX = -size * 0.4 + (i % 3) * size * 0.3;
                            const offsetY = -size * 0.15 + Math.floor(i / 3) * size * 0.25;
                            const bounce = Math.sin(Date.now() * 0.005 + i) * 2; // Slight bounce
                            console.log('Drawing cargo item:', item, 'at position', i);
                            app.drawCargoItem(ctx, offsetX, offsetY + bounce, size * 0.15, item);
                        });
                    } else {
                        // Cargo stripes when empty
                        ctx.strokeStyle = app.darkenColor(color, 0.4);
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(0, -size * 0.35);
                        ctx.lineTo(0, size * 0.35);
                        ctx.stroke();
                    }
                }
            },
            {
                type: 'tanker',
                draw: (ctx, x, y, size, color) => {
                    // Tanker car (cylindrical)
                    ctx.fillStyle = '#C0C0C0'; // Silver color
                    ctx.beginPath();
                    ctx.ellipse(0, 0, size * 0.7, size * 0.35, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#808080';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Bands around tanker
                    ctx.strokeStyle = '#606060';
                    ctx.lineWidth = 1;
                    for (let i = -1; i <= 1; i++) {
                        ctx.beginPath();
                        ctx.moveTo(i * size * 0.3, -size * 0.35);
                        ctx.lineTo(i * size * 0.3, size * 0.35);
                        ctx.stroke();
                    }
                }
            },
            {
                type: 'caboose',
                draw: (ctx, x, y, size, color) => {
                    // Caboose (red with cupola)
                    ctx.fillStyle = '#DC143C'; // Crimson red
                    ctx.fillRect(-size * 0.6, -size * 0.3, size * 1.2, size * 0.6);
                    ctx.strokeStyle = '#8B0000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-size * 0.6, -size * 0.3, size * 1.2, size * 0.6);
                    
                    // Cupola (observation area on top)
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(-size * 0.25, -size * 0.6, size * 0.5, size * 0.3);
                    
                    // Window in cupola
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(-size * 0.15, -size * 0.55, size * 0.3, size * 0.15);
                }
            }
        ];
        
        const randomCar = carTypes[Math.floor(Math.random() * carTypes.length)];
        const car = {
            type: randomCar.type,
            draw: randomCar.draw,
            color: trainColor,
            cargo: [] // Will hold passenger/cargo items
        };
        
        // Initialize cargo/passengers randomly
        if (car.type === 'passenger') {
            // 80% chance to have passengers in each window (increased from 50%)
            car.cargo = [
                Math.random() > 0.2 ? app.getRandomPassenger() : null,
                Math.random() > 0.2 ? app.getRandomPassenger() : null,
                Math.random() > 0.2 ? app.getRandomPassenger() : null
            ];
            console.log('Created passenger car with:', car.cargo);
        } else if (car.type === 'cargo') {
            // 60% chance to start with cargo (increased from 30%)
            if (Math.random() > 0.4) {
                const numItems = Math.floor(Math.random() * 4) + 2; // 2-5 items
                for (let i = 0; i < numItems; i++) {
                    car.cargo.push(app.getRandomCargo());
                }
                console.log('Created cargo car with', car.cargo.length, 'items:', car.cargo);
            } else {
                console.log('Created empty cargo car');
            }
        }
        
        return car;
    }
    
    // Get random passenger type
    getRandomPassenger() {
        const passengers = ['person', 'cat', 'dog', 'bear', 'rabbit'];
        return passengers[Math.floor(Math.random() * passengers.length)];
    }
    
    // Get random cargo type
    getRandomCargo() {
        const cargoTypes = ['present', 'apple', 'banana', 'pumpkin', 'star', 'heart'];
        return cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
    }
    
    // Draw passenger in window
    drawPassenger(ctx, x, y, size, type) {
        ctx.save();
        ctx.translate(x, y);
        
        switch(type) {
            case 'person':
                // Simple smiling face
                ctx.fillStyle = '#FFE4C4';
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-size * 0.3, -size * 0.2, size * 0.2, 0, Math.PI * 2);
                ctx.arc(size * 0.3, -size * 0.2, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                // Smile
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.5, 0, Math.PI);
                ctx.stroke();
                break;
                
            case 'cat':
                // Cat face
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                // Ears
                ctx.beginPath();
                ctx.moveTo(-size * 0.7, -size * 0.5);
                ctx.lineTo(-size * 0.4, -size);
                ctx.lineTo(-size * 0.2, -size * 0.5);
                ctx.moveTo(size * 0.2, -size * 0.5);
                ctx.lineTo(size * 0.4, -size);
                ctx.lineTo(size * 0.7, -size * 0.5);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-size * 0.3, 0, size * 0.15, 0, Math.PI * 2);
                ctx.arc(size * 0.3, 0, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'dog':
                // Dog face
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                // Floppy ears
                ctx.beginPath();
                ctx.ellipse(-size * 0.8, 0, size * 0.4, size * 0.6, Math.PI * 0.3, 0, Math.PI * 2);
                ctx.ellipse(size * 0.8, 0, size * 0.4, size * 0.6, -Math.PI * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-size * 0.3, 0, size * 0.2, 0, Math.PI * 2);
                ctx.arc(size * 0.3, 0, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'bear':
                // Bear face
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                // Round ears
                ctx.beginPath();
                ctx.arc(-size * 0.6, -size * 0.6, size * 0.4, 0, Math.PI * 2);
                ctx.arc(size * 0.6, -size * 0.6, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-size * 0.3, 0, size * 0.2, 0, Math.PI * 2);
                ctx.arc(size * 0.3, 0, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'rabbit':
                // Rabbit face
                ctx.fillStyle = '#DDA0DD';
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
                // Long ears
                ctx.beginPath();
                ctx.ellipse(-size * 0.4, -size * 0.8, size * 0.25, size * 0.7, -Math.PI * 0.2, 0, Math.PI * 2);
                ctx.ellipse(size * 0.4, -size * 0.8, size * 0.25, size * 0.7, Math.PI * 0.2, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-size * 0.3, 0, size * 0.15, 0, Math.PI * 2);
                ctx.arc(size * 0.3, 0, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    // Draw cargo item
    drawCargoItem(ctx, x, y, size, type) {
        ctx.save();
        ctx.translate(x, y);
        
        switch(type) {
            case 'present':
                // Gift box
                ctx.fillStyle = '#FF69B4';
                ctx.fillRect(-size/2, -size/2, size, size);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                // Ribbon
                ctx.beginPath();
                ctx.moveTo(0, -size/2);
                ctx.lineTo(0, size/2);
                ctx.moveTo(-size/2, 0);
                ctx.lineTo(size/2, 0);
                ctx.stroke();
                // Bow
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, -size/2, size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'apple':
                // Red apple
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                ctx.fill();
                // Leaf
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.ellipse(size * 0.2, -size * 0.4, size * 0.2, size * 0.3, Math.PI * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'banana':
                // Yellow banana
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, size/2, Math.PI, Math.PI * 2);
                ctx.arc(0, -size/4, size/2, 0, Math.PI);
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'pumpkin':
                // Orange pumpkin
                ctx.fillStyle = '#FF8C00';
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                ctx.fill();
                // Lines
                ctx.strokeStyle = '#FF6347';
                ctx.lineWidth = 1;
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * size * 0.2, -size/2);
                    ctx.lineTo(i * size * 0.2, size/2);
                    ctx.stroke();
                }
                // Stem
                ctx.fillStyle = '#228B22';
                ctx.fillRect(-size * 0.1, -size * 0.6, size * 0.2, size * 0.2);
                break;
                
            case 'star':
                // Yellow star
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const radius = i % 2 === 0 ? size/2 : size/4;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'heart':
                // Red heart
                ctx.fillStyle = '#FF1493';
                ctx.beginPath();
                ctx.moveTo(0, size/4);
                ctx.bezierCurveTo(-size/2, -size/4, -size/2, -size/2, 0, -size/8);
                ctx.bezierCurveTo(size/2, -size/2, size/2, -size/4, 0, size/4);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    animateTrains(overlayCtx = this.overlayCtx, overlayCanvas = this.overlayCanvas) {
        if (!this.trains || this.trains.length === 0) return;
        
        this.trains.forEach((train, trainIndex) => {
            // Calculate track length to normalize speed
            const trackLength = this.calculateTrackLength(train.track);
            
            // Convert pixel-based speed to position-based speed
            // This ensures consistent visual speed regardless of track segment length
            const pixelSpeed = 1.0 * train.speed / 0.002; // Normalize to pixel distance (base speed 0.002 = 1 pixel/frame)
            const positionIncrement = pixelSpeed / trackLength;
            
            // Move train along track at consistent visual speed
            train.position += positionIncrement;
            
            // Loop back to start when reaching end
            if (train.position > 1) {
                train.position = 0;
            }
            
            // Calculate current position on track
            const trackIndex = Math.floor(train.position * (train.track.length - 1));
            const nextIndex = Math.min(trackIndex + 1, train.track.length - 1);
            const localProgress = (train.position * (train.track.length - 1)) - trackIndex;
            
            if (trackIndex < train.track.length - 1) {
                const currentPoint = train.track[trackIndex];
                const nextPoint = train.track[nextIndex];
                
                // Interpolate position
                const x = currentPoint.x + (nextPoint.x - currentPoint.x) * localProgress;
                const y = currentPoint.y + (nextPoint.y - currentPoint.y) * localProgress;
                
                // Calculate train direction angle
                const angle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x);
                
                // Check for decoration interactions
                this.checkTrainDecorationInteraction(train, x, y);
                
                // Check for interactions with other trains
                this.checkTrainTrainInteraction(train, trainIndex, x, y, overlayCtx);
                
                // Draw train engine and cars on overlay canvas
                this.drawTrainOnOverlay(x, y, train, angle, overlayCtx, overlayCanvas);
                
                // Draw cars behind the engine
                if (train.cars && train.cars.length > 0) {
                    this.drawTrainCars(train, x, y, angle, overlayCtx, overlayCanvas);
                }
            }
        });
        
        // Draw flags at track endpoints for adding/removing cars
        this.drawTrackFlags(overlayCtx, overlayCanvas);
    }

    // Check for train-to-train interactions
    checkTrainTrainInteraction(currentTrain, currentIndex, x, y, overlayCtx) {
        this.trains.forEach((otherTrain, otherIndex) => {
            if (currentIndex === otherIndex) return; // Skip self
            
            // Check if trains are on the same track
            if (currentTrain.trackIndex !== otherTrain.trackIndex) return;
            
            // Calculate other train's position
            const otherTrackIndex = Math.floor(otherTrain.position * (otherTrain.track.length - 1));
            const otherNextIndex = Math.min(otherTrackIndex + 1, otherTrain.track.length - 1);
            const otherLocalProgress = (otherTrain.position * (otherTrain.track.length - 1)) - otherTrackIndex;
            
            if (otherTrackIndex < otherTrain.track.length - 1) {
                const otherCurrentPoint = otherTrain.track[otherTrackIndex];
                const otherNextPoint = otherTrain.track[otherNextIndex];
                const otherX = otherCurrentPoint.x + (otherNextPoint.x - otherCurrentPoint.x) * otherLocalProgress;
                const otherY = otherCurrentPoint.y + (otherNextPoint.y - otherCurrentPoint.y) * otherLocalProgress;
                
                const dist = Math.sqrt((x - otherX) ** 2 + (y - otherY) ** 2);
                
                // Trains are close
                if (dist < 60) {
                    // Honk effect (show "HONK!" text)
                    if (!currentTrain.lastHonk || Date.now() - currentTrain.lastHonk > 2000) {
                        currentTrain.lastHonk = Date.now();
                        this.showTrainHonk(x, y, overlayCtx);
                    }
                    
                    // Slow down to avoid collision
                    if (dist < 40) {
                        const targetSpeed = otherTrain.speed * 0.8;
                        if (currentTrain.speed > targetSpeed) {
                            currentTrain.speed *= 0.98;
                        }
                    }
                } else {
                    // Speed back up when clear
                    if (currentTrain.originalSpeed && currentTrain.speed < currentTrain.originalSpeed) {
                        currentTrain.speed = Math.min(currentTrain.speed * 1.01, currentTrain.originalSpeed);
                    }
                }
            }
        });
    }

    // Show honk effect
    showTrainHonk(x, y, overlayCtx) {
        if (!overlayCtx) return;
        
        const adjustedCoords = this.getAdjustedCoords(x, y);
        
        // Add a honk particle
        this.particles.push({
            x: x,
            y: y - 40,
            vx: 0,
            vy: -1,
            life: 45,
            type: 'train_honk',
            alpha: 1
        });
    }
    
    drawTrainCars(train, engineX, engineY, engineAngle, overlayCtx, overlayCanvas) {
        const size = train.size;
        const carLength = size * 2.2; // Tight spacing like real coupled train cars
        
        train.cars.forEach((car, index) => {
            // Calculate how far behind the engine this car should be
            // Convert distance to track position offset
            const totalCarLength = carLength * (index + 1);
            const trackLength = this.calculateTrackLength(train.track);
            const positionOffset = totalCarLength / trackLength;
            
            // Calculate car's position on track (behind the engine)
            let carPosition = train.position - positionOffset;
            
            // Handle wrap-around for circular tracks
            if (carPosition < 0) {
                carPosition += 1;
            }
            
            // Get the car's position and angle from the track
            const carData = this.getPositionOnTrack(train.track, carPosition);
            
            if (carData) {
                const adjustedCoords = this.getAdjustedCoords(carData.x, carData.y);
                
                // Debug: Log cargo for first car
                if (index === 0 && car.cargo) {
                    console.log('Car type:', car.type, 'Cargo:', car.cargo);
                }
                
                overlayCtx.save();
                overlayCtx.translate(adjustedCoords.x, adjustedCoords.y);
                overlayCtx.rotate(carData.angle);
                
                // Draw the car using its draw function, passing cargo
                car.draw(overlayCtx, carData.x, carData.y, size, car.color, car.cargo);
                
                // Draw wheels
                this.drawCarWheels(overlayCtx, size);
                
                overlayCtx.restore();
            }
        });
    }
    
    // Calculate total length of a track
    calculateTrackLength(track) {
        let length = 0;
        for (let i = 1; i < track.length; i++) {
            const dx = track[i].x - track[i - 1].x;
            const dy = track[i].y - track[i - 1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length || 1; // Prevent division by zero
    }
    
    // Get position and angle at a specific point on the track (0 to 1)
    getPositionOnTrack(track, position) {
        if (track.length < 2) return null;
        
        // Clamp position to valid range
        position = Math.max(0, Math.min(1, position));
        
        // Calculate which segment we're on
        const trackIndex = Math.floor(position * (track.length - 1));
        const nextIndex = Math.min(trackIndex + 1, track.length - 1);
        const localProgress = (position * (track.length - 1)) - trackIndex;
        
        if (trackIndex < track.length - 1) {
            const currentPoint = track[trackIndex];
            const nextPoint = track[nextIndex];
            
            // Interpolate position
            const x = currentPoint.x + (nextPoint.x - currentPoint.x) * localProgress;
            const y = currentPoint.y + (nextPoint.y - currentPoint.y) * localProgress;
            
            // Calculate angle based on track direction
            const angle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x);
            
            return { x, y, angle };
        }
        
        return null;
    }
    
    drawCarWheels(ctx, size) {
        // Draw wheels (black circles)
        ctx.fillStyle = '#000000';
        // Left wheel
        ctx.beginPath();
        ctx.arc(-size * 0.4, size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Right wheel
        ctx.beginPath();
        ctx.arc(size * 0.4, size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw flags at track endpoints for adding/removing cars
    drawTrackFlags(overlayCtx, overlayCanvas) {
        if (!overlayCtx || !this.trainTracks) return;
        
        this.trainTracks.forEach((track, trackIndex) => {
            if (track.length < 2) return;
            
            const train = this.trains.find(t => t.trackIndex === trackIndex);
            if (!train) return;
            
            // Get the endpoint of the track
            const endpoint = track[track.length - 1];
            const adjustedCoords = this.getAdjustedCoords(endpoint.x, endpoint.y);
            
            // Draw green flag (add car)
            overlayCtx.save();
            overlayCtx.translate(adjustedCoords.x + 25, adjustedCoords.y - 25);
            this.drawFlag(overlayCtx, '#00FF00', 12); // Smaller size
            overlayCtx.restore();
            
            // Draw red flag (remove car) - only if there are cars to remove
            if (train.cars && train.cars.length > 0) {
                overlayCtx.save();
                overlayCtx.translate(adjustedCoords.x + 50, adjustedCoords.y - 25);
                this.drawFlag(overlayCtx, '#FF0000', 12); // Smaller size
                overlayCtx.restore();
            }
        });
    }
    
    drawFlag(ctx, color, size) {
        // Flag pole
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size * 1.5);
        ctx.stroke();
        
        // Flag
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -size * 1.5);
        ctx.lineTo(size * 1.2, -size * 1.1);
        ctx.lineTo(0, -size * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Flag outline
        ctx.strokeStyle = this.darkenColor(color, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Check if click is on a flag and add/remove car
    handleFlagClick(x, y) {
        if (!this.trainTracks) return false;
        
        console.log('Checking flag click at:', x, y); // Debug
        
        for (let trackIndex = 0; trackIndex < this.trainTracks.length; trackIndex++) {
            const track = this.trainTracks[trackIndex];
            if (track.length < 2) continue;
            
            const train = this.trains.find(t => t.trackIndex === trackIndex);
            if (!train) continue;
            
            const endpoint = track[track.length - 1];
            
            console.log('Track endpoint:', endpoint.x, endpoint.y); // Debug
            
            // Check green flag (add car) - flag is drawn upward and to the right
            // Flag is positioned at endpoint + (25, -25), flag extends right, center is about +7 right and -15 up
            const greenFlagX = endpoint.x + 25 + 7; // Adjusted to center of flag horizontally
            const greenFlagY = endpoint.y - 25 - 15; // Adjusted to center of flag vertically
            const distToGreen = Math.sqrt((x - greenFlagX) ** 2 + (y - greenFlagY) ** 2);
            
            console.log('Distance to green flag:', distToGreen); // Debug
            
            if (distToGreen < 20) { // Click radius
                // Add a random car
                const newCar = this.getRandomTrainCar(train.color);
                if (!train.cars) train.cars = [];
                train.cars.push(newCar);
                console.log('Added car! Total cars:', train.cars.length); // Debug
                return true;
            }
            
            // Check red flag (remove car) - flag is drawn upward and to the right
            if (train.cars && train.cars.length > 0) {
                const redFlagX = endpoint.x + 50 + 7; // Adjusted to center of flag horizontally
                const redFlagY = endpoint.y - 25 - 15; // Adjusted to center of flag vertically
                const distToRed = Math.sqrt((x - redFlagX) ** 2 + (y - redFlagY) ** 2);
                
                console.log('Distance to red flag:', distToRed); // Debug
                
                if (distToRed < 20) { // Click radius
                    // Remove the last car
                    train.cars.pop();
                    console.log('Removed car! Total cars:', train.cars.length); // Debug
                    return true;
                }
            }
        }
        
        return false;
    }
    
    drawTrainOnOverlay(x, y, train, angle = 0, overlayCtx = this.overlayCtx, overlayCanvas = this.overlayCanvas) {
        if (!overlayCtx) return;
        
        const size = train.size;
        const trainColor = train.color || '#1E90FF'; // Use train's color or default to blue
        
        // Apply coordinate adjustment for PDF mode
        const adjustedCoords = this.getAdjustedCoords(x, y);
        
        // Clear larger area around train since it's now bigger
        overlayCtx.clearRect(adjustedCoords.x - size * 2.5, adjustedCoords.y - size * 2.5, size * 5, size * 5);
        
        overlayCtx.save();
        overlayCtx.translate(adjustedCoords.x, adjustedCoords.y);
        overlayCtx.rotate(angle);
        
        // Apply transparency if in tunnel
        if (train.inTunnel) {
            overlayCtx.globalAlpha = 0.3;
        }
        
        // Draw train body with the train's color
        overlayCtx.fillStyle = trainColor;
        overlayCtx.fillRect(-size * 0.8, -size * 0.3, size * 1.6, size * 0.6);
        
        // Add body outline for definition (darker version of the train color)
        overlayCtx.strokeStyle = this.darkenColor(trainColor, 0.3);
        overlayCtx.lineWidth = 2;
        overlayCtx.strokeRect(-size * 0.8, -size * 0.3, size * 1.6, size * 0.6);
        
        // Draw train cab (darker version of train color) - at the front, made bigger
        overlayCtx.fillStyle = this.darkenColor(trainColor, 0.4);
        overlayCtx.fillRect(size * 0.5, -size * 0.45, size * 0.3, size * 0.3);
        
        // Draw chimney (black) - on the cab, made taller
        overlayCtx.fillStyle = '#000000';
        overlayCtx.fillRect(size * 0.55, -size * 0.75, size * 0.2, size * 0.35);
        
        // Draw wheels (black circles) - made bigger with inner details
        overlayCtx.fillStyle = '#000000';
        // Left wheel
        overlayCtx.beginPath();
        overlayCtx.arc(-size * 0.4, size * 0.2, size * 0.2, 0, Math.PI * 2);
        overlayCtx.fill();
        // Left wheel inner circle
        overlayCtx.fillStyle = '#333333';
        overlayCtx.beginPath();
        overlayCtx.arc(-size * 0.4, size * 0.2, size * 0.12, 0, Math.PI * 2);
        overlayCtx.fill();
        
        // Right wheel
        overlayCtx.fillStyle = '#000000';
        overlayCtx.beginPath();
        overlayCtx.arc(size * 0.4, size * 0.2, size * 0.2, 0, Math.PI * 2);
        overlayCtx.fill();
        // Right wheel inner circle
        overlayCtx.fillStyle = '#333333';
        overlayCtx.beginPath();
        overlayCtx.arc(size * 0.4, size * 0.2, size * 0.12, 0, Math.PI * 2);
        overlayCtx.fill();
        
        // Draw front of train (yellow) - made more prominent
        overlayCtx.fillStyle = '#FFD700';
        overlayCtx.fillRect(size * 0.75, -size * 0.2, size * 0.1, size * 0.4);
        
        // Add windows to the cab
        overlayCtx.fillStyle = '#87CEEB';
        overlayCtx.fillRect(size * 0.52, -size * 0.4, size * 0.26, size * 0.15);
        
        overlayCtx.restore();
        
        // Create animated smoke effect - much better looking
        this.createTrainSmoke(x, y, size, angle);
    }
    
    createTrainSmoke(x, y, size, angle) {
        // Create smoke particles more frequently for better effect
        if (Math.random() < 0.3) { // 30% chance each frame
            // Calculate chimney position to match exact drawing location
            // Chimney rectangle: fillRect(size * 0.55, -size * 0.75, size * 0.2, size * 0.35)
            // So center of chimney opening (top) is at: (size * 0.65, -size * 0.75)
            const chimneyLocalX = size * 0.65; // Center of chimney horizontally
            const chimneyLocalY = -size * 0.75; // Top of chimney (where smoke comes out)
            
            // Rotate the chimney position based on train angle
            const chimneyOffsetX = Math.cos(angle) * chimneyLocalX - Math.sin(angle) * chimneyLocalY;
            const chimneyOffsetY = Math.sin(angle) * chimneyLocalX + Math.cos(angle) * chimneyLocalY;
            
            // Randomly choose smoke shape and color
            const shapes = ['puff', 'heart', 'star', 'circle'];
            const colors = [
                '#FFFFFF', // White
                '#FFB6C1', // Light pink
                '#FFD700', // Gold
                '#87CEEB', // Sky blue
                '#98FB98', // Pale green
                '#DDA0DD'  // Plum
            ];
            
            const smokeShape = shapes[Math.floor(Math.random() * shapes.length)];
            const smokeColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Add smoke particle to particles array
            this.particles.push({
                x: x + chimneyOffsetX,
                y: y + chimneyOffsetY,
                vx: (Math.random() - 0.5) * 1.5 + Math.cos(angle + Math.PI) * 1, // Slight drift backward
                vy: -Math.random() * 2 - 1.5, // Always rise upward
                life: 45 + Math.random() * 25, // 45-70 frames
                type: 'train_smoke',
                size: size * 0.15 + Math.random() * size * 0.1,
                alpha: 0.7 + Math.random() * 0.3,
                growth: 1.015, // Smoke grows slowly as it rises
                shape: smokeShape,
                color: smokeColor,
                rotation: Math.random() * Math.PI * 2, // Random initial rotation
                rotationSpeed: (Math.random() - 0.5) * 0.1 // Slow rotation
            });
        }
    }

    // Add track decoration near a track
    addTrackDecoration(x, y, type) {
        // Find nearest track
        let nearestTrack = null;
        let minDist = Infinity;
        
        this.trainTracks.forEach((track, trackIndex) => {
            track.forEach((point, pointIndex) => {
                const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    nearestTrack = { trackIndex, pointIndex, point };
                }
            });
        });
        
        // Only add decoration if close enough to a track
        if (nearestTrack && minDist < 100) {
            const decoration = {
                type: type,
                x: x,
                y: y,
                trackIndex: nearestTrack.trackIndex,
                pointIndex: nearestTrack.pointIndex,
                size: 30
            };
            
            this.trackDecorations.push(decoration);
            this.drawDecoration(decoration);
        }
    }

    // Draw a decoration
    drawDecoration(decoration) {
        const ctx = this.pdfMode ? this.pdfDrawingCtx : this.ctx;
        if (!ctx) return;
        
        const adjustedCoords = this.getAdjustedCoords(decoration.x, decoration.y);
        
        ctx.save();
        ctx.translate(adjustedCoords.x, adjustedCoords.y);
        
        switch(decoration.type) {
            case 'station':
                // Draw a simple station building
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(-30, -40, 60, 40);
                // Roof
                ctx.fillStyle = '#DC143C';
                ctx.beginPath();
                ctx.moveTo(-35, -40);
                ctx.lineTo(0, -60);
                ctx.lineTo(35, -40);
                ctx.closePath();
                ctx.fill();
                // Door
                ctx.fillStyle = '#654321';
                ctx.fillRect(-10, -30, 20, 30);
                // Windows
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(-25, -35, 10, 10);
                ctx.fillRect(15, -35, 10, 10);
                // Sign
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(-20, -15, 40, 8);
                ctx.fillStyle = '#000';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('STATION', 0, -9);
                break;
                
            case 'tunnel':
                // Draw tunnel entrance
                ctx.fillStyle = '#2F4F4F';
                ctx.fillRect(-40, -35, 80, 35);
                // Arch
                ctx.beginPath();
                ctx.arc(0, 0, 40, Math.PI, Math.PI * 2);
                ctx.fill();
                // Inner darkness
                ctx.fillStyle = '#000';
                ctx.fillRect(-35, -30, 70, 30);
                ctx.beginPath();
                ctx.arc(0, 0, 35, Math.PI, Math.PI * 2);
                ctx.fill();
                // Bricks
                ctx.strokeStyle = '#696969';
                ctx.lineWidth = 1;
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 15, -30);
                    ctx.lineTo(i * 15, 0);
                    ctx.stroke();
                }
                break;
                
            case 'tree':
                // Draw a simple tree
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(-5, -20, 10, 25);
                // Leaves
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(0, -25, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-8, -20, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(8, -20, 12, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'building':
                // Draw a building
                ctx.fillStyle = '#A9A9A9';
                ctx.fillRect(-25, -50, 50, 50);
                // Windows (grid)
                ctx.fillStyle = '#FFD700';
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 3; col++) {
                        ctx.fillRect(-18 + col * 12, -42 + row * 12, 8, 8);
                    }
                }
                // Door
                ctx.fillStyle = '#654321';
                ctx.fillRect(-8, -20, 16, 20);
                break;
        }
        
        ctx.restore();
    }

    // Draw all decorations on overlay
    drawAllDecorations(overlayCtx, overlayCanvas) {
        if (!this.trackDecorations || this.trackDecorations.length === 0 || !overlayCtx) return;
        
        // Decorations are drawn on main canvas, not overlay
        // But we can add effects on overlay
    }

    // Check if train is near a decoration and react
    checkTrainDecorationInteraction(train, x, y) {
        this.trackDecorations.forEach(decoration => {
            const dist = Math.sqrt((x - decoration.x) ** 2 + (y - decoration.y) ** 2);
            
            if (dist < 50) {
                switch(decoration.type) {
                    case 'station':
                        // Slow down near station
                        if (!train.atStation) {
                            train.atStation = true;
                            train.stationTimer = 60; // Stop for 60 frames
                            train.originalSpeed = train.speed;
                            train.speed = 0;
                        }
                        break;
                        
                    case 'tunnel':
                        // Make train semi-transparent in tunnel
                        train.inTunnel = dist < 30;
                        break;
                }
            }
        });
        
        // Resume from station
        if (train.atStation && train.stationTimer !== undefined) {
            train.stationTimer--;
            if (train.stationTimer <= 0) {
                train.speed = train.originalSpeed;
                train.atStation = false;
            }
        }
    }

    drawLeafTrail(x, y) {
        const currentTime = Date.now();
        if (currentTime - this.lastLeafTime < 100) return; // Spacing between leaves
        this.lastLeafTime = currentTime;
        
        // Calculate direction from last point
        let angle = 0;
        if (this.lastPoint) {
            angle = Math.atan2(y - this.lastPoint.y, x - this.lastPoint.x);
        }
        
        // Draw a leaf shape
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        const leafSize = this.brushSize * 0.8;
        
        // Leaf body
        this.ctx.fillStyle = this.getCurrentColor();
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, leafSize, leafSize * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Leaf vein
        this.ctx.strokeStyle = this.getCurrentColor();
        this.ctx.globalAlpha = 0.9;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-leafSize * 0.8, 0);
        this.ctx.lineTo(leafSize * 0.8, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawFlowerChain(x, y) {
        const currentTime = Date.now();
        if (currentTime - this.lastFlowerTime < 150) return; // Spacing between flowers
        this.lastFlowerTime = currentTime;
        
        // Set minimum flower size equivalent to brush size 20
        const minFlowerSize = 20 * 0.6; // Same calculation as original but with 20 as minimum
        const flowerSize = Math.max(minFlowerSize, this.brushSize * 0.6);
        const petalColors = ['#FF69B4', '#FFB6C1', '#FFA0B4', '#FF1493', '#FF8FA3'];
        const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];
        
        // Store flower data for animation - everything on overlay now
        const flower = {
            x: x,
            y: y,
            size: flowerSize,
            color: petalColor,
            createdTime: currentTime,
            phase: Math.random() * Math.PI * 2,
            stemHeight: flowerSize * 1.2
        };
        
        this.flowers.push(flower);
        
        // Start flower animation if not already running
        if (!this.flowerAnimationRunning) {
            this.flowerAnimationRunning = true;
            this.animateFlowers();
        }
        
        // Clean up old flowers (keep only recent ones)
        this.flowers = this.flowers.filter(flower => 
            currentTime - flower.createdTime < 10000 // Keep for 10 seconds
        );
    }

    animateFlowers() {
        if (this.flowers.length === 0) {
            this.flowerAnimationRunning = false;
            return;
        }
        
        // Use the appropriate overlay context based on mode
        const overlayCtx = this.pdfMode ? this.pdfOverlayCtx : this.overlayCtx;
        
        if (!overlayCtx) return;
        
        // Clear the areas where animated flowers are drawn
        this.flowers.forEach(flower => {
            const adjustedCoords = this.getAdjustedCoords(flower.x, flower.y);
            overlayCtx.clearRect(
                adjustedCoords.x - flower.size, 
                adjustedCoords.y - flower.size * 1.5, 
                flower.size * 2, 
                flower.size * 1.5
            );
        });
        
        // Redraw all flowers with current sway
        this.flowers.forEach(flower => {
            this.drawAnimatedFlower(flower, overlayCtx);
        });
        
        if (this.flowerAnimationRunning) {
            requestAnimationFrame(() => this.animateFlowers());
        }
    }

    drawAnimatedFlower(flower, overlayCtx) {
        if (!overlayCtx) overlayCtx = this.pdfMode ? this.pdfOverlayCtx : this.overlayCtx;
        if (!overlayCtx) return;
        
        const adjustedCoords = this.getAdjustedCoords(flower.x, flower.y);
        const sway = Math.sin(Date.now() * 0.003 + flower.phase) * 3;
        const x = adjustedCoords.x + sway;
        const y = adjustedCoords.y;
        const flowerSize = flower.size;
        
        // Draw curved stem that bends with the flower head
        overlayCtx.strokeStyle = '#228B22';
        overlayCtx.lineWidth = 3;
        overlayCtx.globalAlpha = 0.8;
        overlayCtx.beginPath();
        
        // Start at the base (no sway)
        overlayCtx.moveTo(adjustedCoords.x, y + flowerSize * 1.2);
        
        // Create a curved stem that bends toward the swaying flower head
        const midX = adjustedCoords.x + sway * 0.5; // Midpoint bends half as much
        const midY = y + flowerSize * 0.7;
        const topX = x; // Top connects to the swaying flower
        const topY = y + flowerSize * 0.2;
        
        // Draw curved stem using quadratic curve
        overlayCtx.quadraticCurveTo(midX, midY, topX, topY);
        overlayCtx.stroke();
        
        // Draw swaying flower head on overlay canvas
        overlayCtx.fillStyle = flower.color;
        overlayCtx.globalAlpha = 0.8;
        
        const petalPositions = [
            { offsetX: 0, offsetY: -flowerSize * 0.6 },
            { offsetX: -flowerSize * 0.4, offsetY: -flowerSize * 0.3 },
            { offsetX: flowerSize * 0.4, offsetY: -flowerSize * 0.3 },
            { offsetX: -flowerSize * 0.3, offsetY: 0 },
            { offsetX: flowerSize * 0.3, offsetY: 0 }
        ];
        
        petalPositions.forEach(petal => {
            overlayCtx.beginPath();
            overlayCtx.ellipse(
                x + petal.offsetX, 
                y + petal.offsetY, 
                flowerSize * 0.25, 
                flowerSize * 0.4, 
                0, 0, Math.PI * 2
            );
            overlayCtx.fill();
        });
        
        // Draw center
        overlayCtx.fillStyle = '#FFFF00';
        overlayCtx.globalAlpha = 0.9;
        overlayCtx.beginPath();
        overlayCtx.arc(x, y, flowerSize * 0.2, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.globalAlpha = 1;
    }

    drawGrassStamper(x, y) {
        const currentTime = Date.now();
        if (currentTime - this.lastGrassTime < 120) return; // Spacing between grass clusters
        this.lastGrassTime = currentTime;
        
        const grassHeight = this.brushSize * 1.5;
        const numBlades = 3 + Math.floor(Math.random() * 4); // 3-6 blades per cluster
        
        for (let i = 0; i < numBlades; i++) {
            const bladeX = x + (Math.random() - 0.5) * this.brushSize;
            const bladeY = y;
            const bladeHeight = grassHeight * (0.7 + Math.random() * 0.6);
            const bladeWidth = 2 + Math.random() * 2;
            
            // Store grass blade for animation
            const grassBlade = {
                x: bladeX,
                y: bladeY,
                height: bladeHeight,
                width: bladeWidth,
                createdTime: currentTime,
                phase: Math.random() * Math.PI * 2
            };
            this.grassBlades.push(grassBlade);
        }
        
        // Start grass animation if not already running
        if (!this.grassAnimationRunning) {
            this.grassAnimationRunning = true;
            this.animateGrass();
        }
        
        // Clean up old grass blades (keep only recent ones)
        this.grassBlades = this.grassBlades.filter(blade => 
            currentTime - blade.createdTime < 10000 // Keep for 10 seconds
        );
    }

    animateGrass() {
        if (this.grassBlades.length === 0) {
            this.grassAnimationRunning = false;
            return;
        }
        
        // Use the appropriate overlay context based on mode
        const overlayCtx = this.pdfMode ? this.pdfOverlayCtx : this.overlayCtx;
        
        if (!overlayCtx) return;
        
        // Clear the areas where grass blades are drawn
        this.grassBlades.forEach(blade => {
            const adjustedCoords = this.getAdjustedCoords(blade.x, blade.y);
            overlayCtx.clearRect(
                adjustedCoords.x - 10, 
                adjustedCoords.y - blade.height - 5, 
                20, 
                blade.height + 10
            );
        });
        
        // Redraw all grass blades with current wiggle
        this.grassBlades.forEach(blade => {
            this.drawGrassBladeOnOverlay(blade, overlayCtx);
        });
        
        if (this.grassAnimationRunning) {
            requestAnimationFrame(() => this.animateGrass());
        }
    }

    drawGrassBladeOnOverlay(blade, overlayCtx) {
        if (!overlayCtx) overlayCtx = this.pdfMode ? this.pdfOverlayCtx : this.overlayCtx;
        if (!overlayCtx) return;
        
        const adjustedCoords = this.getAdjustedCoords(blade.x, blade.y);
        const wiggle = Math.sin(Date.now() * 0.005 + blade.phase) * 2;
        
        overlayCtx.strokeStyle = '#228B22';
        overlayCtx.lineWidth = blade.width;
        overlayCtx.lineCap = 'round';
        overlayCtx.globalAlpha = 0.8;
        
        overlayCtx.beginPath();
        overlayCtx.moveTo(adjustedCoords.x, adjustedCoords.y);
        
        // Draw curved grass blade with wiggle at the top
        const midX = adjustedCoords.x + wiggle * 0.3;
        const midY = adjustedCoords.y - blade.height * 0.5;
        const topX = adjustedCoords.x + wiggle;
        const topY = adjustedCoords.y - blade.height;
        
        overlayCtx.quadraticCurveTo(midX, midY, topX, topY);
        overlayCtx.stroke();
        
        overlayCtx.globalAlpha = 1;
    }

    drawBlockyBuilder(x, y) {
        // Snap coordinates to block grid
        const gridX = Math.floor(x / this.blockSize) * this.blockSize;
        const gridY = Math.floor(y / this.blockSize) * this.blockSize;
        
        // Always draw a block at the current position
        this.drawSingleBlock(gridX, gridY);
        
        // If we have a previous position and it's different, draw blocks along the line
        if (this.lastBlockX !== null && this.lastBlockY !== null && 
            (this.lastBlockX !== gridX || this.lastBlockY !== gridY)) {
            this.drawBlockLine(this.lastBlockX, this.lastBlockY, gridX, gridY);
        }
        
        // Always update the last position
        this.lastBlockX = gridX;
        this.lastBlockY = gridY;
    }
    
    drawBlockLine(x1, y1, x2, y2) {
        // Calculate the distance between points in grid units
        const dx = Math.abs(x2 - x1) / this.blockSize;
        const dy = Math.abs(y2 - y1) / this.blockSize;
        const steps = Math.max(dx, dy);
        
        // If points are adjacent, no need to fill between
        if (steps <= 1) return;
        
        // Interpolate between the points
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const interpX = Math.floor((x1 + (x2 - x1) * t) / this.blockSize) * this.blockSize;
            const interpY = Math.floor((y1 + (y2 - y1) * t) / this.blockSize) * this.blockSize;
            this.drawSingleBlock(interpX, interpY);
        }
    }
    
    drawSingleBlock(x, y) {
        // Draw the main block
        this.ctx.fillStyle = this.getCurrentColor();
        this.ctx.fillRect(x, y, this.blockSize, this.blockSize);
        
        // Add a subtle border for the block effect
        this.ctx.strokeStyle = this.darkenColor(this.getCurrentColor(), 0.3);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
        
        // Add a highlight on top-left for 3D effect
        this.ctx.fillStyle = this.lightenColor(this.getCurrentColor(), 0.3);
        this.ctx.fillRect(x, y, this.blockSize, 2);
        this.ctx.fillRect(x, y, 2, this.blockSize);
    }
    
    darkenColor(color, factor) {
        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            const newR = Math.floor(r * (1 - factor));
            const newG = Math.floor(g * (1 - factor));
            const newB = Math.floor(b * (1 - factor));
            
            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
    
    lightenColor(color, factor) {
        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            
            const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
            const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
            const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
            
            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    drawMirrorPainting(x, y) {
        // Draw strokes at all mirror positions
        for (let i = 0; i < this.mirrorSections; i++) {
            const mirrorPoint = this.getMirrorPoint(x, y, i);
            
            this.ctx.strokeStyle = this.getCurrentColor();
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            if (this.lastPoint) {
                const lastMirrorPoint = this.getMirrorPoint(this.lastPoint.x, this.lastPoint.y, i);
                
                this.ctx.beginPath();
                this.ctx.moveTo(lastMirrorPoint.x, lastMirrorPoint.y);
                this.ctx.lineTo(mirrorPoint.x, mirrorPoint.y);
                this.ctx.stroke();
            }
        }
    }
    
    getMirrorPoint(x, y, sectionIndex) {
        // Convert to relative coordinates from center
        const relX = x - this.centerX;
        const relY = y - this.centerY;
        
        // Convert to polar coordinates
        const distance = Math.sqrt(relX * relX + relY * relY);
        const angle = Math.atan2(relY, relX);
        
        // Calculate the angle for this mirror section
        const sectionAngle = (2 * Math.PI / this.mirrorSections) * sectionIndex;
        
        // Create different mirror effects for variety
        let newAngle;
        if (sectionIndex % 2 === 0) {
            // Even sections: rotate normally
            newAngle = angle + sectionAngle;
        } else {
            // Odd sections: mirror reflection for kaleidoscope effect
            newAngle = -angle + sectionAngle;
        }
        
        // Convert back to cartesian coordinates
        const newX = this.centerX + distance * Math.cos(newAngle);
        const newY = this.centerY + distance * Math.sin(newAngle);
        
        return { x: newX, y: newY };
    }

    closeAllCategories() {
        const allCategories = ['brushes-effects', 'tools', 'actions', 'colors'];
        allCategories.forEach(catId => {
            const content = document.getElementById(catId);
            const arrow = content?.parentElement?.querySelector('.category-arrow');
            if (content && arrow) {
                content.style.display = 'none';
                arrow.textContent = '▶';
            }
        });
    }
}

// Global function for category toggles
function toggleCategory(categoryId) {
    const content = document.getElementById(categoryId);
    const arrow = content.parentElement.querySelector('.category-arrow');
    const header = content.parentElement.querySelector('.category-header');
    
    // Close all other categories first
    const allCategories = ['brushes-effects', 'tools', 'actions', 'colors'];
    allCategories.forEach(catId => {
        if (catId !== categoryId) {
            const otherContent = document.getElementById(catId);
            const otherArrow = otherContent?.parentElement?.querySelector('.category-arrow');
            if (otherContent && otherArrow) {
                otherContent.style.display = 'none';
                otherArrow.textContent = '▶';
            }
        }
    });
    
    if (content.style.display === 'none' || !content.style.display) {
        // Show as a fixed-position dropdown anchored to the header rect (viewport-based)
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.alignItems = 'stretch';
        content.style.position = 'fixed';
        content.style.zIndex = '5000';
        content.style.minWidth = '220px';

        const place = () => {
            const rect = header.getBoundingClientRect();
            let top = Math.round(rect.bottom + 6);
            let left = Math.round(rect.left);
            const padding = 8;

            // Horizontal clamp
            const width = content.offsetWidth || 220;
            if (left + width + padding > window.innerWidth) {
                left = Math.max(padding, window.innerWidth - width - padding);
            }
            if (left < padding) left = padding;

            // Vertical flip and clamp
            const spaceBelow = window.innerHeight - rect.bottom - 10;
            const spaceAbove = rect.top - 10;
            const minDropdownHeight = 150;
            let openDir = 'down';
            if (spaceBelow < minDropdownHeight && spaceAbove > spaceBelow) {
                openDir = 'up';
            }

            if (openDir === 'down') {
                content.style.top = top + 'px';
                content.style.bottom = 'auto';
                content.style.maxHeight = '';
            } else {
                // Open upwards: position bottom relative to viewport
                content.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
                content.style.top = 'auto';
                content.style.maxHeight = '';
            }

            content.style.left = left + 'px';
            content.dataset.openDir = openDir;
        };

        place();

        // Reposition on resize/scroll while open
        const onScrollResize = () => {
            if (content.style.display === 'block') place();
            else {
                window.removeEventListener('scroll', onScrollResize, true);
                window.removeEventListener('resize', onScrollResize);
            }
        };
        window.addEventListener('scroll', onScrollResize, true);
        window.addEventListener('resize', onScrollResize);

        arrow.textContent = '▼';
    } else {
        content.style.display = 'none';
        arrow.textContent = '▶';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new KidsDrawingApp();
    window.appInstance = app;
    if (window.DailyUnlock) window.DailyUnlock.init();
    if (window.Replay) window.Replay.init(app);
    if (window.Analytics) window.Analytics.init();
    if (window.GifExport) window.GifExport.init();
    
    // Show scroll hint on mobile if toolbar is scrollable
    const toolbar = document.querySelector('.toolbar');
    const scrollHint = document.querySelector('.toolbar-scroll-hint');
    
    if (toolbar && scrollHint) {
        const checkScrollable = () => {
            const isScrollable = toolbar.scrollWidth > toolbar.clientWidth;
            const isMobile = window.innerWidth <= 768;
            
            if (isScrollable && isMobile) {
                scrollHint.style.display = 'block';
                
                // Hide hint after scroll or after 5 seconds
                let hintTimeout = setTimeout(() => {
                    scrollHint.style.display = 'none';
                }, 5000);
                
                toolbar.addEventListener('scroll', () => {
                    clearTimeout(hintTimeout);
                    scrollHint.style.display = 'none';
                }, { once: true });
            } else {
                scrollHint.style.display = 'none';
            }
        };
        
        checkScrollable();
        window.addEventListener('resize', checkScrollable);
    }
});
