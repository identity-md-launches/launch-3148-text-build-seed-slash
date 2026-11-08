// Original vector artwork for Seed Slash. No stock illustrations or remote runtime art.
import { mkdir, writeFile } from 'node:fs/promises';
const dir = new URL('../public/art/', import.meta.url);
await mkdir(dir, { recursive: true });
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const save = (name, w, h, body) => writeFile(new URL(`${name}.svg`, dir), svg(w, h, body));

const nutArt = {
  seed: `<path d="M50 5C38 19 18 38 20 65c2 23 19 33 30 33S78 88 80 65C82 38 62 19 50 5Z" fill="#e4d1a0" stroke="#5e553c" stroke-width="4"/><path d="M50 12C38 35 33 60 43 91M53 15c11 30 16 52 4 77" fill="none" stroke="#394644" stroke-width="9" stroke-linecap="round"/><path d="M30 50c-6 17-3 25 1 31" fill="none" stroke="#fff0c5" stroke-width="4" stroke-linecap="round"/>`,
  almond: `<path d="M49 5C23 17 10 49 18 71c7 20 22 27 34 25 21-3 36-19 33-43C82 31 63 12 49 5Z" fill="#ce854e" stroke="#75482e" stroke-width="4"/><path d="M49 15C31 32 24 52 31 75m21-56c-11 23-15 43-8 66m11-60c8 16 16 37 8 54M23 56l5 5m44-12 4 6" fill="none" stroke="#995e37" stroke-width="4" stroke-linecap="round"/><path d="M35 25c-9 8-13 17-14 24" fill="none" stroke="#efb275" stroke-width="5" stroke-linecap="round"/>`,
  cashew: `<path d="M30 10C7 24 7 58 22 79c16 23 45 23 61 4 15-19 8-40-9-41-11-1-15 7-13 15 2 7-6 12-12 5-9-9-7-21 1-30 12-17-6-31-20-22Z" fill="#f6d6a0" stroke="#a97848" stroke-width="4"/><path d="M30 23c-12 13-10 36 4 49 14 14 29 12 40 2" fill="none" stroke="#ffe8bd" stroke-width="8" stroke-linecap="round"/><path d="M43 34c-7 13-3 27 5 33" fill="none" stroke="#d2aa73" stroke-width="3" stroke-linecap="round"/>`,
  walnut: `<path d="M47 8C30 2 16 16 14 30 0 38 4 57 11 65c-3 16 9 27 24 29 9 8 23 7 30 1 17 1 28-14 25-29 12-15 6-30-3-37C85 12 64 2 54 9Z" fill="#b88555" stroke="#654a36" stroke-width="4"/><path d="M50 13c-7 13 5 18-2 30s5 21-1 34l2 16M31 15c-11 10 7 15-3 27s8 17-1 31m42-56c12 11-4 16 4 28s-8 17 0 32M16 42l13 5m-17 18 13-4m43-13 17-5M69 69l16 2" fill="none" stroke="#805836" stroke-width="5" stroke-linecap="round"/><path d="M35 21l-2 6m26-9 3 8M18 48l2 7M35 78l1 8m30-5-3 7" fill="none" stroke="#e5b67d" stroke-width="4" stroke-linecap="round"/>`,
  golden: `<path d="M50 4C38 18 17 38 19 65c2 23 20 34 31 34s29-11 31-34C83 38 62 18 50 4Z" fill="#ffca45" stroke="#ad7223" stroke-width="4"/><path d="M50 13C36 38 33 65 44 89M55 17c11 27 15 49 3 72" fill="none" stroke="#fff2a0" stroke-width="7" stroke-linecap="round"/><path d="m50 36 4 10 11 1-9 7 2 11-8-6-9 6 2-11-8-7 11-1Z" fill="#fff8c8"/>`,
  bomb: `<path d="m57 29 8-15 14 8-8 15Z" fill="#7e887d" stroke="#283b39" stroke-width="4"/><path d="M70 16c0-13 11-12 12-4" fill="none" stroke="#d6b277" stroke-width="5" stroke-linecap="round"/><path d="m85 2 2 8 7-5m-3 12 6 2" stroke="#ffca68" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="62" r="34" fill="#344846" stroke="#182e2d" stroke-width="5"/><path d="M24 53c2-9 9-15 18-16" fill="none" stroke="#6b8079" stroke-width="7" stroke-linecap="round"/><path d="m36 53 21 21m0-21L36 74" stroke="#ec9c7f" stroke-width="6" stroke-linecap="round"/>`,
};
for (const [name, body] of Object.entries(nutArt)) await save(name, 100, 105, body);

