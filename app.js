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
  
    // Load 3D Model
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
      modelEntity.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear');
      
      modelContainer.appendChild(modelEntity);
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
  
    // Setup Event Listeners for Model Interaction
    function setupEventListeners() {
      const scene = document.querySelector('a-scene');
      
      // Touch/Mouse events for rotation
      scene.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          previousTouchPosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
      });
  
      scene.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1 && modelEntity) {
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
      });
  
      scene.addEventListener('touchend', () => {
        isDragging = false;
      });
  
      // Pinch to zoom
      let initialDistance = 0;
      scene.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2 && modelEntity) {
          initialDistance = getDistance(
            e.touches[0].clientX, e.touches[0].clientY,
            e.touches[1].clientX, e.touches[1].clientY
          );
        }
      });
  
      scene.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && modelEntity) {
          const currentDistance = getDistance(
            e.touches[0].clientX, e.touches[0].clientY,
            e.touches[1].clientX, e.touches[1].clientY
          );
          
          if (initialDistance > 0) {
            const delta = currentDistance - initialDistance;
            scale += delta * 0.001;
            scale = Math.max(0.1, Math.min(2, scale));
            
            const currentScale = modelEntity.getAttribute('scale');
            modelEntity.setAttribute('scale', {
              x: currentScale.x * scale,
              y: currentScale.y * scale,
              z: currentScale.z * scale
            });
            
            initialDistance = currentDistance;
          }
        }
      });
  
      scene.addEventListener('touchend', () => {
        initialDistance = 0;
      });
    }
  
    // Helper function to calculate distance between two points
    function getDistance(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
  
    // Initialize the app
    init();
  });