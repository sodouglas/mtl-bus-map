import { useEffect, useState } from "react";
import type { WelcomeSlide } from "../welcomeSlides";
import { WELCOME_SLIDES } from "../welcomeSlides";

interface Props {
  onDismiss: () => void;
}

function resolveSrc(
  slide: WelcomeSlide,
  variant: "desktop" | "mobile",
): string | null {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const pick =
    variant === "desktop"
      ? (slide.gifSrcDesktop ?? slide.gifSrcMobile)
      : (slide.gifSrcMobile ?? slide.gifSrcDesktop);
  if (!pick) return null;
  const path = pick.replace(/^\/+/, "");
  return `${base}${path}`;
}

function SlideMedia({ slide }: { slide: WelcomeSlide }) {
  const deskSrc = resolveSrc(slide, "desktop");
  const mobSrc = resolveSrc(slide, "mobile");

  return (
    <div className="welcome-modal__media-wrap">
      <div className="welcome-modal__media welcome-modal__media--desktop">
        {deskSrc ? (
          <img src={deskSrc} alt="" className="welcome-modal__gif" />
        ) : (
          <div className="welcome-modal__placeholder">
            <span>Demo (desktop)</span>
          </div>
        )}
      </div>
      <div className="welcome-modal__media welcome-modal__media--mobile">
        {mobSrc ? (
          <img src={mobSrc} alt="" className="welcome-modal__gif" />
        ) : (
          <div className="welcome-modal__placeholder">
            <span>Demo (mobile)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function WelcomeModal({ onDismiss }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onDismiss();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onDismiss]);

  const slide = WELCOME_SLIDES[step];
  const isFirst = step === 0;
  const isLast = step === WELCOME_SLIDES.length - 1;
  const titleId = "welcome-modal-title";
  const paragraphs = slide.body.split(/\n\n+/).filter(Boolean);

  return (
    <div
      className="welcome-modal"
      role="presentation"
    >
      <div className="welcome-modal__backdrop" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="welcome-modal__panel"
      >
        <div className="welcome-modal__progress" aria-hidden>
          {WELCOME_SLIDES.map((_, i) => (
            <span
              key={WELCOME_SLIDES[i].id}
              className={`welcome-modal__dot${i === step ? " welcome-modal__dot--active" : ""}`}
            />
          ))}
        </div>

        <SlideMedia slide={slide} />

        <div className="welcome-modal__text">
          <h2 id={titleId} className="welcome-modal__title">
            {slide.title}
          </h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="welcome-modal__p">
              {p}
            </p>
          ))}
        </div>

        <div className="welcome-modal__footer">
          <button
            type="button"
            className="welcome-modal__skip"
            onClick={onDismiss}
          >
            Skip
          </button>
          <div className="welcome-modal__footer-actions">
            {!isFirst && (
              <button
                type="button"
                className="welcome-modal__back"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                className="welcome-modal__next"
                onClick={() => setStep((s) => Math.min(s + 1, WELCOME_SLIDES.length - 1))}
              >
                Next
              </button>
            )}
            {isLast && (
              <button
                type="button"
                className="welcome-modal__primary"
                onClick={onDismiss}
              >
                Get started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