const hamster = `<defs>
 <linearGradient id="fur" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#ffd9a1"/><stop offset=".6" stop-color="#e9a765"/><stop offset="1" stop-color="#c9854e"/></linearGradient>
 <linearGradient id="cream" x2="0" y2="1"><stop stop-color="#fff2d3"/><stop offset="1" stop-color="#f3cf9e"/></linearGradient>
 <linearGradient id="stump" x2="0" y2="1"><stop stop-color="#8b7050"/><stop offset="1" stop-color="#3f4231"/></linearGradient>
 <radialGradient id="glow"><stop stop-color="#f9cd70" stop-opacity=".22"/><stop offset="1" stop-color="#f9cd70" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="262" cy="242" rx="233" ry="230" fill="url(#glow)"/>
<ellipse cx="258" cy="438" rx="183" ry="22" fill="#071e1c" opacity=".35"/>
<path d="M123 382c25-25 247-27 269 0l-13 66c-44 29-197 20-243-2Z" fill="url(#stump)"/>
<path d="m155 395 3 48m40-40 3 49m124-47-5 49m39-58-7 45" stroke="#a68959" stroke-width="7" stroke-linecap="round" opacity=".3"/>
<ellipse cx="257" cy="385" rx="139" ry="29" fill="#a99064"/>
<ellipse cx="257" cy="384" rx="112" ry="19" fill="none" stroke="#c3aa75" stroke-width="3" opacity=".6"/>
<ellipse cx="257" cy="384" rx="70" ry="11" fill="none" stroke="#675d42" stroke-width="3" opacity=".6"/>
<path d="M116 382c-15-10-32-3-34 8 13 7 31 9 44 5m263-13c14-11 26-9 35-1-4 10-21 15-36 13" fill="#6f9c5b"/>
<ellipse cx="254" cy="366" rx="106" ry="18" fill="#654e32" opacity=".35"/>
<ellipse cx="193" cy="354" rx="37" ry="18" transform="rotate(-12 193 354)" fill="#d89962" stroke="#a16840" stroke-width="3"/>
<ellipse cx="311" cy="354" rx="37" ry="18" transform="rotate(12 311 354)" fill="#d89962" stroke="#a16840" stroke-width="3"/>
<path d="M170 266c-27 32-31 77 3 90 44 18 128 18 162-6 23-17 15-58-8-86Z" fill="url(#fur)" stroke="#a46d43" stroke-width="4"/>
<ellipse cx="252" cy="313" rx="67" ry="47" fill="url(#cream)"/>
<path d="M158 109c-35-16-53 8-44 39 5 16 21 28 38 21l32-38Zm177 0c35-16 53 8 44 39-5 16-21 28-38 21l-32-38Z" fill="url(#fur)" stroke="#a46d43" stroke-width="4"/>
<path d="M149 119c-20-8-29 7-22 21 4 8 12 15 23 13Zm194 0c20-8 29 7 22 21-4 8-12 15-23 13Z" fill="#eaa397"/>
<path d="M137 168c8-53 55-73 109-73s104 25 111 76c23 16 27 56 10 84-16 31-60 54-121 53s-104-20-122-52c-17-31-12-67 13-88Z" fill="url(#fur)" stroke="#a46d43" stroke-width="4"/>
<path d="M145 217c24-38 63-29 101-4 33-26 75-36 102-2 15 19 11 45-9 61-21 18-52 25-92 25-42 0-78-10-97-28-15-14-20-34-5-52Z" fill="url(#cream)"/>
<path d="M244 98c-8 8-8 18 0 23m10-24c-2 7 2 14 10 18" fill="none" stroke="#ffe2b2" stroke-width="7" stroke-linecap="round"/>
<ellipse cx="186" cy="202" rx="15" ry="20" fill="#302b28"/><ellipse cx="309" cy="202" rx="15" ry="20" fill="#302b28"/>
<circle cx="181" cy="195" r="5.5" fill="#fff8df"/><circle cx="304" cy="195" r="5.5" fill="#fff8df"/>
<circle cx="191" cy="210" r="2.5" fill="#b4784d"/><circle cx="314" cy="210" r="2.5" fill="#b4784d"/>
<ellipse cx="163" cy="235" rx="21" ry="11" fill="#e99b88" opacity=".7"/><ellipse cx="331" cy="235" rx="21" ry="11" fill="#e99b88" opacity=".7"/>
<path d="M237 222c0-7 22-7 22 0 0 6-8 10-11 10s-11-4-11-10Z" fill="#9e6257"/>
<path d="M248 231v8m-16-1c3 9 12 9 16 1 6 8 14 7 18-1" stroke="#6e4c38" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="m141 234-27-7m27 17-31 3m244-13 28-7m-27 17 31 3" stroke="#b77e54" stroke-width="3" stroke-linecap="round"/>
<path d="M176 287c40 15 99 16 147-1l-8 21c-40 20-90 17-125-1Z" fill="#5c8061" stroke="#41654b" stroke-width="3"/>
<path d="m294 306 35 35 6-27-26-16" fill="#7d9c6c" stroke="#41654b" stroke-width="3"/>
<g transform="translate(217 275) rotate(12 33 43)"><path d="M33 0C10 27-7 42 1 66 9 91 54 92 64 65 73 41 46 14 33 0Z" fill="#f2c34d" stroke="#a8752c" stroke-width="3"/><path d="M32 11C18 34 19 54 27 74m12-60c12 22 12 44 2 63" fill="none" stroke="#fff2aa" stroke-width="6" stroke-linecap="round"/></g>
<ellipse cx="206" cy="320" rx="25" ry="17" transform="rotate(27 206 320)" fill="#edbb86" stroke="#ac754d" stroke-width="3"/>
<ellipse cx="292" cy="321" rx="25" ry="17" transform="rotate(-27 292 321)" fill="#edbb86" stroke="#ac754d" stroke-width="3"/>
<path d="m194 316 6 7m0-12 7 8m79-4-6 7m13-3-6 7" stroke="#c58b5a" stroke-width="2" stroke-linecap="round"/>
<g fill="#a9ba71"><path d="M107 410c-3-20-16-32-32-30 1 18 10 29 32 30Z"/><path d="M108 410c1-18 9-27 23-27-1 15-7 24-23 27Z"/><path d="M404 422c8-18 21-23 35-17-7 16-18 21-35 17Z"/></g>
<g fill="#e6c880"><circle cx="161" cy="403" r="3"/><circle cx="346" cy="386" r="3"/><circle cx="371" cy="419" r="2"/></g>`;
await save('pip', 500, 480, hamster);
await save('favicon', 100, 100, `<rect width="100" height="100" rx="25" fill="#173b33"/><g transform="translate(2 -2) scale(.2)">${hamster}</g>`);

