import React, { useState } from 'react';

import Blog from './Blog';

import './App.css';

function App() {
  const [post, setPost] = useState(null);

  // If we haven't loaded the blog post yet, do so while showing a loading message
  if(!post) {
    fetch('http://localhost:3001/')
      .then(res => res.json())
      .then(post => setPost(post))
      .catch(e => console.error('loadPost error! ', e));
      return <div>Loading...</div>;
  }
  
  return <Blog post={post} />;
}

export default App;
