import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface VideoTestData {
  fileName: string;
  exists: boolean;
  fileSize?: number;
  fileSizeMB?: string;
  videoUrl?: string;
  staticUrl?: string;
  createTime?: string;
}

export default function TestValidation() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [testResults, setTestResults] = useState<VideoTestData | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取视频列表
  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/videos/list');
      if (response.data.code === 200) {
        setVideos(response.data.data);
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
    }
  };

  // 测试视频文件
  const testVideoFile = async (fileName: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/videos/check/${fileName}`);
      setTestResults(response.data.data);
    } catch (error) {
      console.error('测试视频文件失败:', error);
      setTestResults(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>视频播放测试</h1>
      
      {/* 视频选择 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>选择要测试的视频：</h3>
        <select 
          value={selectedVideo} 
          onChange={(e) => setSelectedVideo(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        >
          <option value="">请选择视频</option>
          {videos.map((video) => (
            <option key={video._id} value={video.videoUrl?.split('/').pop() || ''}>
              {video.title} ({video.videoUrl?.split('/').pop()})
            </option>
          ))}
        </select>
        
        <button 
          onClick={() => selectedVideo && testVideoFile(selectedVideo)}
          disabled={!selectedVideo || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#409eff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedVideo ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? '测试中...' : '测试视频文件'}
        </button>
      </div>

      {/* 测试结果 */}
      {testResults && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>测试结果：</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {/* 视频播放测试 */}
      {selectedVideo && testResults?.exists && (
        <div style={{ marginBottom: '20px' }}>
          <h3>视频播放测试：</h3>
          
          {/* 直接静态访问 */}
          <div style={{ marginBottom: '15px' }}>
            <h4>方式1: 直接静态文件访问</h4>
            <video
              controls
              preload="metadata"
              style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000' }}
              onError={(e) => console.error('静态文件播放错误:', e)}
              onLoadStart={() => console.log('静态文件开始加载')}
              onCanPlay={() => console.log('静态文件可以播放')}
            >
              <source src={testResults.staticUrl} type="video/mp4" />
              静态文件播放失败
            </video>
          </div>

          {/* API播放 */}
          <div style={{ marginBottom: '15px' }}>
            <h4>方式2: API流式播放</h4>
            <video
              controls
              preload="metadata"
              style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000' }}
              onError={(e) => console.error('API播放错误:', e)}
              onLoadStart={() => console.log('API开始加载')}
              onCanPlay={() => console.log('API可以播放')}
            >
              <source src={testResults.videoUrl} type="video/mp4" />
              API播放失败
            </video>
          </div>

          {/* 调试信息 */}
          <div style={{ fontSize: '12px', color: '#666' }}>
            <p><strong>静态URL:</strong> {testResults.staticUrl}</p>
            <p><strong>API URL:</strong> {testResults.videoUrl}</p>
            <p><strong>文件大小:</strong> {testResults.fileSizeMB} MB</p>
          </div>
        </div>
      )}

      {/* 视频列表 */}
      <div>
        <h3>所有视频列表：</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {videos.map((video) => (
            <div key={video._id} style={{ 
              padding: '10px', 
              border: '1px solid #ddd', 
              margin: '5px 0',
              borderRadius: '4px'
            }}>
              <strong>{video.title}</strong><br/>
              <small>URL: {video.videoUrl}</small><br/>
              <small>创建时间: {new Date(video.createTime).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 