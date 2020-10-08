import React from 'react';

import './Article.css';

function Article(props) {
    const { isPaid, post } = props;
    const { title, preview, full_post } = post;
    const content = isPaid ? full_post : preview;

    return (
      <article>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content || `Oops, we have confirmed your payment but don't have the full contents!` }} />
      </article>
    )
  }

export default Article;