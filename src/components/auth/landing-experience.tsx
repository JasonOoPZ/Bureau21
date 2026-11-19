"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { motionTokens } from "@/lib/motion-tokens";
import styles from "./landing-experience.module.css";

const sectors = [
  {
    number: "01",
    title: "Build your operator.",
    tag: "TRAIN / EVOLVE",
    description:
      "Train your stats, choose your equipment, and carve out an identity of your own.",
    icon: "◎",
  },
  {
    number: "02",
    title: "Make your next move.",
    tag: "EXPLORE / TRADE",
    description:
      "Mine ore, harvest alien herbs, and discover what the station has waiting below the surface.",
    icon: "◇",
  },
  {
    number: "03",
    title: "Earn your reputation.",
    tag: "FIGHT / RISE",
    description:
      "Take on rival pilots in PvP combat. Find your edge and climb the leaderboards.",
    icon: "⌁",
  },
];

function Reveal({
  children,
  className,
  lift = false,
}: {
  children: ReactNode;
  className?: string;
  lift?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y: 0 }}
      whileHover={
        lift && !reduced ? { y: -motionTokens.distance.sm } : undefined
      }
      whileInView={reduced ? undefined : { y: [motionTokens.distance.lg, 0] }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.smooth,
      }}
    >
      {children}
    </motion.div>
  );
}

