new Vue({
  el: '#app',
  data: {
    isLoggedIn: false,
    username: '',
    cards: [],
    flippedCards: [],
    movesLeft: 4,
    lockBoard: false,
    difficulty: 'easy',
    timeLeft: 20,
    timer: null,
    timerStarted: false,
    score: 0,
    highScore: 0,
    showModal: false,
    modalMessage: '',
    theme: 'default',
    showSettingsModal: false,
    showTutorialModal: false,

    difficultySettings: {
      easy: {
        rows: 2,
        cols: 2,
        moves: 4,
        time: 20,
        matchPoints: 100
      },
      medium: {
        rows: 3,
        cols: 4,
        moves: 10,
        time: 70,
        matchPoints: 150
      },
      hard: {
        rows: 4,
        cols: 5,
        moves: 25,
        time: 120,
        matchPoints: 200
      }
    },

    themeSettings: {
      default: {
        flipSound: 'https://raw.githubusercontent.com/kritish123/kuchbhi/main/flipcard-91468.mp3',
        values: {
          easy: ['🍎', '🍌'],
          medium: ['🍎', '🍌', '🍉', '🍇', '🍊', '🍍'],
          hard: ['🍎', '🍌', '🍉', '🍇', '🍊', '🍍', '🍓', '🍒', '🥭', '🍑']
        }
      },
      spring: {
        flipSound: 'https://raw.githubusercontent.com/kritish123/kuchbhi/main/spring-flip.mp3',
        values: {
          easy: ['🌸', '🌷'],
          medium: ['🌸', '🌷', '🍀', '🌹', '🌻', '🌼'],
          hard: ['🌸', '🌷', '🍀', '🌹', '🌻', '🌼', '🌱', '🌿', '🌺', '🌾']
        }
      },
      summer: {
        flipSound: 'https://raw.githubusercontent.com/kritish123/kuchbhi/main/summer-flip.mp3',
        values: {
          easy: ['🏖️', '🌞'],
          medium: ['🏖️', '🌞', '🍉', '🪐', '🍦', '🏊'],
          hard: ['🏖️', '🌞', '🍉', '🪐', '🍦', '🏊', '🩴', '🌴', '🦩', '🐠']
        }
      },
      autumn: {
        flipSound: 'https://raw.githubusercontent.com/kritish123/kuchbhi/main/autumn-flip.mp3',
        values: {
          easy: ['🍁', '🍂'],
          medium: ['🍁', '🍂', '🎃', '🌰', '🍎', '🌽'],
          hard: ['🍁', '🍂', '🎃', '🌰', '🍎', '🌽', '🦔', '🍄', '🦃', '🌾']
        }
      },
      winter: {
        flipSound: 'https://raw.githubusercontent.com/kritish123/kuchbhi/main/winter-flip.mp3',
        values: {
          easy: ['❄️', '☃️'],
          medium: ['❄️', '☃️', '🎄', '🧣', '🛷', '⛄'],
          hard: ['❄️', '☃️', '🎄', '🧣', '🛷', '⛄', '🧤', '🔥', '🦌', '🎅']
        }
      }
    }
  },

  mounted() {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      this.username = storedUsername;
      this.isLoggedIn = true;
      this.highScore = parseInt(localStorage.getItem(`highScore_${storedUsername}`), 10) || 0;

      this.$nextTick(() => {
        this.setTheme();
      });
    }
  },

  methods: {
    login() {
      const trimmedUsername = this.username.trim();

      if (trimmedUsername) {
        this.username = trimmedUsername;
        localStorage.setItem('username', this.username);
        this.isLoggedIn = true;
        this.highScore = parseInt(localStorage.getItem(`highScore_${this.username}`), 10) || 0;

        this.$nextTick(() => {
          this.setTheme();
        });
      }
    },

    logout() {
      localStorage.removeItem('username');
      this.isLoggedIn = false;
      this.username = '';
      this.score = 0;
      this.highScore = 0;
      this.stopTimer();
      this.closeSettings();
    },

    setTheme() {
      document.body.className = this.theme;

      this.$nextTick(() => {
        this.setDifficulty();
      });
    },

    openSettings() {
      this.showSettingsModal = true;
    },

    closeSettings() {
      this.showSettingsModal = false;
    },

    openTutorial() {
      this.showSettingsModal = false;
      this.showTutorialModal = true;
    },

    closeTutorial() {
      this.showTutorialModal = false;
    },

    shuffle(array) {
      return [...array].sort(() => Math.random() - 0.5);
    },

    setDifficulty() {
      const settings = this.difficultySettings[this.difficulty];
      const themeValues = this.themeSettings[this.theme].values[this.difficulty];
      const originalValues = [...themeValues, ...themeValues];

      this.movesLeft = settings.moves;
      this.timeLeft = settings.time;
      this.cards = [];
      this.flippedCards = [];
      this.lockBoard = false;
      this.score = 0;
      this.timerStarted = false;
      this.stopTimer();

      const gameBoard = document.querySelector('.game-board');

      if (gameBoard) {
        let cardWidth = 110;
        let cardHeight = 132;

        if (this.difficulty === 'medium') {
          cardWidth = 90;
          cardHeight = 108;
        }

        if (this.difficulty === 'hard') {
          cardWidth = 72;
          cardHeight = 88;
        }

        if (window.innerWidth <= 600) {
          if (this.difficulty === 'easy') {
            cardWidth = 90;
            cardHeight = 108;
          } else if (this.difficulty === 'medium') {
            cardWidth = 68;
            cardHeight = 84;
          } else {
            cardWidth = 52;
            cardHeight = 66;
          }
        }

        gameBoard.style.gridTemplateColumns = `repeat(${settings.cols}, ${cardWidth}px)`;
        gameBoard.style.gridTemplateRows = `repeat(${settings.rows}, ${cardHeight}px)`;
      }

      const shuffled = this.shuffle(originalValues);

      this.cards = shuffled.map(value => ({
        value,
        flipped: false,
        matched: false
      }));
    },

    restartGame() {
      this.stopTimer();
      this.setDifficulty();
    },

    flipCard(card) {
      if (this.lockBoard || card.flipped || card.matched) return;
      if (this.flippedCards.length >= 2) return;

      if (!this.timerStarted) {
        this.startTimer();
        this.timerStarted = true;
      }

      const flipAudio = new Audio(this.themeSettings[this.theme].flipSound);
      flipAudio.playbackRate = 2.0;
      flipAudio.play().catch(error => console.log('Error playing audio:', error));

      card.flipped = true;
      this.flippedCards.push(card);

      if (this.flippedCards.length === 2) {
        this.lockBoard = true;
        this.movesLeft--;

        if (this.flippedCards[0].value === this.flippedCards[1].value) {
          const matchAudio = new Audio('https://raw.githubusercontent.com/kritish123/kuchbhi/main/success.mp3');
          matchAudio.play().catch(error => console.log('Error playing audio:', error));

          this.score += this.difficultySettings[this.difficulty].matchPoints;
          this.flippedCards.forEach(c => {
            c.matched = true;
          });
          this.flippedCards = [];
          this.lockBoard = false;
          this.checkGameStatus();
        } else {
          const failAudio = new Audio('https://raw.githubusercontent.com/kritish123/kuchbhi/main/fail.mp3');
          failAudio.play().catch(error => console.log('Error playing audio:', error));

          setTimeout(() => {
            this.flippedCards.forEach(c => {
              c.flipped = false;
            });
            this.flippedCards = [];
            this.lockBoard = false;
            this.checkGameStatus();
          }, 800);
        }
      }
    },

    startTimer() {
      this.stopTimer();
      this.timeLeft = this.difficultySettings[this.difficulty].time;

      this.timer = setInterval(() => {
        this.timeLeft--;

        if (this.timeLeft <= 0) {
          this.stopTimer();
          this.modalMessage = "Time's up! Try again!";
          this.showModal = true;
          this.timerStarted = false;
        }
      }, 1000);
    },

    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      this.timerStarted = false;
    },

    checkGameStatus() {
      const allFlipped = this.cards.every(card => card.matched);

      if (allFlipped) {
        this.stopTimer();
        const timeBonus = Math.max(0, this.timeLeft * 10);
        this.score += timeBonus;

        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem(`highScore_${this.username}`, this.highScore);
        }

        this.modalMessage = 'Congratulations! You matched all cards!';
        this.showModal = true;
      } else if (this.movesLeft <= 0) {
        this.stopTimer();
        this.modalMessage = 'Game Over! Try again!';
        this.showModal = true;
      }
    },

    closeModal() {
      this.showModal = false;
      this.score = 0;
      this.restartGame();
    }
  }
});
