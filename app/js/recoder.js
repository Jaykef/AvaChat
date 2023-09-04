// recorder.js
let recorder = null;
let stream = null;
let isRecording = false;
let recognition = null;
let recordedAudio = null;


export async function openMicrophone() {
  if (!isRecording) {

    // Get selected language and dialect
    const languageSelect = document.getElementById("select_language");
    const dialectSelect = document.getElementById("select_dialect");
    const selectedLanguage = languageSelect.value;
    const selectedDialect = dialectSelect.value;

    // Start recording
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream, {
      type: 'audio/ogg; codecs=opus'
    });

    // Initialize speech recognition
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set language and dialect
    recognition.lang = selectedLanguage + "-" + selectedDialect;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;

      // Update the input element with the recognized speech
      const userInput = document.querySelector(".input");
      userInput.value = transcript;
    };

    // Start speech recognition
    recognition.start();

    // Start the recording
    recorder.start();
    isRecording = true;
  } else {
    // Stop recording
    recorder.stop();
    isRecording = false;

    // Stop speech recognition
    recognition.stop();
    closeMicrophone();
  }
}

export function closeMicrophone() {
  // Release resources
  const tracks = stream.getTracks();
  tracks.forEach(track => {
    track.stop();
  });
}
const end = document.getElementById('destroy-button')
end.addEventListener('click', function() {
    closeMicrophone();
})

// Load languages and dialects
function loadLanguages() {
  const languageSelect = document.getElementById("select_language");
  const dialectSelect = document.getElementById("select_dialect");

  // Iterate over the languages and populate the language select options
  langs.forEach(language => {
    const option = document.createElement("option");
    option.value = language[1][0];
    option.text = language[0];
    languageSelect.appendChild(option);
  });

  // Set the default dialect for the selected language
  setDialects();
}

// Set the dialects based on the selected language
function setDialects() {
  const languageSelect = document.getElementById("select_language");
  const dialectSelect = document.getElementById("select_dialect");
  const selectedLanguage = languageSelect.value;

  // Clear the dialect select options
  dialectSelect.innerHTML = "";

  // Find the selected language in the langs array
  const selectedLang = langs.find(lang => lang[1][0] === selectedLanguage);

  // Iterate over the dialects of the selected language and populate the dialect select options
  for (let i = 1; i < selectedLang.length; i++) {
    const option = document.createElement("option");
    option.value = selectedLang[i][1];
    option.text = selectedLang[i][0];
    dialectSelect.appendChild(option);
  }
}

window.onload = () => {
  // Load languages and set default dialects
  loadLanguages();

  // Add event listeners to language and dialect select elements
  const languageSelect = document.getElementById("select_language");
  const dialectSelect = document.getElementById("select_dialect");

  languageSelect.addEventListener("change", () => {
    setDialects();
  });

  const startButton = document.getElementById("start_button");
  const startImg = document.getElementById("start_img");

  startButton.addEventListener("click", () => {
    openMicrophone();
    // if (!isRecording) {
    //   startImg.src = "images/mic-animation.gif";
    // } else {
    //   startImg.src = "images/mic.gif";
    // }
  });
};
