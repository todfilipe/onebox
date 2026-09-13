import { Inter } from "next/font/google";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { GoogleIcon } from "@/components/google-icon";
import {
  HeroStage,
  HeroText,
  MotionRoot,
  Parallax,
  Reveal,
  RevealItem,
  SectionText,
  WordReveal,
} from "./landing-motion";
import { InboxShot, ReplyShot, TriageSection } from "./product-shots";
import icon from "./icon.png";
import "./landing.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const repo = "https://github.com/todfilipe/onebox";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/inbox");
  }

  return (
    <MotionRoot>
      <div className={`${inter.variable} landing flex-1`}>
        <header className="nav">
          <div className="wrap nav-inner">
            <Image src={icon} alt="OneBox" width={24} height={24} priority />
            <SignInForm>
              <button type="submit" className="nav-link">
                Entrar
              </button>
            </SignInForm>
          </div>
        </header>

        <HeroStage
          intro={
            <HeroText
              eyebrow="OneBox"
              title="A tua inbox, organizada antes de a abrires."
              intro="Várias contas Gmail numa só caixa de entrada. Cada email chega resumido numa linha e marcado por importância."
              note="Ligas as contas que quiseres e desligas qualquer uma quando quiseres."
            >
              <SignInForm>
                <GoogleButton />
              </SignInForm>
            </HeroText>
          }
          shot={<InboxShot />}
          reveal={
            <div className="wrap">
              <p className="eyebrow">O problema</p>
              <h2 className="headline-section">
                Quatro inboxes. Nenhuma delas te diz o que é urgente.
              </h2>
              <p className="copy">
                A conta pessoal, a do trabalho, a da faculdade, e a antiga que
                ainda recebe faturas. Passas o dia a saltar entre separadores e,
                mesmo assim, continuas a dar pelo email importante tarde de
                mais.
              </p>
            </div>
          }
        />

        <TriageSection
          action={
            <SignInForm>
              <button type="submit" className="link-chevron">
                Ligar a primeira conta
                <ChevronIcon />
              </button>
            </SignInForm>
          }
        />

        <section className="band band-statement">
          <div className="wrap">
            <WordReveal text="Lês primeiro o que importa. O resto pode esperar." />
          </div>
        </section>

        <section className="band band-alt">
          <div className="wrap">
            <Reveal className="section-head">
              <SectionText
                eyebrow="Resposta sugerida"
                title="Responde em segundos."
              />
            </Reveal>
            <div className="split">
              <Reveal>
                <SectionText
                  body="A resposta já vem escrita quando abres o email. Se o tom não servir, pedes outro com um toque e a Gemini reescreve o rascunho. Experimenta os tons no cartão."
                  action={
                    <SignInForm>
                      <button type="submit" className="link-chevron">
                        Experimentar com o teu email
                        <ChevronIcon />
                      </button>
                    </SignInForm>
                  }
                />
              </Reveal>
              <Parallax>
                <ReplyShot />
              </Parallax>
            </div>
          </div>
        </section>

        <section className="band">
          <Reveal className="wrap">
            <SectionText
              eyebrow="No dia a dia"
              title="O resto do que precisas."
              titleClass="headline-gallery"
            />
            <RevealItem className="grid-three">
              <article className="feature-card">
                <SearchIcon />
                <h3>Pesquisa em todas as contas</h3>
                <p className="copy">
                  Procura ao mesmo tempo no assunto, no remetente e no resumo,
                  em todas as contas ligadas.
                </p>
              </article>
              <article className="feature-card">
                <ClockIcon />
                <h3>Arquivo e adiados</h3>
                <p className="copy">
                  Arquiva o que já resolveste e adia o que fica para depois. O
                  email adiado volta à inbox à hora que escolheste.
                </p>
              </article>
              <article className="feature-card">
                <SlidersIcon />
                <h3>As tuas regras ganham sempre</h3>
                <p className="copy">
                  Crias regras próprias e elas passam à frente da decisão da IA.
                  Se disseres que tudo da Ana é alta importância, é alta
                  importância.
                </p>
              </article>
            </RevealItem>
          </Reveal>
        </section>

        <section className="band band-alt">
          <Reveal className="wrap">
            <SectionText
              eyebrow="Por dentro"
              title="Como é feito."
              titleClass="headline-minor"
              body={[
                "O Gmail avisa por Pub/Sub que chegou um email. Um workflow n8n trata a fila, pede à Gemini o resumo, a classificação e a resposta sugerida, aplica as regras do utilizador por cima da decisão da IA e grava o resultado no Supabase. A interface recebe a atualização em tempo real, sem refrescar a página.",
                "Os tokens de cada conta Gmail ficam cifrados na base de dados, e cada utilizador só alcança as suas próprias linhas por Row Level Security.",
              ]}
            />
            <RevealItem>
              <dl className="specs">
                <div>
                  <dt>Interface e API</dt>
                  <dd>Next.js · TypeScript</dd>
                </div>
                <div>
                  <dt>Base de dados e tempo real</dt>
                  <dd>Supabase · Postgres</dd>
                </div>
                <div>
                  <dt>Pipeline de emails</dt>
                  <dd>n8n auto-hospedado</dd>
                </div>
                <div>
                  <dt>Resumo e classificação</dt>
                  <dd>Google Gemini</dd>
                </div>
                <div>
                  <dt>Alojamento</dt>
                  <dd>VPS Hetzner · Docker</dd>
                </div>
              </dl>
            </RevealItem>
            <RevealItem className="section-link">
              <a className="link-chevron" href={repo}>
                Ver o código no GitHub
                <ChevronIcon />
              </a>
            </RevealItem>
          </Reveal>
        </section>

        <section className="band centered">
          <Reveal className="wrap">
            <SectionText
              title="Começa com uma conta."
              body="Ligas a primeira em menos de um minuto. As outras entram quando te der jeito."
            />
            <RevealItem className="actions">
              <SignInForm>
                <GoogleButton />
              </SignInForm>
            </RevealItem>
          </Reveal>
        </section>

        <footer className="footer footnote">
          <div className="wrap footer-inner">
            <p>© 2026 OneBox. Projeto de portefólio.</p>
            <p>
              <a href={repo}>Código no GitHub</a>
            </p>
          </div>
        </footer>
      </div>
    </MotionRoot>
  );
}

function SignInForm({ children }: { children: React.ReactNode }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      {children}
    </form>
  );
}

function GoogleButton() {
  return (
    <button type="submit" className="btn-google">
      <i>
        <GoogleIcon />
      </i>
      Continuar com Google
    </button>
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
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="10" cy="16" r="2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
