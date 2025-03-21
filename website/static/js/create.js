// Global variables
let stage = document.getElementById('stage');
let dancers = [];
let formations = [];
let currentFormationIndex = 0;
let isDragging = false;
let selectedDancer = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    stage = document.getElementById('stage'); // Re-select stage in case DOM wasn't fully loaded
    initializeStage();
    setupEventListeners();
});

// Initialize the stage with default settings
function initializeStage() {
    const stageWidth = document.getElementById('stage-width').value;
    const stageHeight = document.getElementById('stage-height').value;
    
    updateStageGrid(stageWidth, stageHeight);
    
    // Create initial formation
    addNewFormation();
}

// Set up all event listeners
function setupEventListeners() {
    // Stage setup
    document.getElementById('update-stage').addEventListener('click', function() {
        const width = document.getElementById('stage-width').value;
        const height = document.getElementById('stage-height').value;
        updateStageGrid(width, height);
    });
    
    // Dancers
    document.getElementById('add-dancers').addEventListener('click', function() {
        const count = document.getElementById('dancer-count').value;
        addDancers(count);
    });
    
    // Formations
    document.getElementById('add-formation').addEventListener('click', function() {
        addNewFormation();
    });
    
    document.getElementById('duplicate-formation').addEventListener('click', function() {
        duplicateCurrentFormation();
    });
    
    // Export
    document.getElementById('export-formations').addEventListener('click', exportFormations);
    
    // Note: Timeline controls event listeners removed
}

// Update the stage grid based on width and height
function updateStageGrid(width, height) {
    stage.innerHTML = '';
    stage.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    stage.style.gridTemplateRows = `repeat(${height}, 1fr)`;
    
    // Add grid cells
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            stage.appendChild(cell);
        }
    }
    
    // Add grid lines
    const gridLines = document.createElement('div');
    gridLines.classList.add('grid-lines');
    stage.appendChild(gridLines);
    
    // Update stage cell size
    updateStageCellSize();
    
    // Reposition existing dancers if any
    repositionDancers();
}

// Update the size of each cell based on stage dimensions
function updateStageCellSize() {
    const stageWidth = document.getElementById('stage-width').value;
    const stageHeight = document.getElementById('stage-height').value;
    
    const cellSize = Math.min(
        (stage.clientWidth - 2) / stageWidth,
        (stage.clientHeight - 2) / stageHeight
    );
    
    stage.style.setProperty('--cell-size', `${cellSize}px`);
}

// Add new dancers to the stage
function addDancers(count) {
    const currentCount = dancers.length;
    const totalCount = currentCount + parseInt(count);
    
    for (let i = currentCount; i < totalCount; i++) {
        const dancer = createDancer(i);
        dancers.push(dancer);
        
        // Add dancer to all formations
        formations.forEach(formation => {
            formation.positions[dancer.id] = {
                x: Math.floor(Math.random() * document.getElementById('stage-width').value),
                y: Math.floor(Math.random() * document.getElementById('stage-height').value)
            };
        });
    }
    
    updateDancersList();
    renderCurrentFormation();
}

// Create a new dancer object
function createDancer(index) {
    const dancerColors = [
        '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA',
        '#007AFF', '#5856D6', '#FF2D55', '#AF52DE', '#00C7BE'
    ];
    
    return {
        id: index,
        name: `Dancer ${index + 1}`,
        color: dancerColors[index % dancerColors.length]
    };
}

// Add a new formation
function addNewFormation() {
    const formationId = formations.length;
    const formation = {
        id: formationId,
        name: `Formation ${formationId + 1}`,
        positions: {},
        duration: 4.0 // Keep duration for data consistency, even though timeline is removed
    };
    
    // Set default positions for all dancers
    dancers.forEach(dancer => {
        formation.positions[dancer.id] = {
            x: Math.floor(Math.random() * document.getElementById('stage-width').value),
            y: Math.floor(Math.random() * document.getElementById('stage-height').value)
        };
    });
    
    formations.push(formation);
    currentFormationIndex = formations.length - 1;
    
    updateFormationsList();
    renderCurrentFormation();
}

// Duplicate the current formation
function duplicateCurrentFormation() {
    if (formations.length === 0) return;
    
    const currentFormation = formations[currentFormationIndex];
    const formationId = formations.length;
    
    const newFormation = {
        id: formationId,
        name: `Formation ${formationId + 1}`,
        positions: JSON.parse(JSON.stringify(currentFormation.positions)),
        duration: currentFormation.duration
    };
    
    formations.push(newFormation);
    currentFormationIndex = formations.length - 1;
    
    updateFormationsList();
    renderCurrentFormation();
}

