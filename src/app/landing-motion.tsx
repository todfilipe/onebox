"use client";

import { useRef } from "react";
import {
  motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

export const ease: [number, number, number, number] = [0.4, 0, 0.6, 1];

const stagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.32, ease } },
};

const inView = { once: true, margin: "-80px" } as const;

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Reveal({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="shown"
      viewport={inView}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div className={className} variants={rise}>
      {children}
    </motion.div>
  );
}

export function SectionText({
  eyebrow,
  title,
  titleClass = "headline-section",
  body,
  action,
}: {
  eyebrow?: string;
  title?: string;
  titleClass?: string;
  body?: string | string[];
  action?: React.ReactNode;
}) {
  return (
    <>
      {eyebrow && (
        <motion.p className="eyebrow" variants={rise}>
          {eyebrow}
        </motion.p>
      )}
      {title && (
        <motion.h2 className={titleClass} variants={rise}>
          {title}
        </motion.h2>
      )}
      {body &&
        (Array.isArray(body) ? body : [body]).map((text) => (
          <motion.p className="copy" key={text} variants={rise}>
            {text}
          </motion.p>
        ))}
      {action && (
        <motion.div className="section-link" variants={rise}>
          {action}
        </motion.div>
      )}
    </>
  );
}

export function HeroText({
  eyebrow,
  title,
  intro,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="wrap">
      <motion.p className="eyebrow" variants={rise}>
        {eyebrow}
      </motion.p>
      <motion.h1 className="headline-hero" variants={rise}>
        {title}
      </motion.h1>
      <motion.p className="intro" variants={rise}>
        {intro}
      </motion.p>
      <motion.div className="actions" variants={rise}>
        {children}
      </motion.div>
      <motion.p className="footnote" variants={rise}>
        {note}
      </motion.p>
    </Reveal>
  );
}

function between(value: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (value - from) / (to - from)));
}

export function WordReveal({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.4"],
  });
  const words = text.split(" ");

  return (
    <p ref={ref} className="statement">
      {words.map((word, i) => (
        <Word
          key={i}
          progress={scrollYProgress}
          from={i / words.length}
          to={(i + 1) / words.length}
          still={reduced}
        >
          {word}
        </Word>
      ))}
    </p>
  );
}

function Word({
  progress,
  from,
  to,
  still,
  children,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  from: number;
  to: number;
  still: boolean | null;
  children: string;
}) {
  const opacity = useTransform(
    progress,
    (p) => 0.2 + 0.8 * between(p, from, to),
  );

  return (
    <motion.span style={still ? undefined : { opacity }}>
      {children}{" "}
    </motion.span>
  );
}

export function HeroStage({
  intro,
  shot,
  reveal,
}: {
  intro: React.ReactNode;
  shot: React.ReactNode;
  reveal: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const introY = useTransform(scrollYProgress, [0, 0.6], ["0vh", "-60vh"]);
  // Na forma de função a opacidade não é acelerada por ScrollTimeline, que com sticky lia mal o progresso.
  const introOpacity = useTransform(
    scrollYProgress,
    (p) => 1 - between(p, 0.1, 0.45),
  );
  const shotY = useTransform(scrollYProgress, [0, 0.6], ["0vh", "80vh"]);
  const revealOpacity = useTransform(scrollYProgress, (p) =>
    between(p, 0.3, 0.6),
  );
  const revealScale = useTransform(scrollYProgress, [0.3, 0.6], [0.94, 1]);

  return (
    <section ref={ref} className="stage">
      <div className="stage-pin">
        <motion.div
          className="stage-intro centered"
          style={reduced ? undefined : { y: introY, opacity: introOpacity }}
        >
          {intro}
        </motion.div>
        <motion.div
          className="stage-shot"
          style={reduced ? undefined : { y: shotY }}
        >
          {shot}
        </motion.div>
        <motion.div
          className="stage-reveal centered"
          style={
            reduced ? undefined : { opacity: revealOpacity, scale: revealScale }
          }
        >
          {reveal}
        </motion.div>
      </div>
    </section>
  );
}

export function Parallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);

  return (
    <motion.div ref={ref} style={reduced ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
