// Alerta sonoro de cobrança (Web Audio, sem asset). Toca dois bipes curtos.
// Autoplay pode ser bloqueado até a primeira interação do usuário — falha em silêncio.

const SOUND_KEY = "hub.sound";

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* storage indisponível */
  }
}

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Dois bipes ascendentes — chamado quando chega uma cobrança. */
export function playReminderSound(): void {
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  [0, 0.22].forEach((offset, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = i === 0 ? 880 : 1180;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.2);
  });
}

/** Notificação do sistema, se a permissão já tiver sido concedida. */
export function notifyBrowser(title: string, body: string): void {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/logo.png" });
    }
  } catch {
    /* ignore */
  }
}
