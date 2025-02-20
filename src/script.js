(async () => {
  if (!('translation' in self) || !('createDetector' in self.translation)) {
    document.querySelector('.header-message').hidden = false;
    return;
  }

  const detector = await self.translation.createDetector();
  console.log(detector);
})();
