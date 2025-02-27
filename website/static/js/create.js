document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const stage = document.getElementById('stage');
    const updateStageBtn = document.getElementById('update-stage');
    const stageWidthInput = document.getElementById('stage-width');
    const stageHeightInput = document.getElementById('stage-height');
    const dancerCountInput = document.getElementById('dancer-count');
    const addDancersBtn = document.getElementById('add-dancers');
    const dancersList = document.getElementById('dancers-list');
    const formationsList = document.getElementById('formations-list');
    const addFormationBtn = document.getElementById('add-formation');
    const duplicateFormationBtn = document.getElementById('duplicate-formation');
    const saveProjectBtn = document.getElementById('save-project');
    const exportBtn = document.getElementById('export-formations');
    const playBtn = document.getElementById('play-button');
    const pauseBtn = document.getElementById('pause-button');
    const timelineSlider = document.getElementById('timeline-slider');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    // App state
    let state = {
        dancers: [],
        formations: [],
        currentFormationIndex: 0,
        stageWidth: 10,
        stageHeight: 8,
        isPlaying: false,
        duration: 60 // 60 seconds default
    };

    // Generate random color
    function getRandomColor() {
        const colors = [
            '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0',
            '#33FFF0', '#F0FF33', '#FFC733', '#33C7FF', '#FF3333'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Initialize stage
    function initStage() {
        state.stageWidth = parseInt(stageWidthInput.value);
        state.stageHeight = parseInt(stageHeightInput.value);
        
        renderStage();
    }

    // Render stage
    function renderStage() {
        // Create grid
        stage.innerHTML = '';
        stage.style.gridTemplateColumns = `repeat(${state.stageWidth}, 1fr)`;
        stage.style.gridTemplateRows = `repeat(${state.stageHeight}, 1fr)`;
        
        // Add grid cells
        for (let y = 0; y < state.stageHeight; y++) {
            for (let x = 0; x < state.stageWidth; x++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                stage.appendChild(cell);
            }
        }
        
        // Update dancer positions if we have any
        if (state.dancers.length > 0 && state.formations.length > 0) {
            renderDancers();
        }
    }

    // Add dancers to the stage
    function addDancers() {
        const count = parseInt(dancerCountInput.value);
        state.dancers = [];
        
        for (let i = 0; i < count; i++) {
            const dancer = {
                id: i + 1,
                name: `Dancer ${i + 1}`,
                color: getRandomColor()
            };
            state.dancers.push(dancer);
        }
        
        // Create initial formation if none exists
        if (state.formations.length === 0) {
            addFormation();
        } else {
            // Update all formations to include new dancers
            state.formations.forEach(formation => {
                state.dancers.forEach(dancer => {
                    if (!formation.positions[dancer.id]) {
                        formation.positions[dancer.id] = {
                            x: Math.floor(Math.random() * state.stageWidth),
                            y: Math.floor(Math.random() * state.stageHeight)
                        };
                    }
                });
            });
        }
        
        renderDancersList();
        renderFormationsList();
        renderDancers();
    }

    // Render dancers on stage
    function renderDancers() {
        // Clear existing dancers
        const dancerElements = stage.querySelectorAll('.dancer');
        dancerElements.forEach(el => el.remove());
        
        // Get current formation
        const formation = state.formations[state.currentFormationIndex];
        if (!formation) return;
        
        // Add dancers to stage
        state.dancers.forEach(dancer => {
            const position = formation.positions[dancer.id];
            if (!position) return;
            
            const dancerEl = document.createElement('div');
            dancerEl.classList.add('dancer');
            dancerEl.dataset.id = dancer.id;
            dancerEl.style.backgroundColor = dancer.color;
            dancerEl.style.position = 'absolute';
            dancerEl.style.width = '30px';
            dancerEl.style.height = '30px';
            dancerEl.style.borderRadius = '50%';
            dancerEl.style.display = 'flex';
            dancerEl.style.alignItems = 'center';
            dancerEl.style.justifyContent = 'center';
            dancerEl.style.color = 'white';
            dancerEl.style.fontWeight = 'bold';
            dancerEl.style.fontSize = '12px';
            dancerEl.style.cursor = 'move';
            dancerEl.style.zIndex = '10';
            dancerEl.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
            dancerEl.textContent = dancer.id;
            
            // Calculate position (center in cell)
            const cellWidth = stage.clientWidth / state.stageWidth;
            const cellHeight = stage.clientHeight / state.stageHeight;
            
            dancerEl.style.left = `${position.x * cellWidth + (cellWidth / 2) - 15}px`;
            dancerEl.style.top = `${position.y * cellHeight + (cellHeight / 2) - 15}px`;
            
            stage.appendChild(dancerEl);
            
            // Make dancer draggable
            makeDraggable(dancerEl);
        });
    }

    // Make dancer draggable
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.onmousedown = dragMouseDown;
        
        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            const newTop = Math.max(0, Math.min(stage.clientHeight - 30, element.offsetTop - pos2));
            const newLeft = Math.max(0, Math.min(stage.clientWidth - 30, element.offsetLeft - pos1));
            
            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
        }
        
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            
            // Update dancer position in current formation
            const dancerId = parseInt(element.dataset.id);
            const cellWidth = stage