// Update the dancers list in the UI
function updateDancersList() {
    const dancersList = document.getElementById('dancers-list');
    dancersList.innerHTML = '';
    
    dancers.forEach(dancer => {
        const dancerItem = document.createElement('div');
        dancerItem.classList.add('dancer-item');
        
        const colorIndicator = document.createElement('div');
        colorIndicator.classList.add('dancer-color');
        colorIndicator.style.backgroundColor = dancer.color;
        
        const dancerName = document.createElement('div');
        dancerName.classList.add('dancer-name');
        dancerName.textContent = dancer.name;
        
        const dancerActions = document.createElement('div');
        dancerActions.classList.add('dancer-actions');
        
        const editButton = document.createElement('button');
        editButton.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
        editButton.title = 'Edit dancer';
        editButton.addEventListener('click', () => editDancer(dancer.id));
        
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
        deleteButton.title = 'Remove dancer';
        deleteButton.addEventListener('click', () => removeDancer(dancer.id));
        
        dancerActions.appendChild(editButton);
        dancerActions.appendChild(deleteButton);
        
        dancerItem.appendChild(colorIndicator);
        dancerItem.appendChild(dancerName);
        dancerItem.appendChild(dancerActions);
        
        dancersList.appendChild(dancerItem);
    });
}

// Update the formations list in the UI
function updateFormationsList() {
    const formationsList = document.getElementById('formations-list');
    formationsList.innerHTML = '';
    
    formations.forEach((formation, index) => {
        const formationItem = document.createElement('div');
        formationItem.classList.add('formation-item');
        if (index === currentFormationIndex) {
            formationItem.classList.add('active');
        }
        
        const formationName = document.createElement('div');
        formationName.classList.add('formation-name');
        formationName.textContent = formation.name;
        
        const formationActions = document.createElement('div');
        formationActions.classList.add('formation-actions');
        
        const selectButton = document.createElement('button');
        selectButton.innerHTML = '<ion-icon name="eye-outline"></ion-icon>';
        selectButton.title = 'View formation';
        selectButton.addEventListener('click', () => selectFormation(index));
        
        const editButton = document.createElement('button');
        editButton.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
        editButton.title = 'Edit formation';
        editButton.addEventListener('click', () => editFormation(index));
        
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
        deleteButton.title = 'Delete formation';
        deleteButton.addEventListener('click', () => removeFormation(index));
        
        formationActions.appendChild(selectButton);
        formationActions.appendChild(editButton);
        formationActions.appendChild(deleteButton);
        
        formationItem.appendChild(formationName);
        formationItem.appendChild(formationActions);
        
        formationsList.appendChild(formationItem);
    });
}

// Render the current formation on the stage
function renderCurrentFormation() {
    if (formations.length === 0 || currentFormationIndex >= formations.length) return;
    
    // Clear existing dancer elements
    const existingDancers = stage.querySelectorAll('.dancer');
    existingDancers.forEach(el => el.remove());
    
    const formation = formations[currentFormationIndex];
    
    dancers.forEach(dancer => {
        if (!formation.positions[dancer.id]) return;
        
        const position = formation.positions[dancer.id];
        const dancerElement = document.createElement('div');
        dancerElement.classList.add('dancer');
        dancerElement.dataset.id = dancer.id;
        dancerElement.style.backgroundColor = dancer.color;
        dancerElement.style.left = `calc(var(--cell-size) * ${position.x} + var(--cell-size) / 2)`;
        dancerElement.style.top = `calc(var(--cell-size) * ${position.y} + var(--cell-size) / 2)`;
        
        // Add dancer label
        const dancerLabel = document.createElement('div');
        dancerLabel.classList.add('dancer-label');
        dancerLabel.textContent = dancer.name;
        dancerElement.appendChild(dancerLabel);
        
        // Add drag functionality
        dancerElement.addEventListener('mousedown', function(e) {
            e.preventDefault();
            isDragging = true;
            selectedDancer = dancer.id;
            
            // Add dragging class
            this.classList.add('dragging');
            
            document.addEventListener('mousemove', dragDancer);
            document.addEventListener('mouseup', function onMouseUp() {
                isDragging = false;
                dancerElement.classList.remove('dragging');
                document.removeEventListener('mousemove', dragDancer);
                document.removeEventListener('mouseup', onMouseUp);
            });
        });
        
        stage.appendChild(dancerElement);
    });
}

