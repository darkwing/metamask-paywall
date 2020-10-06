import React from 'react';

function BlogPost(props) {
    const { isConnected, post } = props;
    const { title, preview, full_post } = post;

    const content = isConnected ? full_post : preview;
  
    return (
      <article>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{__html: content}} />
      </article>
    )
  }

export default BlogPost;