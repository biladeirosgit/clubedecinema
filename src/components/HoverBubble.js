import React from 'react';
import './HoverBubble.css';

// Linha cujo detalhe so aparece no hover (ou no foco). O tracejado e o cursor
// de ajuda avisam que ha ali algo escondido.
// `focusable` fica a false quando o conteudo ja tem um link dentro: esse trata
// do foco sozinho e um tabIndex extra so duplicava a paragem de tab.
export const HoverAnchor = ({ children, detail, focusable = true }) => (
    <span className="hover-anchor hover-anchor--hinted" tabIndex={focusable ? 0 : undefined}>
        {children}
        <span className="hover-bubble hover-bubble--left">{detail}</span>
    </span>
);

// Os filmes por tras de um numero, um por linha. Cortada porque um genero pode
// ter dezenas e a bolha nao e sitio para uma lista interminavel.
export const MovieLines = ({ movies, limit = 8 }) => (
    <>
        {movies.slice(0, limit).map((m) => (
            <span className="hover-bubble-line" key={m.slug}>
                {m.title} ({m.year}) &mdash; {m.rating.toFixed(2)}
            </span>
        ))}
        {movies.length > limit && (
            <span className="hover-bubble-line">&hellip; e mais {movies.length - limit}</span>
        )}
    </>
);
