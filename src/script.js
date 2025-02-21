(async () => {
  /*
   *Getting the elements from the DOM
   */
  const messageInput = document.getElementById('input');
  const messageOut = document.getElementById('output');
  const sendButton = document.getElementById('translateButton');
  const targetLanguage = document.getElementById('translate');
  const detected = document.querySelector('span');
  const form = document.querySelector('form');
  const summaryButton = document.getElementById('summarize');
  const summaryText = document.getElementById('summarize-text');
  const loadingSpinner = document.getElementById('loading-spinner');

  /*
   * Function to send the message
   * Detecting the language of the message
   * Translating Text
   */
  const sendMessage = async () => {
    const message = messageInput.value.trim();
    console.log(message);
    if (!message) {
      detected.textContent = 'Not sure what you are saying';
      return;
    }

    if (message) {
      detectAndDisplayLanguage(message, detected);
      translateAndDisplayMessage(
        message,
        targetLanguage,
        messageInput,
        messageOut
      );
    }

    if ('createTranslator' in self.translation) {
      document
        .querySelectorAll('[hidden]:not(.not-supported-message)')
        .forEach((el) => {
          el.removeAttribute('hidden');
        });
    }

    return message;
  };

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });

  /*
   * Function to handle form submission
   * Prevent the default form submission
   */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
  });

  summaryButton.addEventListener('click', async () => {
    const value = await sendMessage();
    console.log(value);
    SummarizeAndDisplayMessage(value);
  });

  /*
   * Function to convert the Language to Human Readable Format
   */
  const languageTagToHumanReadable = (languageTag, targetLanguage) => {
    const displayName = new Intl.DisplayNames([targetLanguage], {
      type: 'language',
    });
    return displayName.of(languageTag);
  };

  /*
   * Checking if the Language Detector API is available
   * Function to detect the language of the message
   * Display the result in the Provided Element
   * Handle errors gracefully
   * If availabe, show the message
   */

  if ('ai' in self && 'languageDetector' in self.ai) {
    document.querySelector('.header-message').hidden = false;
    console.log('Yes');
    return;
  }
  async function detectAndDisplayLanguage(message, detectedElement) {
    try {
      const detector = await ai.languageDetector.create();

      const { detectedLanguage, confidence } = (
        await detector.detect(message)
      )[0];

      const languageName = languageTagToHumanReadable(detectedLanguage, 'en');

      detectedElement.textContent = `${(confidence * 100).toFixed(
        1
      )}% sure that this is ${languageName}`;
    } catch (error) {
      console.error('Error detecting language:', error);
      detectedElement.textContent =
        'Failed to detect the language. Please try again.';
    }
  }

  /*
   * Function to translate the message
   * Get the target language value;
   * Create a translator
   */

  async function translateAndDisplayMessage(
    message,
    targetLanguage,
    messageInput,
    messageOut
  ) {
    try {
      const value = targetLanguage.value;

      const translator = await ai.translator.create({
        sourceLanguage: 'en',
        targetLanguage: value,
      });

      const text = await translator.translate(message);

      messageInput.value = '';

      messageOut.textContent = text;
    } catch (error) {
      console.error('Error translating message:', error);
      messageOut.textContent =
        'Failed to translate the message. Please try again.';
    }
  }

  /*
   * Function to Summarize the message

  */
  async function SummarizeAndDisplayMessage(message) {
    console.log(message);

    loadingSpinner.style.display = 'block';

    if ('ai' in self && 'summarizer' in self.ai) {
      // The Summarizer API is supported.
      console.log('Summarizer API is supported');
    }

    const options = {
      sharedContext: 'This is a scientific article',
      type: 'key-points',
      format: 'markdown',
      length: 'medium',
    };

    const summarierCapabilities = await ai.summarizer.capabilities();
    console.log(summarierCapabilities);
    let summarizer;
    try {
      if (summarierCapabilities && summarierCapabilities.available !== 'no') {
        if (summarierCapabilities.available === 'readily') {
          summarizer = await ai.summarizer.create(options);

          const result = await summarizer.summarize(message);

          outputElement.textContent = result;
        } else {
          summarizer = await ai.summarizer.create({
            monitor(m) {
              m.addEventListener('downloadprogress', (e) => {
                console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
              });
            },
          });
        }
      }
    } catch (error) {
      console.error('Error creating summarizer:', error);
      throw new Error('Failed to summarize the text. Please try again.');
    } finally {
      if (summarizer) {
        summarizer.destroy();
      }
    }
  }
})();
// SummarizeAndDisplayMessage();
