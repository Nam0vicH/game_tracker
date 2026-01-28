/* --- 1. Constants & Definitions --- */
const PRESETS = {
    violet: {
        primary: '#d0bcff',
        onPrimary: '#381e72',
        primaryContainer: '#4f378b',
        onPrimaryContainer: '#eaddff',
        secondary: '#ccc2dc',
        tertiary: '#efb8c8'
    },
    ocean: {
        primary: '#76d1ff',
        onPrimary: '#003548',
        primaryContainer: '#004d67',
        onPrimaryContainer: '#c3e8ff',
        secondary: '#b3cad5',
        tertiary: '#d2c2e9'
    },
    emerald: {
        primary: '#8cd697',
        onPrimary: '#003918',
        primaryContainer: '#005225',
        onPrimaryContainer: '#a7f3b0',
        secondary: '#b6ccb8',
        tertiary: '#a2ced9'
    },
    volcanic: {
        primary: '#ffb4a9',
        onPrimary: '#690003',
        primaryContainer: '#930008',
        onPrimaryContainer: '#ffdad5',
        secondary: '#e7bdb7',
        tertiary: '#e3c48c'
    }
};

const BACKGROUNDS = {
    oled: { surface: '#000000', container: '#141414', containerHigh: '#1f1f1f' },
    default: { surface: '#0f0d13', container: '#1d1b24', containerHigh: '#2b2831' },
    soft: { surface: '#1c1b1f', container: '#28272d', containerHigh: '#36343b' }
};

const defaultSettings = {
    mode: 'preset',
    presetName: 'violet',
    customColor: '#d0bcff',
    background: 'default'
};

/* --- 2. Core Functions (Apply Logic) --- */

function applyPreset(name) {
    const theme = PRESETS[name] || PRESETS.violet;
    const root = document.documentElement;
    root.style.setProperty('--md-sys-color-primary', theme.primary);
    root.style.setProperty('--md-sys-color-on-primary', theme.onPrimary);
    root.style.setProperty('--md-sys-color-primary-container', theme.primaryContainer);
    root.style.setProperty('--md-sys-color-on-primary-container', theme.onPrimaryContainer);
    root.style.setProperty('--md-sys-color-secondary', theme.secondary);
    root.style.setProperty('--md-sys-color-tertiary', theme.tertiary);
}

function applyCustomTheme(hex) {
    const hsl = hexToHSL(hex);
    // Logic for dark theme generation
    const primary = HSLToHex(hsl.h, hsl.s, 80);
    const onPrimary = HSLToHex(hsl.h, hsl.s, 20);
    const container = HSLToHex(hsl.h, hsl.s, 30);
    const onContainer = HSLToHex(hsl.h, hsl.s, 90);
    const secondary = HSLToHex(hsl.h, Math.max(0, hsl.s - 20), 80);
    const tertiary = HSLToHex((hsl.h + 60) % 360, hsl.s, 85);

    const root = document.documentElement;
    root.style.setProperty('--md-sys-color-primary', primary);
    root.style.setProperty('--md-sys-color-on-primary', onPrimary);
    root.style.setProperty('--md-sys-color-primary-container', container);
    root.style.setProperty('--md-sys-color-on-primary-container', onContainer);
    root.style.setProperty('--md-sys-color-secondary', secondary);
    root.style.setProperty('--md-sys-color-tertiary', tertiary);
}

function applyBackground(mode) {
    const bg = BACKGROUNDS[mode] || BACKGROUNDS.default;
    const root = document.documentElement;
    root.style.setProperty('--md-sys-color-surface', bg.surface);
    root.style.setProperty('--md-sys-color-surface-container', bg.container);
    root.style.setProperty('--md-sys-color-surface-container-high', bg.containerHigh);
}

function saveSettings(newSettings) {
    const current = JSON.parse(localStorage.getItem('app_appearance')) || defaultSettings;
    const updated = { ...current, ...newSettings };
    localStorage.setItem('app_appearance', JSON.stringify(updated));
}

function loadThemeGlobal() {
    const saved = JSON.parse(localStorage.getItem('app_appearance')) || defaultSettings;

    // Apply Colors
    if (saved.mode === 'preset') {
        applyPreset(saved.presetName);
    } else if (saved.mode === 'custom') {
        applyCustomTheme(saved.customColor);
    }
    // Apply Background
    applyBackground(saved.background);
}

/* --- 3. Math Helpers --- */
function hexToHSL(H) {
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
        r = "0x" + H[1] + H[1]; g = "0x" + H[2] + H[2]; b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
        r = "0x" + H[1] + H[2]; g = "0x" + H[3] + H[4]; b = "0x" + H[5] + H[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
    let h = 0, s = 0, l = 0;

    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return { h, s, l };
}

function HSLToHex(h, s, l) {
    s /= 100; l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2,
        r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;
    return "#" + r + g + b;
}

// Запускаем немедленно при загрузке файла, чтобы не было "мигания"
loadThemeGlobal();