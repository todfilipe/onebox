"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { categoryLabels } from "@/lib/category-labels";
import icon from "./icon.png";
import { ease } from "./landing-motion";

const cascade: Variants = {
  hidden: {},
  shown: { transition: { delayChildren: 0.12, staggerChildren: 0.07 } },
};

const arrive: Variants = {
  hidden: { opacity: 0, y: -10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.32, ease } },
};

const seen = { once: true, margin: "-60px" } as const;

type Email = {
  account: string;
  sender: string;
  subject: string;
  category: "alta" | "media" | "baixa";
  summary: string;
  time: string;
  unread: boolean;
};

const inbox: Email[] = [
  {
    account: "T",
    sender: "Ana Marques",
    subject: "Proposta revista para sexta",
    category: "alta",
    summary: "Precisa da tua confirmação até sexta e anexa o orçamento final.",
    time: "09:24",
    unread: true,
  },
  {
    account: "P",
    sender: "Rita Nogueira",
    subject: "Jantar de sábado",
    category: "media",
    summary: "Confirma a hora e pergunta se levas a sobremesa.",
    time: "08:51",
    unread: true,
  },
  {
    account: "U",
    sender: "Secretaria Académica",
    subject: "Inscrição em época especial",
    category: "alta",
    summary: "O prazo acaba na terça e falta submeter o comprovativo.",
    time: "08:10",
    unread: false,
  },
  {
    account: "T",
    sender: "GitHub",
    subject: "Deploy concluído em oneboxai.me",
    category: "baixa",
    summary: "O workflow correu sem erros em 2 minutos.",
    time: "07:32",
    unread: false,
  },
  {
    account: "P",
    sender: "EDP Comercial",
    subject: "Fatura de setembro disponível",
    category: "baixa",
    summary: "Débito direto já agendado, nada a fazer.",
    time: "Ontem",
    unread: false,
  },
  {
    account: "T",
    sender: "João Pires",
    subject: "Reunião de kickoff movida",
    category: "media",
    summary: "Passou para quinta às 10h, na mesma sala.",
    time: "Ontem",
    unread: false,
  },
  {
    account: "U",
    sender: "Prof. Marta Lopes",
    subject: "Enunciado do projeto final",
    category: "media",
    summary: "Enunciado em anexo, entrega marcada para 14 de outubro.",
    time: "Seg",
    unread: false,
  },
  {
    account: "A",
    sender: "Booking.com",
    subject: "Confirmação da reserva no Porto",
    category: "baixa",
    summary: "Duas noites confirmadas, check-in a partir das 15h.",
    time: "Seg",
    unread: false,
  },
];

const incoming: Email[] = [
  {
    account: "T",
    sender: "Carla Mendes",
    subject: "Cliente quer reunir amanhã",
    category: "alta",
    summary: "Pede para rever o contrato antes das 11h e quer resposta hoje.",
    time: "agora",
    unread: true,
  },
  {
    account: "P",
    sender: "Inês Rocha",
    subject: "Voo alterado para amanhã",
    category: "alta",
    summary: "O voo passou para as 7h40 e o check-in fecha às 6h.",
    time: "agora",
    unread: true,
  },
  {
    account: "U",
    sender: "Serviços Académicos",
    subject: "Propina com prazo na sexta",
    category: "alta",
    summary: "Falta pagar a última prestação, com multa a partir de segunda.",
    time: "agora",
    unread: true,
  },
];

