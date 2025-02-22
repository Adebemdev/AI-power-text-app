class TextProcessor {
  constructor() {
    this.originalText = '';
    this.initializeElements();
    this.setupEventListeners();
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      messageInput: document.getElementById('input'),
      messageOutput: document.getElementById('output'),
      translateButton: document.getElementById('translateButton'),
      summarizeButton: document.getElementById('summarize'),
      targetLanguage: document.getElementById('translate'),
      detectedLanguage: document.querySelector('span'),
      displayOutput: document.getElementById('displayOutput'),
      actionButtons: document.getElementById('actionButtons'),
      displayButton: document.getElementById('displayButton'),
      form: document.querySelector('form'),
      summaryOutput: document.getElementById('summarize-text'),
    };

    // Validate required elements
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        console.error(`Missing required element: ${key}`);
      }
    });
  }

  // Set up event listeners
  setupEventListeners() {
    // Display button event
    this.elements.displayButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleDisplay();
    });
    this.elements.translateButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleTranslate();
    });

    this.elements.summarizeButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleSummarize();
      console.log('Summarizing the text...');
    });

    this.elements.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleTranslate();
      }
    });

    this.elements.form.addEventListener('submit', (e) => e.preventDefault());
  }

  handleDisplay() {
    const text = this.elements.messageInput.value.trim();
    if (!text) {
      this.showError('Please enter some text first.');
      return;
    }
    this.originalText = text;
    // Display the text in the output area
    this.elements.displayOutput.textContent = text;
    // Reveal the translate and summarize buttons container
    this.elements.actionButtons.removeAttribute('hidden');
  }

  // Convert language code to readable format
  languageTagToHumanReadable(languageTag, targetLanguage) {
    try {
      const displayName = new Intl.DisplayNames([targetLanguage], {
        type: 'language',
      });
      return displayName.of(languageTag);
    } catch (error) {
      console.error('Error converting language tag:', error);
      return languageTag;
    }
  }

  // Handle translation process
  async handleTranslate() {
    const message = this.elements.messageInput.value.trim();
    if (!message) {
      this.showError('Please enter some text to translate');
      return;
    }

    try {
      // Show hidden elements when translation starts
      document.querySelectorAll('[hidden]').forEach((el) => {
        if (!el.classList.contains('not-supported-message')) {
          el.removeAttribute('hidden');
        }
      });

      await this.detectLanguage(message);
      await this.translateText(message);
    } catch (error) {
      this.showError('Translation failed: ' + error.message);
    }
  }

  // Detect language
  async detectLanguage(text) {
    if (!('ai' in self && 'languageDetector' in self.ai)) {
      throw new Error('Language detection not supported');
    }

    try {
      const detector = await ai.languageDetector.create();
      const [{ detectedLanguage, confidence }] = await detector.detect(text);
      const languageName = this.languageTagToHumanReadable(
        detectedLanguage,
        'en'
      );

      this.elements.detectedLanguage.textContent = `${(
        confidence * 100
      ).toFixed(1)}% sure that this is ${languageName}`;
    } catch (error) {
      throw new Error('Language detection failed');
    }
  }

  // Translate text
  async translateText(text) {
    try {
      const translator = await ai.translator.create({
        sourceLanguage: 'en',
        targetLanguage: this.elements.targetLanguage.value,
      });

      const translatedText = await translator.translate(text);
      this.elements.messageOutput.textContent = translatedText;
      this.elements.messageInput.value = '';
    } catch (error) {
      throw new Error('Translation failed');
    }
  }

  // Handle summarization process
  async handleSummarize() {
    let text = this.elements.messageInput.value.trim();
    if (!text && this.originalText) {
      text = this.originalText;
    }
    if (!text) {
      this.showError('Please enter some text to summarize');
      return;
    }

    try {
      await this.summarizeText(text);
    } catch (error) {
      this.showError('Summarization failed: ' + error.message);
    }
  }

  // Summarize text
  async summarizeText(text) {
    if (!('ai' in self && 'summarizer' in self.ai)) {
      throw new Error('Summarization not supported');
    }

    const options = {
      sharedContext: 'This is a scientific article',
      type: 'key-points',
      format: 'markdown',
      length: 'medium',
    };

    let summarizer;
    const available = (await self.ai.summarizer.capabilities()).available;
    console.log(available);
    try {
      if (available === 'no') {
        // The Summarizer API isn't usable.
        return;
      }
      if (available === 'readily') {
        // The Summarizer API can be used immediately .
        summarizer = await self.ai.summarizer.create(options);
        const summary = await summarizer.summarize(text);
        this.elements.summaryOutput.textContent = summary;
      } else {
        // The Summarizer API can be used after the model is downloaded.
        summarizer = await self.ai.summarizer.create(options);

        summarizer.addEventListener('downloadprogress', (e) => {
          console.log(e.loaded, e.total);
        });
        await summarizer.ready;
      }
    } finally {
      if (summarizer) summarizer.destroy();
    }
  }

  // UI helper function for errors
  showError(message) {
    console.error(message);
    // You could add a proper error display UI here
    this.elements.messageOutput.textContent = message;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TextProcessor();
});
