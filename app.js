// ข้อมูลแบบทดสอบ
const quizData = [
    {
      question: "นี่คือโมเดลของอะไร?",
      options: ["รถยนต์", "เครื่องบิน", "เรือ", "จักรยาน"],
      correctAnswer: 0,
      model: "assets/models/model1.glb",
      scale: "0.5 0.5 0.5",
      feedback: "ถูกต้อง! นี่คือโมเดลรถยนต์ไฟฟ้ารุ่นใหม่"
    },
    {
      question: "ส่วนสีแดงคืออะไร?",
      options: ["ประตู", "ล้อ", "กระจกหน้า", "ไฟท้าย"],
      correctAnswer: 2,
      model: "assets/models/model2.glb",
      scale: "0.5 0.5 0.5",
      feedback: "ใช่แล้ว! ส่วนสีแดงคือกระจกหน้าซึ่งออกแบบมาเป็นพิเศษ"
    }
  ];
  
  // ตัวแปรระบบ
  let currentQuestionIndex = 0;
  let score = 0;
  let startTime;
  let modelEntity = null;
  let currentScale = 1;
  let isDragging = false;
  let previousTouchPosition = { x: 0, y: 0 };
  let initialPinchDistance = 0;
  let initialScale = 1;
  
  // DOM Elements
  const startScreen = document.getElementById('start-screen');
  const loadingScreen = document.getElementById('loading-screen');
  const quizScreen = document.getElementById('quiz-screen');
  const resultScreen = document.getElementById('result-screen');
  const startButton = document.getElementById('start-button');
  const restartButton = document.getElementById('restart-button');
  const questionText = document.getElementById('question-text');
  const optionsContainer = document.getElementById('options-container');
  const questionCounter = document.getElementById('question-counter');
  const scoreDisplay = document.getElementById('score-display');
  const finalScore = document.getElementById('final-score');
  const correctAnswers = document.getElementById('correct-answers');
  const totalQuestions = document.getElementById('total-questions');
  const timeUsed = document.getElementById('time-used');
  const loadingText = document.getElementById('loading-text');
  const progressBar = document.getElementById('progress-bar');
  
  // เสียง
  const sounds = {
    correct: new Howl({ src: ['assets/sounds/correct.mp3'] }),
    wrong: new Howl({ src: ['assets/sounds/wrong.mp3'] })
  };
  
  // ตรวจสอบอุปกรณ์
  function checkDeviceCompatibility() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    if (!isMobile) {
      alert("สำหรับประสบการณ์ที่ดีที่สุด กรุณาใช้มือถือหรือแท็บเล็ต\n\nPlease use a mobile device for the best experience.");
    }
    
    return isMobile;
  }
  
  // Component สำหรับ responsive scale
  AFRAME.registerComponent('model-aligner', {
    schema: {
      offsetY: { type: 'number', default: 0 }
    },
  
    init: function() {
      this.camera = document.querySelector('[camera]');
      this.modelContainer = document.getElementById('model-container');
      window.addEventListener('resize', this.alignModel.bind(this));
    },
  
    alignModel: function() {
      if (!this.modelContainer || !this.modelContainer.object3D) return;
      
      // คำนวณตำแหน่งกลางหน้าจอ
      const camera = this.camera.object3D;
      const vector = new THREE.Vector3(0, 0, -1);
      vector.applyQuaternion(camera.quaternion);
      
      // ปรับตำแหน่งแนวตั้งตาม offsetY
      const offsetY = this.data.offsetY;
      this.el.setAttribute('position', {
        x: vector.x,
        y: vector.y + offsetY,
        z: vector.z
      });
      
      // ปรับขนาดโมเดลให้พอดีกับหน้าจอ
      this.adjustModelSize();
    },
  
    adjustModelSize: function() {
        const model = this.modelContainer.object3D;
        if (!model || !model.children[0]) return;
        
        const box = new THREE.Box3().setFromObject(model.children[0]);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const baseScale = 1.5 / maxDim;
        
        // เก็บเฉพาะ baseScale โดยไม่กำหนด scale โดยตรง
        this.modelContainer.setAttribute('data-base-scale', baseScale);
        
        // คำนวณ scale ใหม่จาก baseScale และ currentScale
        this.updateModelScale();
      },
      
      updateModelScale: function() {
        const baseScale = parseFloat(this.modelContainer.getAttribute('data-base-scale')) || 1;
        const newScale = baseScale * currentScale;
        
        this.modelContainer.setAttribute('scale', {
          x: newScale,
          y: newScale,
          z: newScale
        });
      },
  
    tick: function() {
      if (this.camera) {
        this.el.object3D.quaternion.copy(this.camera.object3D.quaternion);
      }
    }
  });
  
  // เริ่มการทดสอบ
  function startQuiz() {
    startScreen.style.display = 'none';
    loadingScreen.style.display = 'flex';
    
    // สมมติการโหลดทรัพยากร
    simulateLoading(() => {
      loadingScreen.style.display = 'none';
      quizScreen.style.display = 'block';
      document.querySelector('#ar-content').setAttribute('visible', 'true');
      startTime = new Date();
      loadQuestion(currentQuestionIndex);
    });
  }
  
  // โหลดคำถาม
  function loadQuestion(index) {
    if (index >= quizData.length) {
      endQuiz();
      return;
    }
  
    const question = quizData[index];
    questionText.textContent = question.question;
    questionCounter.textContent = `คำถามที่ ${index + 1}/${quizData.length}`;
    scoreDisplay.textContent = `คะแนน: ${score}`;
    
    // ล้างตัวเลือกเก่า
    optionsContainer.innerHTML = '';
    
    // เพิ่มตัวเลือกใหม่
    question.options.forEach((option, i) => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      button.textContent = option;
      button.addEventListener('click', () => selectAnswer(i));
      optionsContainer.appendChild(button);
    });
  
    // โหลดโมเดล 3D
    loadModel(question.model);
  }
  
  // โหลดโมเดล 3D
  function loadModel(modelPath) {
    const modelContainer = document.getElementById('model-container');
    
    // ลบโมเดลเก่าถ้ามี
    if (modelEntity) {
      modelContainer.removeChild(modelEntity);
    }
  
    // สร้างโมเดลใหม่
    modelEntity = document.createElement('a-entity');
    modelEntity.setAttribute('gltf-model', `url(${modelPath})`);
    modelEntity.setAttribute('rotation', '0 0 0');
    
    modelContainer.appendChild(modelEntity);
    
    // รีเซ็ตการควบคุม
    currentScale = 1;
    
    // เรียกการจัดตำแหน่งใหม่หลังจากโมเดลโหลดเสร็จ
    modelEntity.addEventListener('model-loaded', () => {
      const aligner = document.querySelector('[model-aligner]');
      if (aligner && aligner.components['model-aligner']) {
        aligner.components['model-aligner'].alignModel();
      }
    });
  }
  
  // เลือกคำตอบ
  function selectAnswer(selectedIndex) {
    const currentQuestion = quizData[currentQuestionIndex];
    const optionButtons = document.querySelectorAll('.option-btn');
    
    // ปิดการคลิกปุ่มชั่วคราว
    optionButtons.forEach(btn => {
      btn.style.pointerEvents = 'none';
    });
  
    // ตรวจสอบคำตอบ
    if (selectedIndex === currentQuestion.correctAnswer) {
      // คำตอบถูกต้อง
      optionButtons[selectedIndex].classList.add('correct');
      sounds.correct.play();
      score += 10;
      scoreDisplay.textContent = `คะแนน: ${score}`;
      
      // แสดงคำติชม
      questionText.textContent = currentQuestion.feedback || "ถูกต้อง!";
    } else {
      // คำตอบผิด
      optionButtons[selectedIndex].classList.add('wrong');
      optionButtons[currentQuestion.correctAnswer].classList.add('correct');
      sounds.wrong.play();
      
      // แสดงคำติชม
      questionText.textContent = "ยังไม่ถูกต้อง! " + (currentQuestion.feedback || "");
    }
  
    // ไปคำถามถัดไปหลังจากดีเลย์
    setTimeout(() => {
      currentQuestionIndex++;
      loadQuestion(currentQuestionIndex);
    }, 2000);
  }
  
  // จบการทดสอบ
  function endQuiz() {
    const endTime = new Date();
    const timeSpent = Math.floor((endTime - startTime) / 1000);
    
    quizScreen.style.display = 'none';
    resultScreen.style.display = 'flex';
    document.querySelector('#ar-content').setAttribute('visible', 'false');
    
    finalScore.textContent = score;
    correctAnswers.textContent = score / 10;
    totalQuestions.textContent = quizData.length;
    timeUsed.textContent = timeSpent;
  }
  
  // เริ่มใหม่
  function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    resultScreen.style.display = 'none';
    startQuiz();
  }
  
  // จำลองการโหลด
  function simulateLoading(callback) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 100) progress = 100;
      
      progressBar.style.width = `${progress}%`;
      loadingText.textContent = getLoadingMessage(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(callback, 500);
      }
    }, 300);
  }
  
  function getLoadingMessage(progress) {
    if (progress < 30) return "กำลังเตรียมสภาพแวดล้อม AR...";
    if (progress < 60) return "กำลังโหลดโมเดล 3D...";
    if (progress < 90) return "กำลังเตรียมแบบทดสอบ...";
    return "พร้อมแล้ว!";
  }
  
  // การควบคุมโมเดล
  function setupModelControls() {
    const scene = document.querySelector('a-scene');
    
    // การหมุนด้วยการลาก
    scene.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousTouchPosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
        
        // หยุด animation ขณะลาก
        if (modelEntity) {
          modelEntity.components.animation.pause();
        }
      } else if (e.touches.length === 2) {
        // ซูมด้วย pinch
        isDragging = false;
        initialPinchDistance = getDistance(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        initialScale = currentScale;
      }
    });
  
    scene.addEventListener('touchmove', (e) => {
      if (!modelEntity) return;
      
      // การหมุน
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
      // การซูม
      else if (e.touches.length === 2) {
        const currentDistance = getDistance(
          e.touches[0].clientX, e.touches[0].clientY,
          e.touches[1].clientX, e.touches[1].clientY
        );
        
        if (initialPinchDistance > 0) {
            const scaleFactor = currentDistance / initialPinchDistance;
            currentScale = Math.max(0.3, Math.min(3, initialScale * scaleFactor));
            
            // เรียกใช้ฟังก์ชันอัปเดต scale ใหม่
            const aligner = document.querySelector('[model-aligner]');
            if (aligner && aligner.components['model-aligner']) {
              aligner.components['model-aligner'].updateModelScale();
            }
          }
        }
      });
  
    scene.addEventListener('touchend', () => {
      isDragging = false;
      initialPinchDistance = 0;
      
      // เริ่ม animation ใหม่เมื่อปล่อย
      if (modelEntity) {
        modelEntity.components.animation.play();
      }
    });
  
    // สำหรับ Desktop
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };
  
    scene.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      
      if (modelEntity) {
        modelEntity.components.animation.pause();
      }
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
      if (modelEntity) {
        modelEntity.components.animation.play();
      }
    });
  
    // ซูมด้วยเมาส์ wheel
    scene.addEventListener('wheel', (e) => {
      if (!modelEntity) return;
      
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      currentScale = Math.max(0.3, Math.min(3, currentScale + delta));
      updateModelScale();
    });
  }
  
  function updateModelScale() {
    if (!modelEntity) return;
    
    const originalScale = modelEntity.getAttribute('data-original-scale');
    const scaleArray = originalScale.split(' ').map(parseFloat);
    
    const newScale = {
      x: scaleArray[0] * currentScale,
      y: scaleArray[1] * currentScale,
      z: scaleArray[2] * currentScale
    };
    
    modelEntity.setAttribute('scale', `${newScale.x} ${newScale.y} ${newScale.z}`);
  }
  
  function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  // เริ่มต้นแอป
  function init() {
    checkDeviceCompatibility();
    setupModelControls();
    
    startButton.addEventListener('click', startQuiz);
    restartButton.addEventListener('click', restartQuiz);
  }
  
  // เริ่มแอปเมื่อ DOM โหลดเสร็จ
  document.addEventListener('DOMContentLoaded', init);