export function LandingExperience({
  children,
  onBoard,
  onSignIn,
}: {
  children: ReactNode;
  onBoard: () => void;
  onSignIn: () => void;
}) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const inView = useInView(scene);
  const animate = !reduced && !paused && inView;

  function board() {
    onBoard();
    document
      .getElementById("boarding")
      ?.scrollIntoView({
        behavior: reduced ? "instant" : "smooth",
        block: "start",
      });
    document.getElementById("boarding-heading")?.focus({ preventScroll: true });
  }

  return (
    <main className={styles.landing}>
      <a className={styles.skip} href="#boarding" onClick={onSignIn}>
        Skip to sign in
      </a>
      <header className={styles.header}>
        <a href="#" className={styles.wordmark} aria-label="Bureau 21 home">
          BUREAU<span>21</span>
          <i>®</i>
        </a>
        <nav aria-label="Main navigation">
          <a href="#world">The world</a>
          <a href="#sectors">How you play</a>
          <a href="#boarding" onClick={onSignIn}>
            Sign in <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.signal} /> TRANSMISSION 021 / OPEN TO ALL
          </p>
          <h1 id="hero-title">
            Your next life
            <br />
            starts <span>off-world.</span>
          </h1>
          <p className={styles.intro}>
            One lawless station. A thousand ways to make your name. Enter a
            free-to-play sci-fi MMORPG, right in your browser.
          </p>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={board}>
              Board the station <span aria-hidden="true">↗</span>
            </button>
            <a className={styles.secondary} href="#world">
              Explore the world <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className={styles.micro}>
            NO DOWNLOAD. NO ENTRY FEE. JUST YOUR NEXT MOVE.
          </p>
        </div>

        <div className={styles.scene} ref={scene}>
          <div className={styles.sceneGrid} aria-hidden="true" />
          <div className={styles.coordinates}>
            DEEP SPACE / ORBITAL SECTOR 21
          </div>
          <div className={styles.orbital} aria-hidden="true">
            <svg viewBox="0 0 600 600" className={styles.orbitSvg}>
              <defs>
                <radialGradient id="b21-planet" cx="30%" cy="25%">
                  <stop offset="0" stopColor="#246477" />
                  <stop offset=".5" stopColor="#102c3c" />
                  <stop offset="1" stopColor="#02070b" />
                </radialGradient>
                <linearGradient id="b21-ring">
                  <stop stopColor="#8cebf0" />
                  <stop offset=".5" stopColor="#40636e" />
                  <stop offset="1" stopColor="#f9a16b" />
                </linearGradient>
              </defs>
              <circle
                cx="300"
                cy="300"
                r="245"
                fill="none"
                stroke="#47616b"
                strokeWidth=".7"
                strokeDasharray="2 12"
              />
              <motion.g
                animate={{ rotate: animate ? 360 : 0 }}
                style={{ transformOrigin: "300px 300px" }}
                transition={{
                  duration: animate ? motionTokens.duration.orbit : 0,
                  repeat: animate ? Infinity : 0,
                  ease: motionTokens.easing.linear,
                }}
              >
                <circle
                  cx="300"
                  cy="300"
                  r="218"
                  fill="none"
                  stroke="#7bd9de"
                  strokeWidth="1"
                  strokeDasharray="180 40 3 40"
                  opacity=".5"
                />
                <circle cx="300" cy="82" r="5" fill="#c5faff" />
                <path d="M285 82h30M300 67v30" stroke="#7bd9de" />
              </motion.g>
              <circle
                cx="300"
                cy="300"
                r="153"
                fill="url(#b21-planet)"
                stroke="#548897"
              />
              <g fill="none" stroke="#67929d" strokeWidth=".7" opacity=".35">
                <ellipse cx="300" cy="300" rx="80" ry="153" />
                <ellipse cx="300" cy="300" rx="125" ry="153" />
                <ellipse cx="300" cy="300" rx="153" ry="55" />
                <ellipse cx="300" cy="300" rx="153" ry="110" />
                <path d="M147 300h306M300 147v306" />
              </g>
              <g transform="rotate(-28 300 300)">
                <ellipse
                  cx="300"
                  cy="300"
                  rx="268"
                  ry="82"
                  fill="none"
                  stroke="url(#b21-ring)"
                  strokeWidth="13"
                  strokeDasharray="3 3"
                />
                <ellipse
                  cx="300"
                  cy="300"
                  rx="282"
                  ry="97"
                  fill="none"
                  stroke="#83d1dc"
                  strokeWidth="1"
                  opacity=".5"
                />
                <path
                  d="M32 300h70m396 0h70"
                  stroke="#efffff"
                  strokeWidth="4"
                />
              </g>
              <circle cx="300" cy="300" r="7" fill="#a9f6ff" />
              <circle
                cx="300"
                cy="300"
                r="15"
                fill="none"
                stroke="#a9f6ff"
                strokeWidth=".6"
              />
            </svg>
            <div className={styles.planetLabel}>
              B<span>21</span>
            </div>
          </div>
          <motion.div
            className={`${styles.telemetry} ${styles.telemetryTop}`}
            animate={{ y: animate ? [0, -motionTokens.distance.sm, 0] : 0 }}
            transition={{
              duration: animate ? motionTokens.duration.float : 0,
              repeat: animate ? Infinity : 0,
            }}
          >
            <span>DESTINATION LOCKED</span>
            <strong>Bureau 21</strong>
            <small>
              <i /> Orbital station / Unregulated
            </small>
          </motion.div>
          <motion.div
            className={`${styles.telemetry} ${styles.telemetryBottom}`}
            animate={{ y: animate ? [0, motionTokens.distance.sm, 0] : 0 }}
            transition={{
              duration: animate ? motionTokens.duration.float : 0,
              repeat: animate ? Infinity : 0,
            }}
          >
            <span>OPERATOR STATUS</span>
            <strong>Unwritten.</strong>
            <small>
              Your story begins on arrival <b>↗</b>
            </small>
          </motion.div>
          <div className={styles.sceneFooter}>
            <span>STATION SCHEMATIC / NOT TO SCALE</span>
            <button
              type="button"
              aria-pressed={paused || !!reduced}
              disabled={!!reduced}
              onClick={() => setPaused(!paused)}
            >
              {reduced
                ? "Motion reduced"
                : paused
                  ? "▶ Play motion"
                  : "Ⅱ Pause motion"}
            </button>
          </div>
        </div>
      </section>

      <div className={styles.manifest}>
        <span>
          <i>01</i> BROWSER-FIRST
        </span>
        <span>
          <i>02</i> FREE-TO-PLAY
        </span>
        <span>
          <i>03</i> PVP COMBAT
        </span>
        <span>
          <i>04</i> YOUR OWN PATH
        </span>
      </div>

      <section
        id="world"
        className={styles.world}
        aria-labelledby="world-title"
      >
        <Reveal className={styles.sectionHeading}>
          <p className={styles.eyebrow}>THE WORLD / WELCOME TO THE FRINGE</p>
          <h2 id="world-title">
            Far from ordinary.
            <br />
            <span>Closer to who you could be.</span>
          </h2>
          <p>
            Out here, your reputation is yours to build. Train, trade, explore,
            or fight your way through a station that plays by its own rules.
          </p>
        </Reveal>
        <Reveal className={styles.worldImage}>
          <Image
            src="/bureau21-welcome.png"
            alt="Bureau 21 alien operators in a neon-lit orbital city"
            fill
            sizes="(max-width: 760px) 100vw, 1200px"
          />
          <div className={styles.imageCaption}>
            <span>FIELD NOTES / 021</span>
            <strong>
              Strangers. Rivals.
              <br />
              Your kind of people.
            </strong>
            <a href="#boarding" onClick={onBoard}>
              Find your place <span aria-hidden="true">↗</span>
            </a>
          </div>
        </Reveal>
      </section>

      <section
        id="sectors"
        className={styles.sectors}
        aria-labelledby="sectors-title"
      >
        <div className={styles.sectorHeading}>
          <p className={styles.eyebrow}>MAKE IT YOURS</p>
          <h2 id="sectors-title">No single way to rise.</h2>
        </div>
        <div className={styles.cards}>
          {sectors.map((sector) => (
            <Reveal key={sector.number} className={styles.card} lift>
              <div className={styles.cardTop}>
                <span>{sector.number} /</span>
                <span aria-hidden="true">{sector.icon}</span>
              </div>
              <p className={styles.cardTag}>{sector.tag}</p>
              <h3>{sector.title}</h3>
              <p>{sector.description}</p>
              <button
                type="button"
                onClick={board}
                aria-label={`${sector.title} Create an account.`}
              >
                Start your story <span aria-hidden="true">↗</span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="boarding"
        className={styles.boarding}
        aria-labelledby="boarding-heading"
      >
        <Reveal className={styles.boardingCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.signal} /> ARRIVALS / NEW OPERATORS WELCOME
          </p>
          <h2 id="boarding-heading" tabIndex={-1}>
            The station is waiting.
            <br />
            <span>Make an entrance.</span>
          </h2>
          <p>
            Your next chapter is one account away. Create your pilot or sign in
            to pick up where you left off.
          </p>
          <div className={styles.ticket}>
            <span>ONE-WAY PASS</span>
            <strong>
              EARTH <i>────────↗</i> B21
            </strong>
            <small>
              CLASS: OPERATOR <span>FARE: FREE</span>
            </small>
          </div>
        </Reveal>
        <div className={styles.auth}>{children}</div>
      </section>
      <footer className={styles.footer}>
        <a href="#" className={styles.wordmark}>
          BUREAU<span>21</span>
        </a>
        <p>A new life. A different orbit.</p>
        <a href="#">Back to surface ↑</a>
      </footer>
    </main>
  );
}
