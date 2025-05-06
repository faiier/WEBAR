document.addEventListener('DOMContentLoaded', () => {
    // Quiz data
    const quizData = [
      {
        question: "นี่คือโมเดลของอะไร?",
        options: ["รถยนต์", "เครื่องบิน", "เรือ", "จักรยาน"],
        correctAnswer: 0,
        model: "./assets/models/model1.glb",
        scale: "0.5 0.5 0.5"
      },
      {
        question: "ส่วนสีแดงคืออะไร?",
        options: ["ประตู", "ล้อ", "กระจกหน้า", "ไฟท้าย"],
        correctAnswer: 2,
        model: "./assets/models/model2.glb",
        scale: "0.3 0.3 0.3"
      }
    ];
  
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const arContent = document.getElementById('ar-content');
    const modelContainer = document.getElementById('model-container');
    const controlsInfo = document.getElementById('controls-info');
  
    // Variables
    let currentQuestionIndex = 0;
    let modelEntity = null;
    let isDragging = false;
    let previousTouchPosition = { x: 0, y: 0 };
    let scale = 1;
  
    // Initialize
    function init() {
      startButton.addEventListener('click', startARExperience);
      setupEventListeners();
      controlsInfo.style.display = 'none';
    }
  
    // Start AR Experience
    function startARExperience() {
      startScreen.style.display = 'none';
      arContent.setAttribute('visible', 'true');
      controlsInfo.style.display = 'block';
      loadQuestion(currentQuestionIndex);
    }
  
    // Load Question
    function loadQuestion(index) {
      if (index >= quizData.length) {
        // Quiz completed
        questionText.textContent = "เสร็จสิ้นแบบทดสอบ!";
        optionsContainer.innerHTML = '';
        return;
      }
  
      const question = quizData[index];
      questionText.textContent = question.question;
      
      // Clear previous options
      optionsContainer.innerHTML = '';
      
      // Add new options
      question.options.forEach((option, i) => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.addEventListener('click', () => checkAnswer(i));
        optionsContainer.appendChild(button);
      });
  
      // Load 3D model
      loadModel(question.model, question.scale);
    }
  
    // Check Answer
    function checkAnswer(selectedIndex) {
      const currentQuestion = quizData[currentQuestionIndex];
      
      if (selectedIndex === currentQuestion.correctAnswer) {
        // Correct answer
        questionText.textContent = "ถูกต้อง! กำลังไปข้อถัดไป...";
        setTimeout(() => {
          currentQuestionIndex++;
          loadQuestion(currentQuestionIndex);
        }, 1500);
      } else {
        // Wrong answer
        questionText.textContent = "คำตอบไม่ถูกต้อง ลองอีกครั้ง!";
      }
    }
  
    // ในส่วนของ loadModel ให้แก้ไขเป็นดังนี้
function loadModel(modelPath, modelScale) {
    // Remove previous model if exists
    if (modelEntity) {
      modelContainer.removeChild(modelEntity);
    }
  
    // Create new model entity
    modelEntity = document.createElement('a-entity');
    modelEntity.setAttribute('gltf-model', modelPath);
    modelEntity.setAttribute('scale', modelScale);
    modelEntity.setAttribute('position', '0 0 -1');
    modelEntity.setAttribute('rotation', '0 0 0');
    
    // เก็บค่า scale ต้นฉบับไว้
    modelEntity.setAttribute('data-original-scale', modelScale);
    
    modelContainer.appendChild(modelEntity);
  }
  
  // แทนที่ฟังก์ชัน setupEventListeners ทั้งหมดด้วยเวอร์ชันใหม่นี้
  function setupEventListeners() {
    const scene = document.querySelector('a-scene');
    
    // ตัวแปรสำหรับการควบคุม
    let isDragging = false;
    let previousTouchPosition = { x: 0, y: 0 };
    let initialScale = 1;
    let currentScale = 1;
    let initialDistance = 0;
  
    // Touch/Mouse events for rotation
    scene.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousTouchPosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      } else if (e.touches.length === 2) {
        // สำหรับการซูม
        isDragging = false;
        initialDistance = getDistance(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        if (modelEntity) {
          initialScale = currentScale;
        }
      }
    });
  
    scene.addEventListener('touchmove', (e) => {
      if (!modelEntity) return;
      
      // การหมุนโมเดล
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousTouchPosition.x;
        const deltaY = e.touches[0].clientY - previousTouchPosition.y;
        
        const rotation = modelEntity.getAttribute('rotation');
        modelEntity.setAttribute('rotation', {
          x: rotation.x - deltaY * 0.5,
          y: rotation.y - deltaX * 0.5,
          z: rotation.z
        });
        
        previousTouchPosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
      // การซูมโมเดล
      else if (e.touches.length === 2) {
        const currentDistance = getDistance(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        
        if (initialDistance > 0) {
          const scaleFactor = currentDistance / initialDistance;
          currentScale = Math.max(0.2, Math.min(3, initialScale * scaleFactor));
          
          // ใช้ scale ต้นฉบับและปรับตามการซูมของผู้ใช้
          const originalScale = modelEntity.getAttribute('data-original-scale');
          const scaleArray = originalScale.split(' ').map(parseFloat);
          
          const newScale = {
            x: scaleArray[0] * currentScale,
            y: scaleArray[1] * currentScale,
            z: scaleArray[2] * currentScale
          };
          
          modelEntity.setAttribute('scale', `${newScale.x} ${newScale.y} ${newScale.z}`);
        }
      }
    });
  
    scene.addEventListener('touchend', () => {
      isDragging = false;
      initialDistance = 0;
    });
  
    // สำหรับการทดสอบบน Desktop ด้วยเมาส์
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };
  
    scene.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });
  
    scene.addEventListener('mousemove', (e) => {
      if (isMouseDown && modelEntity) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        const rotation = modelEntity.getAttribute('rotation');
        modelEntity.setAttribute('rotation', {
          x: rotation.x - deltaY * 0.5,
          y: rotation.y - deltaX * 0.5,
          z: rotation.z
        });
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });
  
    scene.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
  
    // การซูมด้วยเมาส์ wheel
    scene.addEventListener('wheel', (e) => {
      if (!modelEntity) return;
      
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      currentScale = Math.max(0.2, Math.min(3, currentScale + delta));
      
      const originalScale = modelEntity.getAttribute('data-original-scale');
      const scaleArray = originalScale.split(' ').map(parseFloat);
      
      const newScale = {
        x: scaleArray[0] * currentScale,
        y: scaleArray[1] * currentScale,
        z: scaleArray[2] * currentScale
      };
      
      modelEntity.setAttribute('scale', `${newScale.x} ${newScale.y} ${newScale.z}`);
    });
  }
  
  // ฟังก์ชันช่วยเหลือคำนวณระยะทาง (เดิม)
  function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
    // Initialize the app
    init();
  });