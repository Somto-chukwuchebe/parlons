// Generates app icons and iOS splash screens from the logo (option D4).
// Run with: npm run icons   (outputs go to public/icons and public/splash)
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const NAVY = '#0F2A6B'
const RED = '#EF4135'
const WHITE = '#FFFFFF'

// The "talking p" drawn on a 120×120 grid, shifted so it sits optically centred.
const glyph = `
  <g transform="translate(-7.75 -1.25)">
    <rect x="34" y="24" width="13" height="78" rx="6.5" fill="${RED}"/>
    <circle cx="72" cy="50" r="23" fill="none" stroke="${WHITE}" stroke-width="13"/>
    <path d="M84 68 L100 86 L76 74 Z" fill="${WHITE}"/>
  </g>`

/** Square icon. `scale` < 1 shrinks the glyph (for maskable safe zones). `radius` rounds the tile. */
function iconSvg(size, { scale = 1, radius = 0 } = {}) {
  const s = scale
  const offset = (120 - 120 * s) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="${radius}" fill="${NAVY}"/>
    <g transform="translate(${offset} ${offset}) scale(${s})">${glyph}</g>
  </svg>`
}

function splashSvg(w, h) {
  const tile = Math.round(Math.min(w, h) * 0.28)
  const x = (w - tile) / 2
  const y = (h - tile) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${NAVY}"/>
    <svg x="${x}" y="${y}" width="${tile}" height="${tile}" viewBox="0 0 120 120">${glyph}</svg>
  </svg>`
}

// iOS splash sizes: [css width, css height, pixel ratio]. Portrait only.
const SPLASH = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3],
  [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3],
  [375, 667, 2], [320, 568, 2], [1024, 1366, 2], [834, 1194, 2], [820, 1180, 2],
  [810, 1080, 2], [768, 1024, 2], [744, 1133, 2],
]

const png = (svg) => sharp(Buffer.from(svg)).png().toBuffer()

await mkdir('public/icons', { recursive: true })
await mkdir('public/splash', { recursive: true })

await writeFile('public/icons/logo.svg', iconSvg(512, { radius: 26 }))
await writeFile('public/icons/icon-192.png', await png(iconSvg(192)))
await writeFile('public/icons/icon-512.png', await png(iconSvg(512)))
await writeFile('public/icons/maskable-512.png', await png(iconSvg(512, { scale: 0.78 })))
await writeFile('public/icons/apple-touch-icon.png', await png(iconSvg(180)))
await writeFile('public/icons/favicon-32.png', await png(iconSvg(32, { radius: 26 })))

const links = []
for (const [cw, ch, dpr] of SPLASH) {
  const w = cw * dpr
  const h = ch * dpr
  const name = `splash-${w}x${h}.png`
  await writeFile(`public/splash/${name}`, await png(splashSvg(w, h)))
  links.push(
    `    <link rel="apple-touch-startup-image" href="splash/${name}" media="(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" />`,
  )
}

// Write the splash <link> tags into index.html between the markers.
const html = await readFile('index.html', 'utf8')
const start = '<!-- splash:start -->'
const end = '<!-- splash:end -->'
const next = html.replace(
  new RegExp(`${start}[\\s\\S]*${end}`),
  `${start}\n${links.join('\n')}\n    ${end}`,
)
await writeFile('index.html', next)
console.log(`Wrote icons and ${SPLASH.length} splash screens.`)
