#!/usr/bin/env python3
"""Generate the recognition outline from the bundled OFL Instrument Sans.

Requires fonttools with woff2/Brotli and skia-pathops support. The font itself remains unmodified.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib.removeOverlaps import removeOverlaps

root = Path(__file__).resolve().parent.parent
font = TTFont(root / 'public/assets/fonts/InstrumentSans-Variable.woff2')
font = instantiateVariableFont(font, {'wght': 700}, inplace=True)
# Variable-font glyphs contain overlapping components. Union their contours
# before vector export so M/W and other letters have no internal seams.
removeOverlaps(font)
glyphs, cmap, metrics = font.getGlyphSet(), font.getBestCmap(), font['hmtx'].metrics
words = ['MAKING', 'COMPLEX', 'THINGS', 'WORK.']

def advance(word):
    return sum(metrics[cmap[ord(c)]][0] for c in word)

# Equal font size and weight for every word, with a generous left/right margin.
scale = min(.315, 1350 / max(map(advance, words)))
result = []
for row, word in enumerate(words):
    bounds = BoundsPen(glyphs)
    x = 0
    for char in word:
        name = cmap[ord(char)]
        glyphs[name].draw(TransformPen(bounds, (1, 0, 0, 1, x, 0)))
        x += metrics[name][0]
    xmin, ymin, xmax, ymax = bounds.bounds
    x = 45 - xmin * scale
    baseline = row * 312.5 + (312.5 + (ymax + ymin) * scale) / 2
    pen = SVGPathPen(glyphs)
    for char in word:
        name = cmap[ord(char)]
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        x += metrics[name][0] * scale
    result.append(f'  <path data-line="{word}" d="{pen.getCommands()}"/>')
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 1250" '
       'fill="#080b0d" stroke="#38424a" stroke-width=".8">\n'
       '  <title>MAKING COMPLEX THINGS WORK.</title>\n' + '\n'.join(result) + '\n</svg>\n')
(root / 'public/sites/jithin/recognition-title.svg').write_text(svg)
print('Generated four upright equal-weight lines, scale', scale)
