fetch('/get-data')
  .then(response => response.json())
  .then(data => {
    document.querySelector('.loading').style.display = 'none';
    console.log(data);
    // Ensure images and zones are available
    for (let index = 0; index < data.images.length; index++) {
      displayPositions(data, data['images'], data['zones'], index);
    }
    enableEditAndSave();
  })
  .catch(error => console.error('Error fetching data:', error));

// Define colors for each person_id
const personColors = {
  1: "#FF5733", // Red-orange
  2: "#33FF57", // Green
  3: "#3357FF", // Blue
  4: "#F033FF", // Purple
  5: "#FFFC33", // Yellow
  6: "#33FFF6", // Cyan
  7: "#FF33A8", // Pink
  8: "#A833FF"  // Violet
};

function displayPositions(data, images, zones, index) {
  const frameData = zones[index];
  if (!frameData) {
    console.warn("No data");
    return;
  }

  const imagePath = images[index];
  if (!imagePath) {
    console.warn("No data");
    return;
  }

  const peopleData = [];

  frameData.forEach((item) => {
    if (item.person_id) {
      peopleData.push(item);
    }
  });

  const container = document.querySelector(".container");

  // สร้าง div สำหรับแต่ละเฟรม
  const frameDiv = document.createElement("div");
  frameDiv.classList.add("frame");

  // สร้างส่วนข้อมูลเฟรม
  const frameInfoDiv = document.createElement("div");
  frameInfoDiv.classList.add("frame-info");
  frameInfoDiv.innerHTML = `<h3>Frame ${index + 1}</h3>`;

  // สร้าง container สำหรับรูปภาพ
  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  imageContainer.id = `image-container-${index + 1}`;

  const img = document.createElement("img");
  img.src = imagePath; // แก้ไข path
  img.id = `image-${index + 1}`;

  imageContainer.appendChild(img);
  frameInfoDiv.appendChild(imageContainer);

  // Canvas สำหรับแสดงผลแบบแผนที่
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
  canvas.style.background = "transperent";
  canvas.id = `canvas-${index + 1}`;

  const borderLine = document.createElement('div');
  borderLine.classList.add('border-line');

  frameDiv.appendChild(frameInfoDiv);
  frameDiv.appendChild(borderLine);
  frameDiv.appendChild(canvas);
  container.appendChild(frameDiv);

  // รอให้รูปภาพโหลดเสร็จก่อนแสดงจุด
  img.onload = function () {
    // วาดจุดบน canvas
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // วาดจุดสำหรับแต่ละคน
    peopleData.forEach((person, indexColor) => {
      const normalizedX = person['coordinates'].x;
      const normalizedY = person['coordinates'].y;

      // คำนวณตำแหน่งบน canvas
      const canvasX = normalizedX * canvas.width;
      const canvasY = normalizedY * canvas.height;

      // วาดจุด
      ctx.fillStyle = personColors[indexColor + 1]; // สีส้มโปร่งแสง
      ctx.shadowColor = `${personColors[indexColor + 1] + 'aa'}`;
      console.log(`${personColors[indexColor + 1] + '03'}`);
      ctx.shadowBlur = 10; // ทำให้จุดมี glow effect
      ctx.beginPath();
      ctx.arc(canvasX * 1.1, canvasY - 100, 11, 0, Math.PI * 2);
      ctx.fill();
    });
  };
}

