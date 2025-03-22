// Simplified Preview & Edit script with zone selection and saving features
document.addEventListener('DOMContentLoaded', function() {
  // Show loading indicator when page loads
  const loadingIndicator = document.querySelector('.loading');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  // Fetch data from server
  fetchData()
    .then(data => {
      renderFrames(data);
      enableEditAndSave(data);
      setupZoneSelection(data);
    })
    .catch(error => {
      console.error('Error in main process:', error);
      showNotification('Error loading data. Please try again.', 'error');
    });
    
  // Setup floating action buttons
  setupFloatingButtons();
});

// Fetch data using async/await for cleaner code
async function fetchData() {
  try {
    const response = await fetch('/get-data');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  } finally {
    // Hide loading indicator
    const loadingIndicator = document.querySelector('.loading');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
}

// Define colors for each person_id
const personColors = {
  1: "#FF5733", // Red-orange
  2: "#33FF57", // Green
  3: "#3357FF", // Blue
  4: "#F033FF", // Purple
  5: "#FFFC33", // Yellow
  6: "#33FFF6", // Cyan
  7: "#FF33A8", // Pink
  8: "#A833FF", // Violet
  9: "#FF8C33", // Orange
  10: "#33FFBD", // Mint
  11: "#8033FF", // Indigo
  12: "#FF3352"  // Crimson
};

// Render all frames from the data
function renderFrames(data) {
  const { images, zones } = data;
  
  if (!images || !images.length || !zones || !zones.length) {
    throw new Error('No data available to display');
  }
  
  const container = document.querySelector('.container');
  container.innerHTML = ''; // Clear any existing content
  
  // Create frames for each image and zone data
  for (let index = 0; index < Math.min(images.length, zones.length); index++) {
    createFrameElement(container, images[index], zones[index], index);
  }
  
  return data;
}

// Create a single frame element with image and canvas
function createFrameElement(container, imagePath, frameData, index) {
  if (!imagePath || !frameData) {
    console.warn(`Missing data for frame ${index+1}`);
    return;
  }

  // Extract people data
  const peopleData = frameData.filter(item => item.person_id);
  
  // Create frame container
  const frameDiv = document.createElement('div');
  frameDiv.classList.add('frame');
  frameDiv.dataset.frameIndex = index;
  
  // Create checkbox for zone selection
  const selectBox = document.createElement('div');
  selectBox.classList.add('frame-select');
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `select-frame-${index}`;
  checkbox.classList.add('frame-checkbox');
  checkbox.dataset.frameIndex = index;
  
  const checkboxLabel = document.createElement('label');
  checkboxLabel.htmlFor = `select-frame-${index}`;
  checkboxLabel.textContent = 'Select';
  
  selectBox.appendChild(checkbox);
  selectBox.appendChild(checkboxLabel);
  
  // Create frame info section
  const frameInfoDiv = document.createElement('div');
  frameInfoDiv.classList.add('frame-info');
  
  // Add frame title
  const frameTitle = document.createElement('h3');
  frameTitle.textContent = `Frame ${index + 1}`;
  frameInfoDiv.appendChild(frameTitle);
  frameInfoDiv.appendChild(selectBox);
  
  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');
  imageContainer.id = `image-container-${index + 1}`;
  
  // Add image
  const img = document.createElement('img');
  img.src = imagePath;
  img.id = `image-${index + 1}`;
  img.alt = `Frame ${index + 1}`;
  img.addEventListener('load', () => renderPositions(index, peopleData));
  
  imageContainer.appendChild(img);
  frameInfoDiv.appendChild(imageContainer);
  
  // Add button container
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');
  
  // Add edit button
  const editBtn = document.createElement('button');
  editBtn.classList.add('edit-btn');
  editBtn.textContent = 'Edit Positions';
  editBtn.dataset.frame = `frame_${index + 1}`;
  buttonContainer.appendChild(editBtn);
  
  // Add save button (hidden initially)
  const saveBtn = document.createElement('button');
  saveBtn.classList.add('save-btn');
  saveBtn.textContent = 'Save Changes';
  saveBtn.dataset.frame = `frame_${index + 1}`;
  saveBtn.style.display = 'none';
  buttonContainer.appendChild(saveBtn);
  
  // Add cancel button (hidden initially)
  const cancelBtn = document.createElement('button');
  cancelBtn.classList.add('cancel-btn');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.dataset.frame = `frame_${index + 1}`;
  cancelBtn.style.display = 'none';
  buttonContainer.appendChild(cancelBtn);
  
  frameInfoDiv.appendChild(buttonContainer);
  
  // Add border line
  const borderLine = document.createElement('div');
  borderLine.classList.add('border-line');
  
  // Add canvas for dance positions
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  canvas.id = `canvas-${index + 1}`;
  canvas.dataset.frameIndex = index;
  
  // Assemble the frame
  frameDiv.appendChild(frameInfoDiv);
  frameDiv.appendChild(borderLine);
  frameDiv.appendChild(canvas);
  
  // Add to container
  container.appendChild(frameDiv);
}

// Render dance positions on the canvas
function renderPositions(index, peopleData) {
  const canvas = document.getElementById(`canvas-${index + 1}`);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Add light grid for reference
  drawGrid(ctx, canvas.width, canvas.height);
  
  // Draw positions for each person
  peopleData.forEach((person, personIndex) => {
    if (!person.coordinates) return;
    
    const normalizedX = person.coordinates.x;
    const normalizedY = person.coordinates.y;
    
    // Calculate position on canvas
    const canvasX = normalizedX * canvas.width;
    const canvasY = normalizedY * canvas.height;
    
    // Draw dancer point
    drawDancerPoint(ctx, canvasX, canvasY, person.person_id, personIndex);
  });
}

// Draw a light grid on the canvas
function drawGrid(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  // Vertical grid lines
  for (let x = 0; x <= width; x += width / 10) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Horizontal grid lines
  for (let y = 0; y <= height; y += height / 10) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw center stage marker
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

// Draw a single dancer point with label
function drawDancerPoint(ctx, x, y, personId, colorIndex) {
  const color = personColors[colorIndex + 1] || '#FFFFFF';
  
  // Draw dancer point with glow effect
  ctx.save();
  ctx.shadowColor = color + 'aa';
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Draw label for the dancer
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Dancer ${personId}`, x, y - 15);
}

// Enable drag-and-drop editing functionality
function enableEditAndSave(data) {
  // State variables for editing
  let isEditMode = false;
  let selectedPoint = null;
  let originalData = JSON.parse(JSON.stringify(data)); // Deep copy of original data
  
  // Canvas references for each frame
  const canvasRefs = {};
  
  // Add event listeners to edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    const frameKey = btn.dataset.frame;
    const frameIndex = parseInt(frameKey.split('_')[1]) - 1;
    const canvas = document.getElementById(`canvas-${frameIndex + 1}`);
    
    // Store canvas reference
    canvasRefs[frameIndex] = canvas;
    
    // Add click event for edit button
    btn.addEventListener('click', () => {
      // Toggle edit mode
      isEditMode = true;
      
      // Update button visibility
      btn.style.display = 'none';
      const saveBtn = btn.nextElementSibling;
      const cancelBtn = saveBtn.nextElementSibling;
      saveBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'inline-block';
      
      // Indicate edit mode visually
      canvas.style.border = '2px solid #ff00a1';
      canvas.style.cursor = 'move';
      
      // Backup current frame data
      originalData.zones[frameIndex] = JSON.parse(JSON.stringify(data.zones[frameIndex]));
      
      // Show notification
      showNotification('Edit mode activated. Drag dancers to reposition.', 'info');
      
      // Set up drag-and-drop events
      setupDragEvents(canvas, frameIndex, data);
    });
  });
  
  // Add event listeners to save buttons
  document.querySelectorAll('.save-btn').forEach(btn => {
    const frameKey = btn.dataset.frame;
    const frameIndex = parseInt(frameKey.split('_')[1]) - 1;
    const canvas = canvasRefs[frameIndex];
    
    btn.addEventListener('click', () => {
      // Exit edit mode
      isEditMode = false;
      
      // Update button visibility
      btn.style.display = 'none';
      const editBtn = btn.previousElementSibling;
      const cancelBtn = btn.nextElementSibling;
      editBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'none';
      
      // Remove edit styling
      canvas.style.border = 'none';
      canvas.style.cursor = 'default';
      
      // Save changes to server
      savePositionsToServer(data, frameIndex)
        .then(() => {
          showNotification('Changes saved successfully!', 'success');
        })
        .catch(error => {
          showNotification('Error saving changes: ' + error.message, 'error');
        });
    });
  });
  
  // Add event listeners to cancel buttons
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    const frameKey = btn.dataset.frame;
    const frameIndex = parseInt(frameKey.split('_')[1]) - 1;
    const canvas = canvasRefs[frameIndex];
    
    btn.addEventListener('click', () => {
      // Exit edit mode
      isEditMode = false;
      
      // Update button visibility
      btn.style.display = 'none';
      const saveBtn = btn.previousElementSibling;
      const editBtn = saveBtn.previousElementSibling;
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      
      // Remove edit styling
      canvas.style.border = 'none';
      canvas.style.cursor = 'default';
      
      // Restore original data
      data.zones[frameIndex] = JSON.parse(JSON.stringify(originalData.zones[frameIndex]));
      
      // Redraw the canvas
      const peopleData = data.zones[frameIndex].filter(item => item.person_id);
      renderPositions(frameIndex, peopleData);
      
      // Show notification
      showNotification('Changes cancelled', 'info');
    });
  });
  
  // Setup drag events for a canvas
  function setupDragEvents(canvas, frameIndex, data) {
    // Mouse down - start drag
    canvas.addEventListener('mousedown', function(e) {
      if (!isEditMode) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Find if clicked on any dancer point
      const peopleData = data.zones[frameIndex].filter(item => item.person_id);
      
      // Check each dancer
      for (let i = 0; i < peopleData.length; i++) {
        const person = peopleData[i];
        const normalizedX = person.coordinates.x;
        const normalizedY = person.coordinates.y;
        
        // Calculate canvas position
        const pointX = normalizedX * canvas.width;
        const pointY = normalizedY * canvas.height;
        
        // Check if mouse is within point area
        const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));
        
        if (distance <= 15) { // Slightly larger than point radius for easier selection
          selectedPoint = {
            personId: person.person_id,
            frameIndex: frameIndex
          };
          
          // Highlight selected point by redrawing
          const updatedPeopleData = data.zones[frameIndex].filter(item => item.person_id);
          renderPositions(frameIndex, updatedPeopleData);
          
          // Add mousemove and mouseup event listeners
          canvas.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
          
          break;
        }
      }
    });
    
    // Mouse move - update position
    function handleMouseMove(e) {
      if (!selectedPoint) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Update dancer position
      const personData = data.zones[frameIndex].find(item => 
        item.person_id === selectedPoint.personId
      );
      
      if (personData) {
        // Calculate new normalized coordinates
        const newX = Math.max(0, Math.min(1, mouseX / canvas.width));
        const newY = Math.max(0, Math.min(1, mouseY / canvas.height));
        
        // Update coordinates
        personData.coordinates.x = newX;
        personData.coordinates.y = newY;
        
        // Redraw canvas
        const updatedPeopleData = data.zones[frameIndex].filter(item => item.person_id);
        renderPositions(frameIndex, updatedPeopleData);
      }
    }
    
    // Mouse up - end drag
    function handleMouseUp() {
      if (selectedPoint) {
        selectedPoint = null;
        canvas.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    }
  }
}

// Set up zone selection functionality
function setupZoneSelection(data) {
  const checkboxes = document.querySelectorAll('.frame-checkbox');
  const saveZoneBtn = document.getElementById('save-zone-btn');
  
  if (saveZoneBtn) {
    saveZoneBtn.addEventListener('click', () => {
      const selectedFrames = [];
      
      // Collect selected frames
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const frameIndex = parseInt(checkbox.dataset.frameIndex);
          selectedFrames.push(frameIndex);
        }
      });
      
      if (selectedFrames.length === 0) {
        showNotification('Please select at least one zone to save.', 'info');
        return;
      }
      
      // Generate and save the selected zones
      saveSelectedZones(data, selectedFrames);
    });
  }
}

// Generate and save images for selected zones
async function saveSelectedZones(data, selectedFrames) {
  if (selectedFrames.length === 0) return;
  
  try {
    // For single selection, save the zone directly
    if (selectedFrames.length === 1) {
      const frameIndex = selectedFrames[0];
      const canvas = document.getElementById(`canvas-${frameIndex + 1}`);
      generateAndDownloadZoneImage(canvas, `zone_${frameIndex + 1}`);
      showNotification('Zone saved as image!', 'success');
      return;
    }
    
    // For multiple selections, create a wrapper for batch download
    const wrapper = document.createElement('div');
    wrapper.id = 'zone-download-wrapper';
    wrapper.style.display = 'none';
    document.body.appendChild(wrapper);
    
    // Add a notification about multiple downloads
    showNotification(`Preparing ${selectedFrames.length} zones for download...`, 'info');
    
    // Process each selected frame
    let counter = 0;
    for (const frameIndex of selectedFrames) {
      const canvas = document.getElementById(`canvas-${frameIndex + 1}`);
      
      // Create a link for each image
      const link = document.createElement('a');
      link.href = generateZoneImageURL(canvas, true); // White background
      link.download = `zone_${frameIndex + 1}.png`;
      wrapper.appendChild(link);
      
      // Stagger downloads slightly
      setTimeout(() => {
        link.click();
        counter++;
        
        // When all downloads are complete
        if (counter === selectedFrames.length) {
          showNotification('All zones have been saved!', 'success');
          wrapper.remove();
        }
      }, frameIndex * 300); // Stagger by 300ms per zone
    }
  } catch (error) {
    console.error('Error saving zones:', error);
    showNotification('Failed to save zones. Please try again.', 'error');
  }
}

// Generate and download a single zone image
function generateAndDownloadZoneImage(canvas, filename) {
  try {
    const imageURL = generateZoneImageURL(canvas, true); // White background
    
    // Create link and trigger download
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error generating image:', error);
    return false;
  }
}

// Generate image URL from canvas
function generateZoneImageURL(canvas, whiteBackground = false) {
  // Create a new canvas to apply white background
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  
  // If white background requested
  if (whiteBackground) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw the original canvas content
  ctx.drawImage(canvas, 0, 0);
  
  // Return data URL
  return exportCanvas.toDataURL('image/png');
}

// Save positions to the server
async function savePositionsToServer(data, frameIndex) {
  try {
    // Create frame-specific data to save
    const frameData = {};
    frameData[`frame_${frameIndex + 1}`] = data.zones[frameIndex];
    
    const response = await fetch(`/save-positions?video_id=1&frame_index=${frameIndex}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(frameData)
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving positions:', error);
    throw error;
  }
}

// Show a notification message
function showNotification(message, type) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(note => note.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.classList.add('notification', type);
  notification.textContent = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// Setup floating action buttons
function setupFloatingButtons() {
  const floatingButtons = document.createElement('div');
  floatingButtons.className = 'floating-buttons';
  
  // Edit button
  const editAllBtn = document.createElement('button');
  editAllBtn.className = 'floating-btn edit-all-btn';
  editAllBtn.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
  editAllBtn.title = 'Edit All Zones';
  editAllBtn.addEventListener('click', toggleEditAllZones);
  
  // Save button
  const saveAllBtn = document.createElement('button');
  saveAllBtn.className = 'floating-btn save-all-btn';
  saveAllBtn.id = 'save-zone-btn';
  saveAllBtn.innerHTML = '<ion-icon name="download-outline"></ion-icon>';
  saveAllBtn.title = 'Save Selected Zones';
  
  // Restart button
  const restartBtn = document.createElement('button');
  restartBtn.className = 'floating-btn restart-btn';
  restartBtn.innerHTML = '<ion-icon name="refresh-outline"></ion-icon>';
  restartBtn.title = 'Return to Home';
  restartBtn.addEventListener('click', () => {
    window.location.href = '/';
  });
  
  // Add buttons to container
  floatingButtons.appendChild(editAllBtn);
  floatingButtons.appendChild(saveAllBtn);
  floatingButtons.appendChild(restartBtn);
  
  // Add to document
  document.body.appendChild(floatingButtons);
}

// Toggle edit mode for all zones
function toggleEditAllZones() {
  const editButtons = document.querySelectorAll('.edit-btn');
  const areAnyVisible = Array.from(editButtons).some(btn => btn.style.display !== 'none');
  
  if (areAnyVisible) {
    // Enter edit mode for all
    editButtons.forEach(btn => btn.click());
  } else {
    // Exit edit mode for all
    document.querySelectorAll('.save-btn').forEach(btn => btn.click());
  }
}