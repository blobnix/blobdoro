const timerDisplay = document.getElementById('timer-display');
const sessionDots = document.getElementById('session-dots');
const workSession = document.getElementById('work-session');
const breakSession = document.getElementById('break-session')
const longBreakSession = document.getElementById('longbreak-session')

const start = document.getElementById('start');
const pause = document.getElementById('pause');
const reset = document.getElementById('reset');
const skip = document.getElementById('skip');
const pictureInPictureButton = document.getElementById('picture-in-picture');

const overlay = document.getElementById('settings-overlay');
const closeSettings = document.getElementById('close-settings');
const setting = document.getElementById('setting');

const workTimeInput = document.getElementById('work-time');
const breakTimeInput = document.getElementById('break-time');
const longBreakTimeInput = document.getElementById('longbreak-time');

const autoBreakInput = document.getElementById('auto-break');
const musicInput = document.getElementById('music');
const saveSettings = document.getElementById('save-settings');
let savedAutoBreak = autoBreakInput.checked;
let savedMusic = musicInput.checked;

const backgroundMusic = new Audio();
backgroundMusic.volume = 0.35;
let bellAudioContext = null;
let shuffledMusicTracks = [];
let lastMusicTrack = null;

let workTime = 25;
let breakTime = 5;
let longbreakTime = 15;
let currentTime = workTime * 60;
let endTime = null;
let isRunning = false;
let isWork = true;
let sessionCount = 0;
let timer = null;
let pictureInPictureWindow = null;
let pictureInPictureTimer = null;
let pictureInPictureSession = null;
let pictureInPictureDots = null;

function runTimer() {
    if (!isRunning) {
        isRunning = true;
        endTime = Date.now() + currentTime * 1000;
        timer = setInterval( () => {
            currentTime = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            updateDisplay();
            if (currentTime <= 0) {
                clearInterval(timer);
                sessionComplete();
            }
        }, 250)
    }
    start.style.display = 'none';
    pause.style.display = '';
    startBackgroundMusic();
};


function pauseTimer() {
    clearInterval(timer);
    if (isRunning && endTime) {
        currentTime = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    }
    isRunning = false;
    endTime = null;
    pause.style.display = 'none';
    start.style.display = '';
    backgroundMusic.pause();
};


function resetTimer() {
    pauseTimer();

    if (isWork) {
        currentTime = workTime * 60;
        updateDisplay();
        workSession.style.display = '';
        breakSession.style.display = 'none';
        longBreakSession.style.display = 'none';
    } else {
        if (sessionCount % 4 == 0) {
            currentTime = longbreakTime * 60;
            updateDisplay();
            workSession.style.display = 'none';
            breakSession.style.display = 'none';
            longBreakSession.style.display = '';
        } else {
            currentTime = breakTime * 60;
            workSession.style.display = 'none';
            breakSession.style.display = '';
            longBreakSession.style.display = 'none';
            updateDisplay();
        }
    }
    updateDisplay()
    pause.style.display = 'none';
    start.style.display = '';

    if (autoBreakInput.checked) {
        runTimer();
    }
};


function sessionComplete() {
    playBellSound()
    pauseTimer();

    if (isWork) {
        sessionCount++;
    }

    isWork = !isWork;

    if (isWork) {
        currentTime = workTime * 60;
        updateDisplay();
        workSession.style.display = '';
        breakSession.style.display = 'none';
        longBreakSession.style.display = 'none';
    } else {
        if (sessionCount % 4 == 0) {
            currentTime = longbreakTime * 60;
            updateDisplay();
            workSession.style.display = 'none';
            breakSession.style.display = 'none';
            longBreakSession.style.display = '';
        } else {
            currentTime = breakTime * 60;
            workSession.style.display = 'none';
            breakSession.style.display = '';
            longBreakSession.style.display = 'none';
            updateDisplay();
        }
    }

    pause.style.display = 'none';
    start.style.display = '';
    
    if (autoBreakInput.checked) {
        runTimer();
    }
};


