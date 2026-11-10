/** Shows slides[at] (.is-active); the others turn inert, so screen readers and the Tab key skip them. */
export const showOnly = (slides: HTMLElement[], at: number) =>
  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === at);
    slide.inert = i !== at;
  });
