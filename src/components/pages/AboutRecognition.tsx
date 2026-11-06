import { LUSION_ABOUT } from "@/data/reference";

/** The recording shows three consecutive full-page rows, not a pinned category
 * sidebar beside an independently clipped table. PageDown follows page flow.
 */
export function AboutRecognition() {
  const recognition = LUSION_ABOUT.recognition;
  return (
    <section id="about-award" className="about-source-recognition" onPointerMove={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--award-pointer-x", `${(event.clientX - rect.left) / rect.width * 100}%`);
      event.currentTarget.style.setProperty("--award-pointer-y", `${(event.clientY - rect.top) / rect.height * 100}%`);
    }}>
      <div className="about-source-monument" aria-hidden="true" data-awards-word>
        <div>{["AWARD", "WINNING", "MULTI", "DISCIPLINARY", "CREATIVE", "STUDIO"].map((word, i) =>
          <span key={word} className={i % 2 ? "is-slanted" : ""}>{word}</span>)}</div>
      </div>
      <div id="about-recognition-window" role="region" aria-label="Awards, articles and talks" tabIndex={0}>
        <section className="about-source-record" aria-labelledby="about-awards-record-title">
          <h2 id="about-awards-record-title">AWARDS</h2>
          <div className="about-source-record-count"><span aria-hidden="true">✳</span> {recognition.awardsDisplayedTotal}</div>
          <div className="about-source-record-data">
            {recognition.awardGroups.map(group => <div className="about-source-award-group" key={group.organization}>
              <h3>{group.organization}</h3>
              <ul>{group.honors.map(honor => <li key={honor.recognition}>
                <span className="about-source-count">{honor.countFormatted}</span><span>{honor.recognition}</span>
              </li>)}</ul>
            </div>)}
          </div>
        </section>
        <section className="about-source-record" aria-labelledby="about-articles-record-title">
          <h2 id="about-articles-record-title">ARTICLES</h2>
          <div className="about-source-record-count"><span aria-hidden="true">✦</span> {recognition.articlesDisplayedTotal}</div>
          <ul className="about-source-record-data about-source-articles">{recognition.articles.map(article => <li key={article.href}>
            <a href={article.href} target="_blank" rel="noopener noreferrer">{article.title}<span aria-hidden="true">↗</span></a>
          </li>)}</ul>
        </section>
        <section className="about-source-record" aria-labelledby="about-talks-record-title">
          <h2 id="about-talks-record-title">TALKS</h2>
          <div className="about-source-record-count"><span aria-hidden="true">▦</span> {recognition.talksDisplayedTotal}</div>
          <ul className="about-source-record-data about-source-talks">{recognition.talks.map(talk => <li key={`${talk.event}-${talk.dateAndLocation}`}>
            <span>{talk.event}</span><span>{talk.dateAndLocation}</span>
          </li>)}</ul>
        </section>
      </div>
    </section>
  );
}