function updateDisplay() {
    const remainingMinutes = Math.floor(currentTime / 60);
    const remainingSeconds = currentTime % 60;
    const formattedMinutes = String(remainingMinutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    const formattedTime = `${formattedMinutes}:${formattedSeconds}`;

    timerDisplay.textContent = formattedTime;

    if (pictureInPictureTimer) {
        let currentSessionLabel = 'Break Session';

        if (isWork) {
            currentSessionLabel = 'Work Session';
        } else if (sessionCount % 4 === 0) {
            currentSessionLabel = 'Long Break Session';
        }

        pictureInPictureTimer.textContent = formattedTime;
        pictureInPictureSession.textContent = currentSessionLabel;
    }

    updateSessionDots();
};



function updateSessionDots() {
    let completedDotCount = sessionCount % 4;

    if (sessionCount > 0 && sessionCount % 4 === 0 && !isWork) {
        completedDotCount = 4;
    }

    [sessionDots, pictureInPictureDots].forEach((dotGroup) => {
        if (!dotGroup) {
            return;
        }

        dotGroup.setAttribute('aria-label', `${completedDotCount} of 4 work sessions complete`);
        Array.from(dotGroup.children).forEach((dot, index) => {
            dot.classList.toggle('completed', index < completedDotCount);
        });
    });
}



function applySettings() {
    const durationInputs = [workTimeInput, breakTimeInput, longBreakTimeInput];

    for (const durationInput of durationInputs) {
        if (!durationInput.checkValidity()) {
            durationInput.reportValidity();
            return false;
        }
    }

    const configuredWorkTime = Number(workTimeInput.value);
    const configuredBreakTime = Number(breakTimeInput.value);
    const configuredLongBreakTime = Number(longBreakTimeInput.value);
    const hasTimerDurationChanged = configuredWorkTime !== workTime
        || configuredBreakTime !== breakTime
        || configuredLongBreakTime !== longbreakTime;

    workTime = configuredWorkTime;
    breakTime = configuredBreakTime;
    longbreakTime = configuredLongBreakTime;

    savedAutoBreak = autoBreakInput.checked;
    savedMusic = musicInput.checked;

    if (hasTimerDurationChanged) {
        resetTimer();
    } else if (isRunning && musicInput.checked) {
        startBackgroundMusic();
    } else {
        backgroundMusic.pause();
    }

    return true;
}




async function playNextMusicTrack() {
    if (!musicInput.checked || !isRunning) {
        return;
    }

    if (shuffledMusicTracks.length === 0) {
        try {
            const response = await fetch(new URL('music/playlist.json', document.baseURI), { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Playlist request failed: ${response.status}`);
            }

            const tracks = await response.json();
            shuffledMusicTracks = Array.isArray(tracks)
                ? tracks.filter((track) => typeof track === 'string' && /\.(mp3|ogg|wav|m4a)$/i.test(track))
                : [];

            for (let index = shuffledMusicTracks.length - 1; index > 0; index--) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [shuffledMusicTracks[index], shuffledMusicTracks[swapIndex]] =
                    [shuffledMusicTracks[swapIndex], shuffledMusicTracks[index]];
            }

            if (shuffledMusicTracks.length > 1 && shuffledMusicTracks[0] === lastMusicTrack) {
                const swapIndex = 1 + Math.floor(Math.random() * (shuffledMusicTracks.length - 1));
                [shuffledMusicTracks[0], shuffledMusicTracks[swapIndex]] =
                    [shuffledMusicTracks[swapIndex], shuffledMusicTracks[0]];
            }
        } catch (error) {
            console.error('Could not load the music playlist.', error);
            return;
        }
    }

    if (!musicInput.checked || !isRunning || shuffledMusicTracks.length === 0) {
        return;
    }

    lastMusicTrack = shuffledMusicTracks.shift();
    backgroundMusic.src = new URL(`music/${encodeURIComponent(lastMusicTrack)}`, document.baseURI).href;
    backgroundMusic.play().catch((error) => {
        console.warn('Music playback could not start.', error);
    });
}


function startBackgroundMusic() {
    if (!musicInput.checked) {
        return;
    }

    if (backgroundMusic.currentSrc && !backgroundMusic.ended) {
        backgroundMusic.play().catch((error) => {
            console.warn('Music playback could not start.', error);
        });
    } else {
        playNextMusicTrack();
    }
}

backgroundMusic.addEventListener('ended', playNextMusicTrack);


function playBellSound() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextConstructor) {
        console.warn('Bell playback is not supported by this browser.');
        return;
    }

    if (!bellAudioContext) {
        bellAudioContext = new AudioContextConstructor();
    }

    if (bellAudioContext.state === 'suspended') {
        bellAudioContext.resume();
    }

    const bellPartials = [
        { frequency: 880, volume: 0.16, duration: 1.2 },
        { frequency: 1320, volume: 0.07, duration: 0.85 },
        { frequency: 1760, volume: 0.035, duration: 0.6 }
    ];
    const startTime = bellAudioContext.currentTime;

    bellPartials.forEach((partial) => {
        const oscillator = bellAudioContext.createOscillator();
        const volume = bellAudioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(partial.frequency, startTime);
        volume.gain.setValueAtTime(partial.volume, startTime);
        volume.gain.exponentialRampToValueAtTime(0.001, startTime + partial.duration);

        oscillator.connect(volume);
        volume.connect(bellAudioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + partial.duration);
    });
}



function discardSettings() {
    workTimeInput.value = workTime;
    breakTimeInput.value = breakTime;
    longBreakTimeInput.value = longbreakTime;
    autoBreakInput.checked = savedAutoBreak;
    musicInput.checked = savedMusic;
}


start.addEventListener('click', () => {
    runTimer()

});

pause.addEventListener('click', () => {
    pauseTimer()

});

reset.addEventListener('click', () => {
    resetTimer()
});

skip.addEventListener('click', () => {
    sessionComplete();
});

saveSettings.addEventListener('click', () => {
    if (!applySettings()) {
        return;
    }

    overlay.style.display = 'none';
});

setting.addEventListener('click', () => {
    overlay.style.display = '';
});

closeSettings.addEventListener('click', () => {
    discardSettings();
    overlay.style.display = 'none';
});

overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
        discardSettings();
        overlay.style.display = 'none';
    }
});



pictureInPictureButton.addEventListener('click', async () => {
    if (!('documentPictureInPicture' in window)) {
        alert('Picture in Picture is not supported by this browser.');
        return;
    }

    pictureInPictureWindow = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 180
    });

    const stylesheet = document.querySelector('link[rel="stylesheet"]').cloneNode();
    pictureInPictureWindow.document.head.append(stylesheet);

    const background = pictureInPictureWindow.document.createElement('div');
    background.className = 'background';
    const main = pictureInPictureWindow.document.createElement('main');
    const timerCard = pictureInPictureWindow.document.createElement('div');
    timerCard.className = 'timer-card';
    pictureInPictureSession = pictureInPictureWindow.document.createElement('p');
    pictureInPictureSession.style.fontSize = '1rem';
    pictureInPictureTimer = pictureInPictureWindow.document.createElement('h1');
    pictureInPictureTimer.id = 'timer-display';
    pictureInPictureTimer.style.fontSize = '4rem';
    pictureInPictureDots = pictureInPictureWindow.document.createElement('div');
    pictureInPictureDots.className = 'session-dots';
    pictureInPictureDots.setAttribute('role', 'img');
    for (let dotIndex = 0; dotIndex < 4; dotIndex++) {
        const dot = pictureInPictureWindow.document.createElement('span');
        dot.setAttribute('aria-hidden', 'true');
        pictureInPictureDots.append(dot);
    }
    timerCard.append(pictureInPictureSession, pictureInPictureTimer, pictureInPictureDots);
    main.append(timerCard);
    pictureInPictureWindow.document.body.append(background, main);
    updateDisplay();
    pictureInPictureWindow.document.addEventListener('click', () => {
        if (isRunning) {
            pauseTimer();
        } else {
            runTimer();
        }
    });

    const activePictureInPictureWindow = pictureInPictureWindow;
    activePictureInPictureWindow.addEventListener('pagehide', () => {
        if (pictureInPictureWindow !== activePictureInPictureWindow) {
            return;
        }

        pictureInPictureWindow = null;
        pictureInPictureTimer = null;
        pictureInPictureSession = null;
        pictureInPictureDots = null;
    }, { once: true });
});
