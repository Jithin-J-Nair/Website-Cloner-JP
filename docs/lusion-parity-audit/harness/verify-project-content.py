#!/usr/bin/env python3
"""Independent captured-schema versus rendered SSR content check, not visual parity."""
import html.parser
import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[3]
DATA = ROOT / 'src/data/reference/lusion-ground-truth.json'
OUT = ROOT / 'docs/lusion-parity-audit/data/implementation-01/project-content-browserless.json'
normal = lambda s: ' '.join(s.split())

class Page(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.main = False
        self.main_id = None
        self.meta, self.hrefs, self.images, self.media = {}, [], [], []
        self.texts = {'title': [], 'h1': [], 'p': [], 'li': []}
        self.collect = {}
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            self.meta[a.get('name') or a.get('property')] = a.get('content')
        if tag == 'main':
            self.main, self.main_id = True, a.get('id')
        if tag == 'title' or (self.main and tag in self.texts):
            self.collect[tag] = []
        if self.main:
            if a.get('data-project-media-type') == 'text':
                self.media.append(('text', int(a['data-project-media-index'])))
            if tag == 'a':
                self.hrefs.append(a.get('href'))
            if tag == 'img':
                self.images.append(a)
                m = re.search(r' — frame (\d+)$', a.get('alt', ''))
                if m:
                    self.media.append(('image', int(m.group(1)) - 1))
            if tag == 'div' and a.get('role') == 'button':
                m = re.search(r' — play sequence (\d+)$', a.get('aria-label', ''))
                if m:
                    self.media.append(('video', int(m.group(1)) - 1))
    def handle_data(self, text):
        for parts in self.collect.values():
            parts.append(text)
    def handle_endtag(self, tag):
        if tag in self.collect:
            self.texts[tag].append(normal(''.join(self.collect.pop(tag))))
        if tag == 'main':
            self.main = False

manifest = json.loads(DATA.read_text())
report = {'scope': '17 independent detail routes: rendered SSR title/metadata/paragraphs/services/links/gallery count+order/image URLs/next chain against authorized frozen manifest. Not visual, playback, source-image identity or external reachability acceptance.', 'states': [], 'passed': False}
try:
    for project in manifest['projectDetails']:
        with urllib.request.urlopen('http://127.0.0.1:3000' + project['route']) as response:
            assert response.status == 200
            page = Page()
            page.feed(response.read().decode())
        assert page.main_id == 'project-' + project['id']
        assert page.texts['title'] == [project['meta']['title']]
        # Existing canonical display mapping follows captured meta titles; raw
        # Porsche title omits a space and raw Spaace title omits its subtitle.
        assert page.texts['h1'] == [project['meta']['title'].removeprefix('Lusion - ')]
        assert page.meta['description'] == project['meta']['description']
        assert page.meta['og:title'] == project['meta']['ogTitle']
        for paragraph in project['paragraphs']:
            assert normal(paragraph['text']) in page.texts['p'], (project['route'], 'paragraph')
            for link in paragraph['links']:
                assert link['href'] in page.hrefs
        for service in project['services']:
            assert service in page.texts['li'], (project['route'], service)
        for link in project['links']:
            assert link['href'] in page.hrefs
        expected = [(m['type'], m['index']) for m in project['media']]
        assert page.media == expected, (project['route'], page.media, expected)
        assert len(page.media) == project['mediaCount']
        for media in project['media']:
            if media['type'] == 'text':
                assert normal(media['text']) in page.texts['p']
            if media['type'] == 'image':
                assert any(i.get('src') == media['desktopSrc'] for i in page.images)
        assert project['nextProject']['href'] in page.hrefs
        cta = project.get('launchCta')
        if cta and cta['href'] and not cta['isVimeoOverlay']:
            assert cta['href'] in page.hrefs
        report['states'].append({'route': project['route'], 'title': page.texts['title'][0], 'paragraphs': len(project['paragraphs']), 'services': len(project['services']), 'links': len(project['links']), 'gallery': page.media, 'next': project['nextProject']['href']})
        print('PASS captured content and full SSR gallery order:', project['route'])
    assert len(report['states']) == 17
    report['passed'] = True
finally:
    OUT.write_text(json.dumps(report, indent=2) + '\n')