// Function to enable editing of dance positions and saving changes
function enableEditAndSave() {
  // Global variables to track editing state
  let isEditMode = false;
  let selectedPoint = null;
  let dragStartX, dragStartY;
  let originalPositions = {};

  // Add edit button to each frame
  const frames = document.querySelectorAll('.frame');

  frames.forEach((frame, frameIndex) => {
    const frameNumber = frameIndex + 1;
    const frameKey = `frame_${frameNumber}`;
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn');
    editBtn.textContent = 'Edit Positions';
    editBtn.setAttribute('data-frame', frameKey);

    const saveBtn = document.createElement('button');
    saveBtn.classList.add('save-btn');
    saveBtn.textContent = 'Save Changes';
    saveBtn.setAttribute('data-frame', frameKey);
    saveBtn.style.display = 'none';

    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('data-frame', frameKey);
    cancelBtn.style.display = 'none';

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);

    frame.querySelector('.frame-info').appendChild(buttonContainer);

    // Get canvas for this frame
    const canvas = frame.querySelector(`canvas`);

    // Edit button click handler
    editBtn.addEventListener('click', () => {
      // Enter edit mode
      isEditMode = true;
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'inline-block';

      // Store original positions before editing
      fetch('/get-data')
        .then(response => response.json())
        .then(data => {
          // Store a deep copy of the original positions for this frame
          originalPositions[frameKey] = JSON.parse(JSON.stringify(data.zones[frameIndex]));

          // Highlight that we're in edit mode
          canvas.style.border = '2px solid #ff00a1';
          canvas.style.cursor = 'move';

          // Enable drag functionality
          enableDragAndDrop(canvas, frameKey, frameIndex, data);
        });
    });

    // Save button click handler
    saveBtn.addEventListener('click', () => {
      // Exit edit mode
      isEditMode = false;
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      canvas.style.border = 'none';
      canvas.style.cursor = 'default';

      // Fetch current data, then save changes
      fetch('/get-data')
        .then(response => response.json())
        .then(data => {
          // Save updated data back to server
          savePositionsToServer(data)
            .then(() => {
              showNotification('Changes saved successfully!', 'success');
            })
            .catch(error => {
              showNotification('Error saving changes: ' + error.message, 'error');
            });
        });
    });

    // Cancel button click handler
    cancelBtn.addEventListener('click', () => {
      // Exit edit mode and restore original positions
      isEditMode = false;
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      canvas.style.border = 'none';
      canvas.style.cursor = 'default';

      fetch('/get-data')
        .then(response => response.json())
        .then(data => {
          // Restore original positions
          data.zones[frameIndex] = originalPositions[frameKey];

          // Redraw the canvas with original positions
          redrawCanvas(canvas, data.zones[frameIndex]);

          showNotification('Changes cancelled', 'info');
        });
    });
  });

  // Function to enable drag and drop on canvas
  function enableDragAndDrop(canvas, frameKey, frameIndex, data) {
    const ctx = canvas.getContext('2d');

    // Mouse down event - check if clicked on a point
    canvas.addEventListener('mousedown', (e) => {
      if (!isEditMode) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find if user clicked on any point
      const peopleData = data.zones[frameIndex].filter(item => item.person_id);

      for (let i = 0; i < peopleData.length; i++) {
        const person = peopleData[i];
        const normalizedX = person.coordinates.x;
        const normalizedY = person.coordinates.y;

        // Calculate position on canvas (match the display calculation)
        const pointX = normalizedX * canvas.width * 1.1;
        const pointY = normalizedY * canvas.height - 100;

        // Check if mouse is within point area (using distance formula)
        const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));

        if (distance <= 15) { // Slightly larger than point radius for easier selection
          selectedPoint = {
            personId: person.person_id,
            frameIndex: frameIndex
          };
          dragStartX = mouseX;
          dragStartY = mouseY;

          // Redraw with selected point highlighted
          redrawCanvas(canvas, data.zones[frameIndex]);
          break;
        }
      }
    });

    // Mouse move event - drag the selected point
    canvas.addEventListener('mousemove', (e) => {
      if (!isEditMode || !selectedPoint) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Update position for the selected point
      const personData = data.zones[selectedPoint.frameIndex].find(item =>
        item.person_id === selectedPoint.personId
      );

      if (personData) {
        // Calculate new normalized coordinates
        // Reverse the calculations from displayPositions
        const newNormalizedX = mouseX / (canvas.width * 1.1);
        const newNormalizedY = (mouseY + 100) / canvas.height;

        // Update coordinates in the data
        personData.coordinates.x = newNormalizedX;
        personData.coordinates.y = newNormalizedY;

        // Redraw the canvas
        redrawCanvas(canvas, data.zones[selectedPoint.frameIndex]);
      }
    });

    // Mouse up event - release the selected point
    canvas.addEventListener('mouseup', () => {
      selectedPoint = null;
    });

    // Mouse leave event - release the selected point
    canvas.addEventListener('mouseleave', () => {
      selectedPoint = null;
    });
  }

  // Function to redraw canvas with updated positions
  function redrawCanvas(canvas, frameData) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get people data
    const peopleData = frameData.filter(item => item.person_id);

    // Draw points for each person
    peopleData.forEach((person, indexColor) => {
      const normalizedX = person.coordinates.x;
      const normalizedY = person.coordinates.y;

      // Calculate position on canvas
      const canvasX = normalizedX * canvas.width * 1.1;
      const canvasY = normalizedY * canvas.height - 100;

      // Draw point
      const isSelected = selectedPoint && selectedPoint.personId === person.person_id;
      ctx.fillStyle = isSelected ? "#ff00a1" : personColors[indexColor + 1];
      ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Add person ID label
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.fillText(`Person ${person.person_id}`, canvasX + 15, canvasY + 5);
    });
  }

  // Function to save positions back to server
  async function savePositionsToServer(data) {
    return fetch('/save-positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      });
  }

  // Function to show notification
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
}

// Call the function when the page is loaded
// document.addEventListener('DOMContentLoaded', enableEditAndSave);
