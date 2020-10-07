import React from 'react';

import './BlogPost.css';

function BlogPost(props) {
    const { isPaid, post } = props;
    const { title, preview, full_post } = post;

    const content = isPaid ? full_post : preview;
  
    return (
      <article>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{__html: content}} />
      </article>
    )
  }

export default BlogPost;