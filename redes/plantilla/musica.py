"""Pista musical ORIGINAL (sintetizada acá, sin derechos de terceros) para los reels.
Uso: python3 musica.py salida.wav segundos [calido|epico|reflexivo]
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
out, dur = sys.argv[1], float(sys.argv[2])
mood = sys.argv[3] if len(sys.argv) > 3 else 'calido'
rng = np.random.default_rng(41)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

# acordes como notas MIDI (raíz, tercera, quinta) + bajo
MOODS = {
    'calido':    dict(bpm=84, chords=[(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)], drums=0.5),   # C G Am F
    'epico':     dict(bpm=96, chords=[(62, 65, 69), (58, 62, 65), (53, 57, 60), (60, 64, 67)], drums=1.0),   # Dm Bb F C
    'reflexivo': dict(bpm=70, chords=[(57, 60, 64), (53, 57, 60), (60, 64, 67), (55, 59, 62)], drums=0.0),   # Am F C G
}
M = MOODS.get(mood, MOODS['calido'])
beat = 60 / M['bpm']; bar = 4 * beat
n = int(SR * (dur + 2)); L = np.zeros(n); R = np.zeros(n)

def add(sig, t0, pan=0.0, g=1.0):
    i = int(t0 * SR); j = min(n, i + len(sig))
    if i >= n: return
    s = sig[:j - i] * g
    L[i:j] += s * (1 - pan) ** 0.5; R[i:j] += s * (1 + pan) ** 0.5

def piano(f, d=2.5):
    t = np.arange(int(SR * d)) / SR
    s = sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * (1 + 0.0004 * k * k) * t) * np.exp(-t * (1.6 + 1.2 * k)) for k in range(6))
    return s * (1 - np.exp(-t * 400))

def pad(freqs, d):
    t = np.arange(int(SR * d)) / SR
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            s += sum(np.sin(2 * np.pi * ff * h * t) / h for h in range(1, 6))
    s = sosfilt(butter(2, 1400, fs=SR, output='sos'), s)
    env = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.6).clip(0)
    return s * env / (len(freqs) * 6)

def kick():
    t = np.arange(int(SR * 0.4)) / SR
    return np.sin(2 * np.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)

def hat():
    t = np.arange(int(SR * 0.08)) / SR
    return sosfilt(butter(2, 7000, 'hp', fs=SR, output='sos'), rng.standard_normal(len(t))) * np.exp(-t * 60)

nb = int(np.ceil(dur / bar)) + 1
arp = [0, 1, 2, 1, 0 + 12, 2, 1, 2]  # patrón de arpegio en corcheas
for b in range(nb):
    t0 = b * bar
    ch = M['chords'][b % len(M['chords'])]
    add(pad([hz(m) for m in ch], bar + 0.6), t0, g=0.55)
    add(np.sin(2 * np.pi * hz(ch[0] - 24) * np.arange(int(SR * bar)) / SR) * np.exp(-np.arange(int(SR * bar)) / SR * 0.8), t0, g=0.35)
    if mood != 'reflexivo' or b % 2 == 0:
        for k, idx in enumerate(arp):
            m = ch[idx % 3] + 12 + (12 if idx >= 12 else 0)
            if mood == 'reflexivo' and k % 2: continue
            add(piano(hz(m)), t0 + k * beat / 2, pan=0.3 * np.sin(k), g=0.22)
    if M['drums'] and b >= 1:
        for k in range(4):
            if k in (0, 2): add(kick(), t0 + k * beat, g=0.55 * M['drums'])
            add(hat(), t0 + k * beat + beat / 2, pan=0.4, g=0.10 * M['drums'])

# reverb simple
ir_t = np.arange(int(SR * 2.2)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2); ir[0] = 0
wet = 0.12
L = L + wet * fftconvolve(L, ir)[:n] / 30; R = R + wet * fftconvolve(R, ir * np.roll(np.ones_like(ir), 1))[:n] / 30
x = np.stack([L, R], 1)[:int(SR * dur)]
fi = int(SR * 0.4); x[:fi] *= np.linspace(0, 1, fi)[:, None]
x = x / (np.abs(x).max() + 1e-9) * 0.85
wavfile.write(out, SR, (x * 32767).astype(np.int16))
