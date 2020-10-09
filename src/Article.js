import React from 'react';

import './Article.css';

function Article(props) {
    const { isPaid, post } = props;
    const { title, preview, full_post } = post;
    const content = isPaid ? full_post : preview;

    return (
      <article>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </article>
    )
  }

export default Article;