// Handle dragging of dancers
function dragDancer(e) {
    if (!isDragging || selectedDancer === null) return;
    
    const stageRect = stage.getBoundingClientRect();
    const stageWidth = parseInt(document.getElementById('stage-width').value);
    const stageHeight = parseInt(document.getElementById('stage-height').value);
    
    const cellSize = parseFloat(getComputedStyle(stage).getPropertyValue('--cell-size'));
    
    // Calculate grid position
    let x = Math.floor((e.clientX - stageRect.left) / cellSize);
    let y = Math.floor((e.clientY - stageRect.top) / cellSize);
    
    // Constrain to stage boundaries
    x = Math.max(0, Math.min(stageWidth - 1, x));
    y = Math.max(0, Math.min(stageHeight - 1, y));
    
    // Update formation data
    const formation = formations[currentFormationIndex];
    formation.positions[selectedDancer] = { x, y };
    
    // Update dancer position visually
    const dancerElement = stage.querySelector(`.dancer[data-id="${selectedDancer}"]`);
    if (dancerElement) {
        dancerElement.style.left = `calc(var(--cell-size) * ${x} + var(--cell-size) / 2)`;
        dancerElement.style.top = `calc(var(--cell-size) * ${y} + var(--cell-size) / 2)`;
    }
}

// Edit dancer details
function editDancer(dancerId) {
    const dancer = dancers.find(d => d.id === dancerId);
    if (!dancer) return;
    
    const newName = prompt('Enter new name for dancer:', dancer.name);
    if (newName !== null) {
        dancer.name = newName;
        updateDancersList();
        renderCurrentFormation();
    }
    
    const newColor = prompt('Enter new color (hex code):', dancer.color);
    if (newColor !== null && /^#[0-9A-F]{6}$/i.test(newColor)) {
        dancer.color = newColor;
        updateDancersList();
        renderCurrentFormation();
    }
}

// Remove a dancer
function removeDancer(dancerId) {
    if (!confirm('Are you sure you want to remove this dancer?')) return;
    
    dancers = dancers.filter(d => d.id !== dancerId);
    
    // Remove dancer from all formations
    formations.forEach(formation => {
        delete formation.positions[dancerId];
    });
    
    updateDancersList();
    renderCurrentFormation();
}

// Select a formation
function selectFormation(index) {
    currentFormationIndex = index;
    updateFormationsList();
    renderCurrentFormation();
}

// Edit formation details
function editFormation(index) {
    const formation = formations[index];
    if (!formation) return;
    
    const newName = prompt('Enter new name for formation:', formation.name);
    if (newName !== null) {
        formation.name = newName;
        
        // We keep the duration prompt for data consistency
        const newDuration = prompt('Enter duration in seconds:', formation.duration);
        if (newDuration !== null && !isNaN(newDuration) && parseFloat(newDuration) > 0) {
            formation.duration = parseFloat(newDuration);
        }
        
        updateFormationsList();
    }
}

// Remove a formation
function removeFormation(index) {
    if (formations.length <= 1) {
        alert('You must have at least one formation.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this formation?')) return;
    
    formations.splice(index, 1);
    
    if (currentFormationIndex >= formations.length) {
        currentFormationIndex = formations.length - 1;
    }
    
    updateFormationsList();
    renderCurrentFormation();
}

// Reposition dancers when stage size changes
function repositionDancers() {
    const stageWidth = parseInt(document.getElementById('stage-width').value);
    const stageHeight = parseInt(document.getElementById('stage-height').value);
    
    formations.forEach(formation => {
        Object.keys(formation.positions).forEach(dancerId => {
            const position = formation.positions[dancerId];
            
            // Ensure positions are within new boundaries
            position.x = Math.min(position.x, stageWidth - 1);
            position.y = Math.min(position.y, stageHeight - 1);
        });
    });
    
    renderCurrentFormation();
}

// Export formations to preview
function exportFormations() {
    // Save to local storage for preview page to access
    localStorage.setItem('savezone_formations', JSON.stringify({
        dancers: dancers,
        formations: formations,
        stageWidth: document.getElementById('stage-width').value,
        stageHeight: document.getElementById('stage-height').value
    }));
    
    // Redirect to preview page
    window.location.href = '/previews';
}

// Add window resize listener to adjust stage cell size
window.addEventListener('resize', function() {
    updateStageCellSize();
    renderCurrentFormation();
});