// Layered forest, designed to remain legible under the interface at any aspect ratio.
let forest = `<defs>
 <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#102e2c"/><stop offset=".5" stop-color="#1a443b"/><stop offset="1" stop-color="#284c3b"/></linearGradient>
 <radialGradient id="moonlight"><stop stop-color="#b9c996" stop-opacity=".16"/><stop offset="1" stop-color="#a4bf91" stop-opacity="0"/></radialGradient>
 <linearGradient id="ray" x2=".35" y2="1"><stop stop-color="#ccdbab" stop-opacity=".06"/><stop offset="1" stop-color="#b5d393" stop-opacity="0"/></linearGradient>
 <radialGradient id="floor"><stop stop-color="#608052" stop-opacity=".4"/><stop offset="1" stop-color="#254935" stop-opacity="0"/></radialGradient>
</defs><path fill="url(#sky)" d="M0 0h1600v1000H0Z"/>
<ellipse cx="1000" cy="270" rx="650" ry="500" fill="url(#moonlight)"/>
<path d="m1000 0-600 900h300L1110 0m-80 0 350 900h200L1100 0" fill="url(#ray)"/>
<circle cx="1120" cy="157" r="51" fill="#cdd8b4" opacity=".6"/><circle cx="1138" cy="138" r="44" fill="#264b40"/>
<path d="M0 626q180-110 370-3t380-2 420 2 430-10v387H0" fill="#2b503e"/>
<ellipse cx="820" cy="925" rx="780" ry="150" fill="url(#floor)"/>`;
// Slim distant trunks and rounded foliage.
for (let i = 0; i < 20; i++) {
 const x = i * 91 - 40, w = 13 + (i % 4) * 5;
 forest += `<path d="M${x} 720q${-30 + i % 3 * 25}-290 0-590l${w} 2q-12 300 12 588Z" fill="#153b33" opacity=".6"/><path d="m${x + 4} ${330 + i % 5 * 33} -55-74m${x + 9} ${450 + i % 4 * 39} 65-80" stroke="#153b33" stroke-width="9" fill="none" opacity=".6"/>`;
}
for (let i = 0; i < 17; i++) {
 const x = i * 111 - 80, y = 72 + (i * 37 % 140);
 forest += `<ellipse cx="${x}" cy="${y}" rx="145" ry="100" fill="${i % 2 ? '#163b32' : '#194134'}"/>`;
}
forest += `<path d="M0 0h150c-40 110-52 203-34 306 14 155 19 312-6 505L0 896Z" fill="#102e29"/><path d="M88 0c-31 168-21 260-11 335 15 166 0 299-27 444" stroke="#2a4b37" stroke-width="19" fill="none" opacity=".55"/>
<path d="M1600 0h-123c39 174 23 261 5 367-19 138 0 316 32 454l86 67Z" fill="#102e29"/><path d="M1534 0c31 168 21 260 11 335-15 166 0 299 27 444" stroke="#2a4b37" stroke-width="17" fill="none" opacity=".55"/>
<path d="M0 0h578C462 59 397 98 301 100 231 172 135 147 0 161Zm1600 0h-404c56 74 137 101 211 98 68 75 135 80 193 76Z" fill="#0e2d27"/>
<path d="M0 887c167-57 267 8 414-12s253-7 383 20c184-27 343-40 451-10 162-40 240-41 352-4v119H0Z" fill="#1a392d"/>`;
function fern(x, y, scale, flip = false) {
 let s = `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})"><path d="M0 0q-8-95-73-157" stroke="#52764b" stroke-width="3" fill="none"/>`;
 for (let j=0; j<7; j++) {
  const t=j/7, a=-70*t*t, b=-150*t;
  s+=`<path d="M${a} ${b}q-50-5-61-36 38-3 61 36Z" fill="${j%2?'#3c6140':'#456b44'}"/><path d="M${a} ${b}q21-29 12-54-32 12-12 54Z" fill="#34583b"/>`;
 }
 return s+'</g>';
}
forest += fern(180, 990, 1.5)+fern(48, 956, 1.2, true)+fern(1490, 1000, 1.9, true)+fern(1360, 981, 1.05);
for (let i=0; i<23; i++) {
 const x=(i*277+53)%1600, y=270+(i*113)%610;
 forest+=`<circle cx="${x}" cy="${y}" r="${i%3===0?3:1.5}" fill="#e1d18a" opacity="${i%3===0?.65:.3}"/>`;
}
forest += `<g transform="translate(208 904)"><path d="m0 0-4 30h15L8 0m31 5-2 23h10L44 5" fill="#c1ac82"/><path d="M-20 4C-16-26 29-28 32 4c-15 7-36 7-52 0m39 5C22-13 57-15 62 9c-14 6-30 6-43 0" fill="#a56c51"/><g fill="#e6ba84"><circle cx="-3" cy="-7" r="4"/><circle cx="15" cy="-4" r="3"/><circle cx="42" cy="1" r="3"/></g></g>`;
await save('forest', 1600, 1000, forest);
console.log('Created 9 original SVG assets.');
