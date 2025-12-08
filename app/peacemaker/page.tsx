import React from "react";
import Link from "next/link";
import styles from "./peacemaker.module.scss";

export default function PeacemakerPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Blessed are the Peacemakers</h1>
        <p>Building systems that capture more energy for humanity.</p>
      </header>
      
      <main className={styles.grid}>
        
        {/* The Core Research */}
        <div className={styles.card}>
            <h2>🔬 Interactive CV</h2>
            <p>My research thesis: entropic gravity, discrete spacetime, and energy capture systems.</p>
            <div className={styles.linkGroup}>
                <Link href="/cv" className={`${styles.link} ${styles.linkPrimary}`}>View CV</Link>
            </div>
        </div>
        
        <div className={styles.card}>
            <h2>🎮 The World Engine</h2>
            <p>Physics-informed 3D simulation with educational missions on entropy, energy, and thermodynamics.</p>
            <div className={styles.linkGroup}>
                <Link href="/" className={`${styles.link} ${styles.linkPrimary}`}>Enter</Link>
            </div>
        </div>

        {/* Physics Simulations */}
        <div className={styles.card}>
            <h2>⚛️ 4D Spacetime</h2>
            <p>Real-time Lorentz transformations. Navigate spacetime at relativistic speeds. See how 4D projects to 3D.</p>
            <div className={styles.linkGroup}>
                <Link href="/4d" className={styles.link}>4D Engine</Link>
                <Link href="/tensor" className={styles.link}>Tensor Space</Link>
            </div>
        </div>

        <div className={styles.card}>
            <h2>🧬 Cellular Automata</h2>
            <p>Neural Cellular Automata simulating self-organization and the universe's update function.</p>
            <div className={styles.linkGroup}>
                <Link href="/nca" className={styles.link}>NCA Simulation</Link>
                <Link href="/matrix" className={styles.link}>Matrix View</Link>
            </div>
        </div>

        {/* AI & Personalization */}
        <div className={styles.card}>
            <h2>💜 ActInLove</h2>
            <p>AI-powered personalized page generation. Send meaningful messages through shareable URLs.</p>
            <div className={styles.linkGroup}>
                <Link href="/love" className={styles.link}>Chat</Link>
                <Link href="/from/ilya/to/world" className={styles.link}>Demo</Link>
                <Link href="/admin/profiles" className={styles.link}>Admin</Link>
            </div>
        </div>

        {/* Other Dimensions */}
        <div className={styles.card}>
            <h2>🌌 Other Realities</h2>
            <p>Explore different dimensional projections and experimental simulations.</p>
            <div className={styles.linkGroup}>
                <Link href="/flatland" className={styles.link}>Flatland</Link>
                <Link href="/gtasa" className={styles.link}>San Andreas</Link>
                <Link href="/platform4d" className={styles.link}>Platform 4D</Link>
            </div>
        </div>

        {/* Tools */}
        <div className={styles.card}>
            <h2>🛠️ Tools & Utilities</h2>
            <p>Supporting infrastructure for the simulation platform.</p>
            <div className={styles.linkGroup}>
                <Link href="/quant" className={styles.link}>Quant</Link>
                <Link href="/safespace" className={styles.link}>Safe Space</Link>
                <Link href="/messages" className={styles.link}>Messages</Link>
                <Link href="/clipboard" className={styles.link}>Clipboard</Link>
            </div>
        </div>

      </main>
    </div>
  );
}