function Row({
  email,
  details = true,
  pulse = false,
  delay = 0,
  ...motionProps
}: {
  email: Email;
  details?: boolean;
  pulse?: boolean;
  delay?: number;
} & HTMLMotionProps<"div">) {
  const dot = !email.unread
    ? "shot-dot shot-dot-read"
    : pulse
      ? "shot-dot shot-dot-new"
      : "shot-dot";

  return (
    <motion.div className="shot-row" variants={arrive} {...motionProps}>
      <span className={dot} />
      <span className="shot-badge">{email.account}</span>
      <p className="shot-sender">{email.sender}</p>
      <p className="shot-subject">{email.subject}</p>
      <AnimatePresence initial={false}>
        {details && (
          <motion.span
            key="pill"
            className={`pill pill-${email.category}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.32, ease, delay }}
          >
            {categoryLabels[email.category]}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {details && (
          <motion.p
            key="summary"
            className="shot-summary"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease, delay }}
          >
            {email.summary}
          </motion.p>
        )}
      </AnimatePresence>
      <span className="shot-time">{email.time}</span>
    </motion.div>
  );
}

export function InboxShot() {
  return (
    <div
      className="shot"
      role="img"
      aria-label="A inbox do OneBox com emails de três contas Gmail numa só lista, cada um com um resumo de uma linha e uma etiqueta de importância."
    >
      <motion.div
        className="shot-inner"
        aria-hidden="true"
        variants={cascade}
        initial="hidden"
        whileInView="shown"
        viewport={seen}
      >
        <motion.div className="shot-bar" variants={arrive}>
          <Image src={icon} alt="" width={24} height={24} />
          <span className="shot-search">
            <SearchIcon />
            Pesquisar em todas as contas
          </span>
          <span className="shot-avatar" />
        </motion.div>
        <motion.div className="shot-chips" variants={arrive}>
          <span className="chip chip-active">Todos</span>
          <span className="chip">Alta</span>
          <span className="chip">Média</span>
          <span className="chip">Baixa</span>
        </motion.div>
        {inbox.map((email) => (
          <Row key={email.subject} email={email} />
        ))}
      </motion.div>
    </div>
  );
}

const steps = [
  {
    title: "Todas as contas, uma caixa.",
    body: "Ligas as contas Gmail uma vez e tudo passa a chegar ao mesmo sítio. Cada linha mostra de que conta veio.",
  },
  {
    title: "A IA lê cada email.",
    body: "Assim que um email chega, a Gemini escreve um resumo de uma linha e marca-o como alta, média ou baixa importância.",
  },
  {
    title: "Vês primeiro o que é urgente.",
    body: "Um toque em Alta e ficas só com o que precisa de ti hoje. O resto continua lá, à tua espera.",
  },
];

const triageBase = inbox.filter((_, i) => [0, 1, 2, 3, 7].includes(i));

const accounts = [
  ["P", "pessoal"],
  ["T", "trabalho"],
  ["U", "faculdade"],
  ["A", "antiga"],
];

const filters = ["Todos", "Alta", "Média", "Baixa"];

function useMatchMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

export function TriageSection({ action }: { action: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const still = useMatchMedia(
    "(prefers-reduced-motion: reduce), (max-height: 560px)",
  );
  const visible = useInView(ref);
  const [scrollPhase, setScrollPhase] = useState(0);
  const [arrivals, setArrivals] = useState<{ key: string; email: Email }[]>([]);
  const arrivalCount = useRef(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = progress < 0.3 ? 0 : progress < 0.65 ? 1 : 2;
    setScrollPhase(next);
    if (next !== 2) setArrivals((list) => (list.length ? [] : list));
  });

  const phase = still ? 1 : scrollPhase;

  useEffect(() => {
    if (phase !== 2 || !visible) return;
    const timer = setInterval(() => {
      const n = arrivalCount.current++;
      setArrivals((list) =>
        [
          { key: `nova-${n}`, email: incoming[n % incoming.length]! },
          ...list,
        ].slice(0, 2),
      );
    }, 3500);
    return () => clearInterval(timer);
  }, [phase, visible]);

  const rows =
    phase === 2
      ? [
          ...arrivals,
          ...triageBase
            .filter((email) => email.category === "alta")
            .map((email) => ({ key: email.subject, email })),
        ]
      : triageBase.map((email) => ({ key: email.subject, email }));

  return (
    <section ref={ref} className={still ? "triage triage-still" : "triage"}>
      <div className="triage-pin">
        <div className="wrap triage-grid">
          <div>
            <p className="eyebrow">Como funciona</p>
            <div className="triage-steps">
              {steps.map((step, i) => {
                const current = still || i === phase;
                return (
                  <motion.div
                    key={step.title}
                    aria-hidden={!current}
                    initial={false}
                    animate={{
                      opacity: current ? 1 : 0,
                      y: current ? 0 : i < phase ? -16 : 16,
                    }}
                    transition={{ duration: 0.32, ease }}
                  >
                    <h2 className="headline-gallery">{step.title}</h2>
                    <p className="copy">{step.body}</p>
                  </motion.div>
                );
              })}
            </div>
            <div className="triage-progress" aria-hidden="true">
              {steps.map((step, i) => (
                <span
                  key={step.title}
                  className={i === phase ? "is-active" : undefined}
                />
              ))}
            </div>
            <div className="section-link">{action}</div>
          </div>

          <div
            className="shot"
            role="img"
            aria-label="A inbox do OneBox a juntar emails de quatro contas, a acrescentar o resumo e a importância de cada um, e a filtrar só os urgentes."
          >
            <div className="shot-inner" aria-hidden="true">
              <div className="triage-head">
                <AnimatePresence mode="wait" initial={false}>
                  {phase === 0 ? (
                    <motion.ul
                      key="contas"
                      className="triage-accounts"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.24, ease }}
                    >
                      {accounts.map(([initial, label]) => (
                        <li key={label}>
                          <span className="shot-badge">{initial}</span>
                          <span>{label}</span>
                        </li>
                      ))}
                    </motion.ul>
                  ) : (
                    <motion.div
                      key="filtros"
                      className="triage-filters"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.24, ease }}
                    >
                      {filters.map((filter) => {
                        const on =
                          phase === 2 ? filter === "Alta" : filter === "Todos";
                        return (
                          <span
                            key={filter}
                            className={on ? "chip chip-on" : "chip"}
                          >
                            {on && (
                              <motion.span
                                layoutId="triage-filter"
                                className="chip-fill"
                                transition={{ duration: 0.32, ease }}
                              />
                            )}
                            <span>{filter}</span>
                          </span>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence initial={false}>
                {rows.map(({ key, email }, i) => (
                  <Row
                    key={key}
                    email={email}
                    details={phase > 0}
                    pulse={key.startsWith("nova")}
                    delay={i * 0.08}
                    variants={undefined}
                    initial={{
                      opacity: 0,
                      height: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      paddingTop: 14,
                      paddingBottom: 14,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                    transition={{ duration: 0.32, ease }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const tones = [
  "Mais formal",
  "Mais curta",
  "Mais simpática",
  "Mais direta",
] as const;

const drafts = {
  Original: [
    "Olá Ana,",
    "Obrigado pela revisão. O novo valor e o prazo de novembro funcionam do nosso lado, por isso considera confirmado.",
    "Até sexta, Filipe",
  ],
  "Mais formal": [
    "Cara Ana,",
    "Agradeço o envio da proposta revista. Confirmo que o novo valor e o prazo de novembro estão de acordo com o que combinámos.",
    "Com os melhores cumprimentos, Filipe",
  ],
  "Mais curta": [
    "Olá Ana,",
    "Confirmado: o novo valor e o prazo de novembro funcionam.",
    "Filipe",
  ],
  "Mais simpática": [
    "Olá Ana!",
    "Obrigado por teres tratado disto tão depressa. O novo valor e o prazo de novembro ficam ótimos, está confirmado.",
    "Um abraço, Filipe",
  ],
  "Mais direta": [
    "Ana,",
    "Aceito o novo valor e o prazo de novembro. Podes avançar.",
    "Filipe",
  ],
};

const longestDraft = Object.values(drafts).reduce((longest, draft) =>
  draft.join("").length > longest.join("").length ? draft : longest,
);

export function ReplyShot() {
  const reduced = useReducedMotion();
  const [tone, setTone] = useState<(typeof tones)[number] | null>(null);
  const [typed, setTyped] = useState(Infinity);
  const text = drafts[tone ?? "Original"].join("\n");
  const typing = !reduced && typed < text.length;

  useEffect(() => {
    if (!typing) return;
    const timer = setInterval(() => setTyped((n) => n + 2), 16);
    return () => clearInterval(timer);
  }, [typing]);

  const shown = typing ? text.slice(0, typed) : text;

  function choose(next: (typeof tones)[number]) {
    setTone(tone === next ? null : next);
    setTyped(0);
  }

  return (
    <div className="shot">
      <div className="shot-inner">
        <motion.div
          className="shot-reply"
          variants={cascade}
          initial="hidden"
          whileInView="shown"
          viewport={seen}
        >
          <motion.span className="shot-label" variants={arrive}>
            Resposta sugerida
          </motion.span>
          <motion.div className="reply-draft" variants={arrive}>
            <div className="reply-sizer" aria-hidden="true">
              {longestDraft.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div aria-hidden="true">
              {shown.split("\n").map((line, i, lines) => (
                <p key={i}>
                  {line}
                  {i === lines.length - 1 && <span className="caret" />}
                </p>
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              {text}
            </p>
          </motion.div>
          <motion.span className="shot-label reply-hint" variants={arrive}>
            Toca num tom
          </motion.span>
          <motion.div
            className="reply-tones"
            variants={arrive}
            role="group"
            aria-label="Ajustar o tom da resposta"
          >
            {tones.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={tone === option}
                className={tone === option ? "chip chip-active" : "chip"}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            ))}
          </motion.div>
          <motion.div
            className="reply-actions"
            variants={arrive}
            aria-hidden="true"
          >
            <span className="btn-ghost">Cancelar</span>
            <span className="btn-send">Enviar resposta</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
