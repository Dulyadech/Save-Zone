fetch("static/data/coordinates.json") // ตรวจสอบ path ให้ถูกต้อง
  .then((response) => response.json())
  .then((data) => {
    console.log("Dance Positions Data:", data);

    // เรียกใช้ฟังก์ชันแสดงข้อมูล
    for (let index = 1; index <= Object.keys(data).length; index++) {
      displayPositions(data, `frame_${index}`);
    }
  })
  .catch((error) => console.error("Error loading JSON:", error));

function displayPositions(data, frameKey) {
  const frameData = data[frameKey];
  if (!frameData) {
    console.warn("No data for frame:", frameKey);
    return;
  }

  // แยกข้อมูล path และข้อมูลคน
  let imagePath = "";
  const peopleData = [];
  let frameInfo = null;

  frameData.forEach((item) => {
    if (item.path) {
      imagePath = item.path.replace(/\\/g, "/");
    } else if (item.person_id) {
      peopleData.push(item);
    } else if (item.frame_info) {
      frameInfo = item.frame_info;
    }
  });

  const container = document.querySelector(".container");

  // สร้าง div สำหรับแต่ละเฟรม
  const frameDiv = document.createElement("div");
  frameDiv.classList.add("frame");

  // สร้างส่วนข้อมูลเฟรม
  const frameInfoDiv = document.createElement("div");
  frameInfoDiv.classList.add("frame-info");
  frameInfoDiv.innerHTML = `<h3>Frame ${frameKey.split("_")[1]}</h3>`;

  // สร้าง container สำหรับรูปภาพ
  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  imageContainer.id = `image-container-${frameKey}`;

  const img = document.createElement("img");
  img.src = imagePath.replace(/\\/g, "/"); // แก้ไข path
  img.id = `image-${frameKey}`;

  imageContainer.appendChild(img);
  frameInfoDiv.appendChild(imageContainer);

  // Canvas สำหรับแสดงผลแบบแผนที่
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 300;
  canvas.style.background = "black";
  canvas.id = `canvas-${frameKey}`;

  frameDiv.appendChild(frameInfoDiv);
  frameDiv.appendChild(canvas);
  container.appendChild(frameDiv);

  // รอให้รูปภาพโหลดเสร็จก่อนแสดงจุด
  img.onload = function () {
    // วาดจุดบน canvas
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // วาดจุดสำหรับแต่ละคน
    peopleData.forEach((person) => {
      const normalizedX = person.coordinates.normalized.x;
      const normalizedY = person.coordinates.normalized.y;

      // คำนวณตำแหน่งบน canvas
      const canvasX = normalizedX * canvas.width;
      const canvasY = normalizedY * canvas.height;

      // วาดจุด
      ctx.fillStyle = "white"; // สีส้มโปร่งแสง
      ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
      ctx.shadowBlur = 10; // ทำให้จุดมี glow effect
      ctx.beginPath();
      ctx.arc(canvasX * 1.1, canvasY - 100, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  };
}
