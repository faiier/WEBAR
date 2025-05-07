// ข้อมูลแบบทดสอบ
const quizData = [
  {
    question: "นี่คือโมเดลของอะไร?",
    options: ["รถยนต์", "เครื่องบิน", "เรือ", "จักรยาน"],
    correctAnswer: 0,
    model: "assets/models/model1.glb",
  },
];

// ตัวแปรระบบ
let currentQuestionIndex = 0;
let modelEntity = null;
let currentScale = 1;

// เริ่มการทดสอบ
function startQuiz() {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "flex";
  document.getElementById("ar-content").setAttribute("visible", "true");
  loadQuestion(currentQuestionIndex);
}

// โหลดคำถาม
function loadQuestion(index) {
  const question = quizData[index];
  document.getElementById("question-text").textContent = question.question;

  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";

  question.options.forEach((option, i) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(i));
    optionsContainer.appendChild(button);
  });

  loadModel(question.model);
}

// โหลดโมเดล 3D
function loadModel(modelPath) {
  const modelContainer = document.getElementById("model-container");

  // ลบโมเดลเก่า
  if (modelEntity) {
    modelContainer.removeChild(modelEntity);
  }

  // สร้างโมเดลใหม่
  modelEntity = document.createElement("a-entity");
  modelEntity.setAttribute("gltf-model", `url(${modelPath})`);
  modelEntity.setAttribute("scale", "0.3 0.3 0.3");
  modelEntity.setAttribute("data-base-scale", "1");

  modelContainer.appendChild(modelEntity);

  currentScale = 1;
}

// ตรวจสอบคำตอบ
function checkAnswer(selectedIndex) {
  const currentQuestion = quizData[currentQuestionIndex];
  if (selectedIndex === currentQuestion.correctAnswer) {
    alert("ถูกต้อง!");
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
      loadQuestion(currentQuestionIndex);
    } else {
      alert("แบบทดสอบเสร็จสิ้น!");
    }
  } else {
    alert("คำตอบไม่ถูกต้อง ลองอีกครั้ง!");
  }
}

// การควบคุมโมเดล
// ในส่วน setupModelControls() ให้แก้ไขเป็นดังนี้
function setupModelControls() {
  const scene = document.querySelector("a-scene");
  let isDragging = false;
  let previousPosition = {
    x: 0,
    y: 0,
  };
  let initialPinchDistance = 0;
  let initialScale = 1;

  // ==================== สำหรับ Touch Devices ====================
  // การหมุน
  scene.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      previousPosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      initialPinchDistance = getDistance(
        e.touches[0].clientX,
        e.touches[0].clientY,
        e.touches[1].clientX,
        e.touches[1].clientY
      );
      initialScale = currentScale;
    }
  });

  scene.addEventListener("touchmove", (e) => {
    if (!modelEntity) return;

    // การหมุน
    if (isDragging && e.touches.length === 1) {
      handleRotation(
        e.touches[0].clientX - previousPosition.x,
        e.touches[0].clientY - previousPosition.y
      );

      previousPosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
    // การซูม
    else if (e.touches.length === 2) {
      handlePinchZoom(
        e.touches[0].clientX,
        e.touches[0].clientY,
        e.touches[1].clientX,
        e.touches[1].clientY
      );
    }
  });

  scene.addEventListener("touchend", () => {
    isDragging = false;
    initialPinchDistance = 0;
  });

  // ==================== สำหรับ Desktop ====================
  let isMouseDown = false;

  scene.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    previousPosition = {
      x: e.clientX,
      y: e.clientY,
    };
  });

  scene.addEventListener("mousemove", (e) => {
    if (isMouseDown && modelEntity) {
      handleRotation(
        e.clientX - previousPosition.x,
        e.clientY - previousPosition.y
      );

      previousPosition = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  });

  scene.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  // การซูมด้วยเมาส์ wheel
  scene.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (!modelEntity) return;

    const delta = -e.deltaY * 0.01;
    currentScale = Math.max(0.3, Math.min(3, currentScale + delta));
    updateModelScale();
  });

  // ==================== ฟังก์ชันช่วยเหลือ ====================
  function handleRotation(deltaX, deltaY) {
    const rotation = modelEntity.getAttribute("rotation");
    modelEntity.setAttribute("rotation", {
      x: rotation.x - deltaY * 0.5,
      y: rotation.y - deltaX * 0.5,
      z: rotation.z,
    });
  }

  function handlePinchZoom(x1, y1, x2, y2) {
    const currentDistance = getDistance(x1, y1, x2, y2);

    if (initialPinchDistance > 0) {
      const scaleFactor = currentDistance / initialPinchDistance;
      currentScale = Math.max(0.3, Math.min(3, initialScale * scaleFactor));
      updateModelScale();
    }
  }

  function updateModelScale() {
    const baseScale =
      parseFloat(modelEntity.getAttribute("data-base-scale")) || 1;
    const newScale = baseScale * currentScale;
    modelEntity.setAttribute("scale", `${newScale} ${newScale} ${newScale}`);
  }

  function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
}

// เริ่มต้นแอป
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-button").addEventListener("click", startQuiz);
  setupModelControls();
});


