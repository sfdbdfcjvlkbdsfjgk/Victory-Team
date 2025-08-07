const CommunityPage = () => {
  const posts = [
    { id: 1, user: '运动达人', content: '今天打篮球真开心！', time: '2小时前' },
    { id: 2, user: '健身爱好者', content: '分享一下今天的训练成果', time: '4小时前' }
  ];

  return (
    <div className="community-page">
      <header className="page-header">
        <h1>运动圈</h1>
        <button className="post-btn">发布</button>
      </header>
      
      <div className="posts-list">
        {posts.map(post => (
          <div key={post.id} className="post-item">
            <div className="post-header">
              <span className="username">{post.user}</span>
              <span className="time">{post.time}</span>
            </div>
            <p className="post-content">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;