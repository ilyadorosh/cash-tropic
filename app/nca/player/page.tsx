"use client";

/* BLØB.haus — NCA player page. Drop nca_weights.json into /public to auto-load;
   otherwise use the file picker. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./nca-player.module.scss";
import {
  createPlayer,
  fetchWeights,
  normalizeWeights,
  type Player,
  type WeightsJson,
} from "./engine";

export default function NcaPlayerPage() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<Player | null>(null);

  const [err, setErr] = useState("");
  const [stat, setStat] = useState("");
  const [hint, setHint] = useState("Looking for /nca_weights.json …");
  const [loaded, setLoaded] = useState("none loaded");
  const [warn, setWarn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [clsA, setClsA] = useState(0);
  const [clsB, setClsB] = useState(0);
  const [morph, setMorph] = useState(0);
  const [fire, setFire] = useState(50);
  const [speed, setSpeed] = useState(4);

  const applyModel = (data: WeightsJson) => {
    const m = playerRef.current?.loadModel(data);
    if (!m) return;
    setClasses(m.classes);
    setClsA(0);
    setClsB(0);
    setMorph(0);
    setFire(Math.round(m.fire_rate * 100));
    setWarn(!!m.use_axons);
    setLoaded(`${m.N} classes · ${m.SIZE}×${m.SIZE} · hidden ${m.HID}`);
    setHint(
      "Loaded on GPU. Press play. Drag A→B to morph. Poke the creature to damage it — it heals.",
    );
  };

  useEffect(() => {
    if (!cvRef.current) return;
    const player = createPlayer(cvRef.current, setErr, setStat);
    playerRef.current = player;
    if (!player) return;

    // try auto-loading weights shipped in /public (quantized first)
    fetchWeights()
      .then((data) => (data ? applyModel(data) : Promise.reject()))
      .catch(() =>
        setHint(
          "Load your <b>nca_weights.json</b> (exported from the notebook) to begin — or drop it into /public to auto-load.",
        ),
      );

    return () => player.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep player params in sync */
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    p.params.A = clsA;
    p.params.B = clsB;
    p.params.t = morph / 100;
    p.params.fire = fire / 100;
    p.params.speed = speed;
  }, [clsA, clsB, morph, fire, speed]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    const v = !playing;
    setPlaying(v);
    playerRef.current.setPlaying(v);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        applyModel(normalizeWeights(JSON.parse(String(rd.result))));
      } catch (parseErr: any) {
        setErr("JSON parse error: " + parseErr.message);
      }
    };
    rd.readAsText(file);
  };

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>
              BLØB.haus — neural cellular automaton
            </h1>
            <p className={styles.sub}>
              A tiny neural net, alive. The local rule runs in a fragment
              shader, every cell in parallel. Pick a class, drag A→B to morph,
              poke it to damage — and watch it heal, in real time.
            </p>
          </div>
          <Link href="/" className={styles.back}>
            ← act in love
          </Link>
        </div>

        <div className={styles.stage}>
          <canvas
            ref={cvRef}
            width={504}
            height={504}
            onMouseDown={(e) => {
              e.preventDefault();
              playerRef.current?.poke(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) playerRef.current?.poke(t.clientX, t.clientY);
            }}
          />
          <div
            className={styles.hint}
            dangerouslySetInnerHTML={{ __html: hint }}
          />
          {err && <div className={styles.err}>{err}</div>}
          {warn && (
            <div className={styles.warnbox}>
              This model was trained with axons ON. This player runs the local
              rule only (attention isn&apos;t in the shader), so it
              approximates. Fine-tune with axons off for an exact live match.
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.row}>
            <button
              className={styles.btn}
              onClick={() => fileRef.current?.click()}
            >
              Load weights
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={onFile}
            />
            <span className={styles.badge}>{loaded}</span>
          </div>
          <div className={styles.row}>
            <button
              className={`${styles.btn} ${styles.primary}`}
              onClick={togglePlay}
            >
              {playing ? "❚❚ pause" : "▶ play"}
            </button>
            <button
              className={styles.btn}
              onClick={() => playerRef.current?.seed()}
            >
              ↻ seed
            </button>
            <button
              className={`${styles.btn} ${styles.warn}`}
              onClick={() => playerRef.current?.damageCenter()}
            >
              ✦ damage
            </button>
            <label className={styles.label}>speed</label>
            <input
              type="range"
              min={1}
              max={16}
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
            />
            <span className={styles.val}>{speed}</span>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>class A</label>
            <select value={clsA} onChange={(e) => setClsA(+e.target.value)}>
              {classes.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <label className={styles.label}>B</label>
            <select value={clsB} onChange={(e) => setClsB(+e.target.value)}>
              {classes.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <label className={styles.label}>A→B</label>
            <input
              type="range"
              min={0}
              max={100}
              value={morph}
              onChange={(e) => setMorph(+e.target.value)}
            />
            <span className={styles.val}>{morph}</span>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>fire rate</label>
            <input
              type="range"
              min={10}
              max={100}
              value={fire}
              onChange={(e) => setFire(+e.target.value)}
            />
            <span className={styles.val}>
              {(fire / 100).toFixed(2).slice(1)}
            </span>
            <span className={styles.badge}>{stat}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
