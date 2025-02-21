(async () => {
  if ('ai' in self && 'languageDetector' in self.ai) {
    // The Language Detector API is available.
    document.querySelector('.header-message').hidden = false;
    console.log('Yes');
    return;
  }
})();

(async function detectLanguage() {
  // ELEMENT SELECTED
  const messageInput = document.getElementById('input');
  const messageOut = document.getElementById('output');
  const sendButton = document.getElementById('button');
  const detected = document.querySelector('.detect-text');

  // LANGUAGE DETECTOR API
  const languageDetectorCapabilities =
    await self.ai.languageDetector.capabilities();
  const detector = await self.ai.languageDetector.create();
  console.log(detector, languageDetectorCapabilities);

  // Function to send message
  const sendMessage = async () => {
    const message = messageInput.value.trim();
    if (!message) {
      detected.textContent = 'Not sure of which language you typed';
      return;
    }

    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.classList.add('message');

    messageOut.appendChild(messageElement);
    messageInput.value = '';

    const { detectedLanguage, confidence } = (
      await detector.detect(messageInput)
    )[0];

    detected.textContent = `I'm ${(confidence * 100).toFixed(
      1
    )} % sure that is the language you typed is`;
  };

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });

  // DETECT LANGUAGE
})();
