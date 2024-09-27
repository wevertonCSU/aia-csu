window.onload = function() {
    const logo = document.getElementById('logo');
    const text = document.getElementById('text');
    const textContainer = document.querySelector('.text-container');
    const footer = document.querySelector('.footer');
    const bgVideo = document.getElementById('bgVideo');
    const micButton = document.getElementById('micButton');
    const inputText = document.getElementById('inputText');
    const sendButton = document.getElementById('sendButton');
    const configButton = document.getElementById('configButton');
    const modal = document.getElementById('configModal');
    const closeModal = document.getElementById('closeModal');
    const voiceCloud = document.getElementById('voiceCloud');
    const voiceNative = document.getElementById('voiceNative');
    const audioDropdown = document.getElementById('audioDropdown');
    const playButton = document.getElementById('playButton');
    const volumeButton = document.getElementById('volumeButton');
    const voiceMuted = document.getElementById('voiceMuted');
    let pollyAudio = null;
    let synth = null;
    voiceCloud.checked = true;


    async function loadPollyVoices() {
        try {
            const response = await fetch('/voices');
            if (!response.ok) {
                throw new Error('Erro ao carregar vozes do Polly');
            }
            const voices = await response.json();
            populateDropdown(voices);
        } catch (error) {
            console.error('Erro ao carregar vozes do Polly:', error);
        }
    }


    async function playPollyAudio(text, voiceId = 'Camila') {
        try {
            const response = await fetch('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    voiceId
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar o áudio');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            pollyAudio = new Audio(audioUrl);

            pollyAudio.onplay = function() {
                bgVideo.src = 'assets/img/bg-2.mp4';
            };

            pollyAudio.onended = function() {
                bgVideo.src = 'assets/img/bg.mp4';
            };

            pollyAudio.play();
        } catch (error) {
            console.error('Erro ao gerar o áudio:', error);
        }
    }



    function loadSystemVoices() {
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();

        if (voices.length === 0) {
            synth.onvoiceschanged = () => {
                const updatedVoices = synth.getVoices().filter(voice => voice.lang.startsWith('pt-BR'));
                populateDropdown(updatedVoices);
            };
        } else {
            const filteredVoices = voices.filter(voice => voice.lang.startsWith('pt-BR'));
            populateDropdown(filteredVoices);
        }
    }

    function populateDropdown(voices) {
        audioDropdown.innerHTML = '';

        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.Id || voice.name;
            option.textContent = voice.Name || voice.name;
            audioDropdown.appendChild(option);
        });
    }

    window.speechSynthesis.onvoiceschanged = () => {
        if (voiceCloud.checked) {
            loadPollyVoices();
        }
    };

    const recognition = new(window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    const delayTime = 2000;

    const animationDuration = 1500;
    logo.style.transition = `transform ${animationDuration}ms cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity ${animationDuration}ms ease`;

    setTimeout(() => {
        logo.style.transform = 'translateY(-200px)';
        logo.style.opacity = '1';
    }, delayTime);

    setTimeout(() => {
        textContainer.classList.add('fadeIn');
        footer.classList.add('fadeIn');
    }, 2500);


    const startTextSpeech = (textToRead) => {
        synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(textToRead);

        const selectedVoiceName = audioDropdown.value;
        const voices = synth.getVoices();
        const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.lang = 'pt-BR';

        utterance.onstart = function() {
            bgVideo.src = 'assets/img/bg-2.mp4';
        };

        utterance.onend = function() {
            bgVideo.src = 'assets/img/bg.mp4';
        };

        synth.speak(utterance);
    };


    const sendText = async () => {
        const userInput = inputText.value.trim();
        if (userInput === "") {
            alert("O campo de texto está vazio.");
            return;
        }

        inputText.value = "";

        textContainer.textContent = "Dando uma rápida passeada pela memória para encontrar a resposta. Um instantinho!";
        textContainer.classList.add('loading');

        try {

            const response = await fetch('/lambda', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userInput
                })
            });


            if (!response.ok) {
                throw new Error('Erro na solicitação');
            }

            const responseText = await response.text();
            textContainer.textContent = responseText;
            textContainer.classList.remove('loading');
            const voiceId = audioDropdown.value;
            speechText(responseText, voiceId);

        } catch (error) {
            console.error('Erro ao enviar o texto:', error);
            textContainer.textContent = "Erro ao processar a solicitação.";
            textContainer.classList.remove('loading');
            const voiceId = audioDropdown.value;
            speechText("Houve algum problema em meu sistema. Tente novamente mais tarde.", voiceId);
        }
    };

    sendButton.onclick = sendText;

    micButton.onclick = () => {
        recognition.start();
    };

    recognition.onresult = function(event) {

        inputText.value = event.results[0][0].transcript;
    };

    recognition.onerror = function(event) {
        console.log('Erro no reconhecimento de voz:', event.error);
    };

    recognition.onstart = function() {
        micButton.classList.add('recording');
    };

    recognition.onend = function() {
        micButton.classList.remove('recording');
    };

    inputText.addEventListener('click', function(event) {
        const voiceId = audioDropdown.value;
        speechText("Olá, eu sou a AIA CSU. O que você quer saber sobre a CSU Digital?", voiceId);
    }, {
        once: true
    });

    inputText.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendText();
        }
    });


    configButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });


    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });


    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });


    window.addEventListener('keydown', (event) => {
        if (event.key === "Escape") {
            modal.style.display = 'none';
        }
    });


    voiceCloud.addEventListener('change', function() {
        if (voiceCloud.checked) {
            voiceNative.checked = false;
            loadPollyVoices();
        } else {
            voiceCloud.checked = true;
        }
    });

    voiceNative.addEventListener('change', function() {
        if (voiceNative.checked) {
            voiceCloud.checked = false;
            loadSystemVoices();
        } else {
            voiceNative.checked = true;
        }
    });


    playButton.addEventListener('click', () => {
        const text = "Olá essa é a nova voz do chat.";
        const voiceId = audioDropdown.value;
        speechText(text, voiceId);
    });

    function speechText(text, voiceId) {

        if (voiceMuted.checked && text !== "Olá essa é a nova voz do chat.") {
            return;
        }

        if (voiceNative.checked) {
            startTextSpeech(text);
        } else {
            playPollyAudio(text, voiceId);
        }
    }

    volumeButton.addEventListener('click', () => {
        voiceMuted.checked = !voiceMuted.checked;
        const volumeIcon = volumeButton.querySelector('i');

        if (voiceMuted.checked) {
            volumeIcon.classList.remove('fa-volume-high');
            volumeIcon.classList.add('fa-volume-xmark');
            console.log(voiceNative.checked);
            if (voiceNative.checked) {
                synth.cancel();
                bgVideo.src = 'assets/img/bg.mp4';
            } else {
                pollyAudio.pause();
                pollyAudio.currentTime = 0;
                bgVideo.src = 'assets/img/bg.mp4';
            }


        } else {
            volumeIcon.classList.remove('fa-volume-xmark');
            volumeIcon.classList.add('fa-volume-high');
        }
    });

};