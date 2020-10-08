import React, { useState } from 'react';

import Blog from './Blog';

import './App.css';

async function loadPost(setPost) {
  fetch('http://localhost:3001/')
    .then(res => res.json())
    .then(post => setPost(post))
    .catch(e => console.error('loadPost error! ', e));
}

function App() {
  const [post, setPost] = useState(null);

  if(!post) {
    loadPost(setPost);
    return <div>Loading...</div>;
  }
  else {
    return <Blog post={post} />;
  }
}

export default App;
