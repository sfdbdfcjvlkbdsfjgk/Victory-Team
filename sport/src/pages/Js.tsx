import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from 'vant';
import 'vant/lib/index.css';


interface VideoFormData {
  title: string;
  category: string;
  popularity: number;
  thumbnailUrl: string;
  videoUrl: string;
  description: string;
}


export default function FitnessTutorial() {
  const navigate = useNavigate();
  




  // // 获取教程视频
  // const fetchTutorialVideos = async () => {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/videos`, {
  //       params: {
  //         category: 'tutorials',
  //         limit: 4
  //       }
  //     });
      
  //     if (response.data.code === 200) {
  //       setTutorialVideos(response.data.data.videos);
  //     } else {
  //       setError('获取教程视频失败');
  //     }
  //   } catch (err) {
  //     console.error('获取教程视频错误:', err);
  //     setError('获取教程视频失败');
  //   }
  // };



  // 模态框状态
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    category: '健身',
    popularity: 0,
    thumbnailUrl: '',
    videoUrl: '',
    description: ''
  });
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [uploadController, setUploadController] = useState<AbortController | null>(null);
  const [thumbnailUploadController, setThumbnailUploadController] = useState<AbortController | null>(null);
  const [uploadedChunks, setUploadedChunks] = useState<Set<number>>(new Set());
  const [currentFileId, setCurrentFileId] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [currentFileSize, setCurrentFileSize] = useState<number>(0);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [filteredVideos, setFilteredVideos] = useState([]);

  // 分类选项
  const categoryOptions = [
    { text: '全部', value: '全部' },
    { text: '健身', value: '健身' },
    { text: '瑜伽', value: '瑜伽' },
    { text: '篮球', value: '篮球' },
    { text: '跑步', value: '跑步' },
    { text: '足球', value: '足球' }
  ];

  // 获取视频列表
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/videos/list');
      console.log('获取视频列表响应 - 完整数据:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        config: response.config
      });
      console.log('获取视频列表响应 - 数据结构:', {
        code: response.data.code,
        msg: response.data.msg,
        data: response.data.data,
        dataType: typeof response.data.data,
        dataKeys: response.data.data ? Object.keys(response.data.data) : null
      });
      
      if (response.data.code === 200) {
        console.log('视频列表数据:', response.data.data);
        setVideos(response.data.data || []);
        setFilteredVideos(response.data.data || []);
      } else {
        showToast({ message: '获取视频列表失败' });
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
      showToast({ message: '获取视频列表失败' });
    } finally {
      setLoading(false);
    }
  };

  // 处理分类切换
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === '全部') {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter((video: any) => video.category === category);
      setFilteredVideos(filtered);
    }
  };

  // 组件加载时获取视频列表
  React.useEffect(() => {
    fetchVideos();
  }, []);

  // 打开模态框
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    // 中断正在进行的上传
    if (isUploading) {
      cancelVideoUpload();
    }
    if (isThumbnailUploading) {
      cancelThumbnailUpload();
    }
    
    setShowModal(false);
    setFormData({
      title: '',
      category: '健身',
      popularity: 0,
      thumbnailUrl: '',
      videoUrl: '',
      description: ''
    });
    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setUploadProgress(0);
    setThumbnailUploadProgress(0);
    setIsUploading(false);
    setIsThumbnailUploading(false);
    
    // 清空断点续传状态
    setUploadedChunks(new Set());
    setCurrentFileId('');
    setCurrentFileName('');
    setCurrentFileSize(0);
    
    // 清空所有文件输入框
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  };

  // 处理表单输入
  const handleInputChange = (field: keyof VideoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 中断视频上传
  const cancelVideoUpload = () => {
    if (uploadController) {
      uploadController.abort();
      setUploadController(null);
    }
    setIsUploading(false);
    setUploadProgress(0);
    // 清空文件输入框和表单数据中的视频URL
    const videoInput = document.querySelector('input[type="file"][accept*="video"]') as HTMLInputElement;
    if (videoInput) {
      videoInput.value = '';
    }
    setFormData(prev => ({
      ...prev,
      videoUrl: ''
    }));
    showToast({ message: '视频上传已暂停，可继续上传' });
  };

  // 中断缩略图上传
  const cancelThumbnailUpload = () => {
    if (thumbnailUploadController) {
      thumbnailUploadController.abort();
      setThumbnailUploadController(null);
    }
    setIsThumbnailUploading(false);
    setThumbnailUploadProgress(0);
    setSelectedThumbnailFile(null);
    // 清空文件输入框和表单数据中的缩略图URL
    const thumbnailInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement;
    if (thumbnailInput) {
      thumbnailInput.value = '';
    }
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: ''
    }));
    showToast({ message: '缩略图上传已暂停，可继续上传' });
  };



  // 处理视频文件选择
  const handleVideoFileSelect = (file: File) => {
    // 检查文件类型
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
    if (!allowedTypes.includes(file.type)) {
      showToast({ message: '只支持MP4、AVI、MOV、WMV格式的视频文件' });
      return false;
    }
    
    setSelectedVideoFile(file);
    // 立即开始上传视频文件
    uploadVideoFileImmediately(file);
    return true;
  };

  // 处理视频文件输入框变化
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVideoFileSelect(file);
    }
  };

  // 立即上传视频文件
  const uploadVideoFileImmediately = async (file: File) => {
    // 检查是否是同一个文件，如果是则继续上传
    const isSameFile = currentFileName === file.name && currentFileSize === file.size;
    
    if (!isSameFile) {
      // 新文件，重置所有状态
      setUploadedChunks(new Set());
      setCurrentFileId(`${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      setCurrentFileName(file.name);
      setCurrentFileSize(file.size);
    }
    
    setIsUploading(true);
    
    try {
      const videoUrl = await uploadVideoFile(file);
      // 更新表单数据中的视频URL
      setFormData(prev => ({
        ...prev,
        videoUrl: videoUrl
      }));
      showToast({ type: 'success', message: '视频上传成功！' });
      // 上传成功后清空状态
      setUploadedChunks(new Set());
      setCurrentFileId('');
      setCurrentFileName('');
      setCurrentFileSize(0);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Upload cancelled' || error.code === 'ERR_CANCELED') {
        // 这是用户主动暂停，保留状态用于断点续传
        showToast({ message: '视频上传已暂停，可继续上传' });
      } else {
        console.error('视频上传失败:', error);
        showToast({ message: '视频上传失败，请重试' });
        // 上传失败时清空状态
        setUploadedChunks(new Set());
        setCurrentFileId('');
        setCurrentFileName('');
        setCurrentFileSize(0);
        setSelectedVideoFile(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 处理缩略图文件选择
  const handleThumbnailFileSelect = (file: File) => {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast({ message: '只支持JPEG、PNG、GIF、WebP格式的图片文件' });
      return false;
    }
    
    // 检查文件大小 (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast({ message: '缩略图文件大小不能超过5MB' });
      return false;
    }
    
    setSelectedThumbnailFile(file);
    // 立即开始上传缩略图
    uploadThumbnailFileImmediately(file);
    return true;
  };

  // 处理缩略图文件输入框变化
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailFileSelect(file);
    }
  };

  // 立即上传缩略图文件
  const uploadThumbnailFileImmediately = async (file: File) => {
    setIsThumbnailUploading(true);
    setThumbnailUploadProgress(0);
    
    // 创建 AbortController 用于中断上传
    const controller = new AbortController();
    setThumbnailUploadController(controller);
    
    try {
      const thumbnailUrl = await uploadThumbnailFile(file);
      // 更新表单数据中的缩略图URL
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: thumbnailUrl
      }));
      showToast({ type: 'success', message: '缩略图上传成功！' });
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Upload cancelled' || error.code === 'ERR_CANCELED') {
        // 这是用户主动取消，不需要在控制台显示错误
        showToast({ message: '缩略图上传已取消' });
      } else {
        console.error('缩略图上传失败:', error);
        showToast({ message: '缩略图上传失败，请重试' });
      }
      setSelectedThumbnailFile(null);
    } finally {
      setIsThumbnailUploading(false);
      setThumbnailUploadProgress(0);
      setThumbnailUploadController(null);
    }
  };

  // 分片上传视频文件
  const uploadVideoFile = async (file: File): Promise<string> => {
    const chunkSize = 1024 * 1024; // 1MB 分片
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = currentFileId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('开始分片上传:', {
      fileName: file.name,
      fileSize: file.size,
      totalChunks: totalChunks,
      fileId: fileId
    });
    
    // 创建 AbortController 用于中断上传
    const controller = new AbortController();
    setUploadController(controller);

    try {
      // 检查文件是否已存在
      const checkResponse = await axios.get(`http://localhost:3000/api/upload/check/${file.name}`);
      console.log('文件检查响应 - 完整数据:', {
        status: checkResponse.status,
        statusText: checkResponse.statusText,
        headers: checkResponse.headers,
        data: checkResponse.data,
        config: checkResponse.config
      });
      console.log('文件检查响应 - 数据结构:', {
        code: checkResponse.data.code,
        msg: checkResponse.data.msg,
        data: checkResponse.data.data,
        dataType: typeof checkResponse.data.data,
        dataKeys: checkResponse.data.data ? Object.keys(checkResponse.data.data) : null
      });
      
      if (checkResponse.data.code === 200 && checkResponse.data.data && checkResponse.data.data.exists) {
        const videoUrl = checkResponse.data.data.videoUrl;
        console.log('文件已存在，视频URL:', videoUrl);
        
        // 如果是相对路径，转换为完整URL
        if (videoUrl && !videoUrl.startsWith('http')) {
          const fullUrl = `http://localhost:3000${videoUrl}`;
          console.log('转换为完整URL:', fullUrl);
          return fullUrl;
        }
        
        return videoUrl;
      } else {
        console.log('文件不存在或检查失败:', checkResponse.data);
      }

      // 检查已上传的分片状态
      const statusResponse = await axios.get(`http://localhost:3000/api/upload/chunk/status/${fileId}`);
      console.log('分片状态检查响应 - 完整数据:', {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        headers: statusResponse.headers,
        data: statusResponse.data,
        config: statusResponse.config
      });
      console.log('分片状态检查响应 - 数据结构:', {
        code: statusResponse.data.code,
        msg: statusResponse.data.msg,
        data: statusResponse.data.data,
        dataType: typeof statusResponse.data.data,
        dataKeys: statusResponse.data.data ? Object.keys(statusResponse.data.data) : null
      });
      
      if (statusResponse.data.code === 200 && statusResponse.data.data.uploadedChunks) {
        const serverUploadedChunks = new Set<number>(statusResponse.data.data.uploadedChunks.map((chunk: any) => Number(chunk)));
        setUploadedChunks(serverUploadedChunks);
      }

      // 分片上传
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (controller.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        // 跳过已上传的分片
        if (uploadedChunks.has(chunkIndex)) {
          const progress = ((chunkIndex + 1) / totalChunks) * 100;
          setUploadProgress(Math.round(progress));
          continue;
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // 直接使用二进制数据，不转换为Base64
        const formData = new FormData();
        formData.append('chunk', chunk, `chunk_${chunkIndex}.bin`);
        formData.append('fileId', fileId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);

        const response = await axios.post('http://localhost:3000/api/upload/chunk', formData, {
          signal: controller.signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const chunkProgress = (progressEvent.loaded / progressEvent.total) * (100 / totalChunks);
              const totalProgress = (chunkIndex * (100 / totalChunks)) + chunkProgress;
              setUploadProgress(Math.round(totalProgress));
            }
          }
        });

        console.log(`分片 ${chunkIndex + 1}/${totalChunks} 上传响应 - 完整数据:`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          config: response.config
        });
        console.log(`分片 ${chunkIndex + 1}/${totalChunks} 上传响应 - 数据结构:`, {
          code: response.data.code,
          msg: response.data.msg,
          data: response.data.data,
          dataType: typeof response.data.data,
          dataKeys: response.data.data ? Object.keys(response.data.data) : null
        });

        if (response.data.code !== 200) {
          throw new Error(response.data.msg || '分片上传失败');
        }

        // 标记分片已上传
        setUploadedChunks(prev => new Set([...prev, chunkIndex]));
        console.log(`分片 ${chunkIndex + 1}/${totalChunks} 上传完成`);

        // 如果是最后一个分片，检查响应中是否包含videoUrl
        if (chunkIndex === totalChunks - 1) {
          console.log('最后一个分片上传完成，检查响应中的videoUrl:', response.data);
          if (response.data.data && response.data.data.videoUrl) {
            const videoUrl = response.data.data.videoUrl;
            console.log('从最后一个分片响应中获取到videoUrl:', videoUrl);
            
            // 如果是相对路径，转换为完整URL
            if (videoUrl && !videoUrl.startsWith('http')) {
              const fullUrl = `http://localhost:3000${videoUrl}`;
              console.log('转换为完整URL:', fullUrl);
              return fullUrl;
            }
            
            return videoUrl;
          }
        }
      }

      console.log('所有分片上传完成，检查文件状态...');
      // 使用现有的状态检查接口获取文件URL
      const finalResponse = await axios.get(`http://localhost:3000/api/upload/chunk/status/${fileId}`, {
        signal: controller.signal
      });

      console.log('最终分片状态检查响应 - 完整数据:', {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: finalResponse.headers,
        data: finalResponse.data,
        config: finalResponse.config
      });
      console.log('最终分片状态检查响应 - 数据结构:', {
        code: finalResponse.data.code,
        msg: finalResponse.data.msg,
        data: finalResponse.data.data,
        dataType: typeof finalResponse.data.data,
        dataKeys: finalResponse.data.data ? Object.keys(finalResponse.data.data) : null
      });

      if (finalResponse.data.code === 200) {
        // 根据后端接口，返回的数据结构可能是 { data: { videoUrl: '/uploads/videos/filename.mp4' } }
        const videoUrl = finalResponse.data.data.videoUrl || finalResponse.data.data.url;
        console.log('文件上传成功，视频URL:', videoUrl);
        
        // 如果是相对路径，转换为完整URL
        if (videoUrl && !videoUrl.startsWith('http')) {
          const fullUrl = `http://localhost:3000${videoUrl}`;
          console.log('转换为完整URL:', fullUrl);
          return fullUrl;
        }
        
        return videoUrl;
      } else {
        throw new Error(finalResponse.data.msg || '获取上传结果失败');
      }

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Upload cancelled') {
        throw new Error('Upload cancelled');
      }
      throw error;
    } finally {
      setUploadController(null);
    }
  };

  // 上传缩略图文件（普通上传，不分片）
  const uploadThumbnailFile = async (file: File): Promise<string> => {
    console.log('开始上传缩略图:', file.name);
    
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await axios.post('http://localhost:3000/api/upload/thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: thumbnailUploadController?.signal,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setThumbnailUploadProgress(progress);
        }
      }
    });

    console.log('缩略图上传响应 - 完整数据:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: response.config
    });
    console.log('缩略图上传响应 - 数据结构:', {
      code: response.data.code,
      msg: response.data.msg,
      data: response.data.data,
      dataType: typeof response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : null
    });

    if (response.data.code === 200) {
      const thumbnailUrl = response.data.data.thumbnailUrl;
      console.log('缩略图上传成功，URL:', thumbnailUrl);
      return thumbnailUrl;
    } else {
      throw new Error(response.data.msg);
    }
  };

  // 发布视频
  const handlePublishVideo = async () => {
    console.log('发布视频 - 表单数据:', formData);
    
    // 验证必填字段
    if (!formData.title || !formData.title.trim()) {
      showToast({ message: '请输入视频标题' });
      return;
    }

    if (!formData.videoUrl) {
      showToast({ message: '请先上传视频文件' });
      return;
    }

    if (!formData.thumbnailUrl) {
      showToast({ message: '请先上传缩略图' });
      return;
    }

    try {
      // 发布视频信息（文件已经上传完成）
      const updatedFormData = {
        title: formData.title.trim(),
        category: formData.category,
        popularity: parseInt(formData.popularity.toString()) || 0,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl,
        description: formData.description.trim()
      };

      // 发布视频信息
      const response = await axios.post('http://localhost:3000/api/videos/add', updatedFormData);
      console.log('发布视频响应 - 完整数据:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        config: response.config
      });
      console.log('发布视频响应 - 数据结构:', {
        code: response.data.code,
        msg: response.data.msg,
        data: response.data.data,
        dataType: typeof response.data.data,
        dataKeys: response.data.data ? Object.keys(response.data.data) : null
      });
      
      if (response.data.code === 200) {
        showToast({ type: 'success', message: '视频发布成功！' });
        handleCloseModal();
        // 刷新视频列表
        fetchVideos();
        // 重置分类选择
        setSelectedCategory('全部');
      } else {
        showToast({ type: 'fail', message: '发布失败：' + response.data.msg });
      }
        } catch (error) {
      console.error('发布视频失败:', error);
      showToast({ type: 'fail', message: '发布失败，请检查网络连接' });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // 格式化视频时长
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '10:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }
  };

  // 获取视频时长（从视频文件URL）
  const getVideoDuration = (video: any): string => {
    // 如果后端返回了时长字段，直接使用
    if (video.duration) return formatDuration(video.duration);
    if (video.videoLength) return formatDuration(video.videoLength);
    if (video.length) return formatDuration(video.length);
    
    // 如果没有时长信息，返回默认值
    return '10:00';
  };

  // 处理视频点击
  const handleVideoClick = (video: any) => {
    // 构建视频URL
    let videoUrl = video.videoUrl;
    if (videoUrl && !videoUrl.startsWith('http')) {
      videoUrl = `http://localhost:3000${videoUrl}`;
    }
    
    // 验证视频URL是否可访问
    const testVideoAccess = async () => {
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.error('视频文件无法访问:', videoUrl, '状态码:', response.status);
          showToast({ message: '视频文件暂时无法访问，请稍后重试' });
          return false;
        }
        return true;
      } catch (error) {
        console.error('视频文件访问失败:', error);
        showToast({ message: '视频文件访问失败，请检查网络连接' });
        return false;
      }
    };
    
    // 先测试视频可访问性，再跳转
    testVideoAccess().then(canAccess => {
      if (canAccess) {
        navigate(`/video/${video._id}`, { 
          state: { 
            video: video,
            videoUrl: videoUrl,
            thumbnailUrl: `http://localhost:3000${video.thumbnail}`
          } 
        });
      }
    });
  };

  return (
    <div style={{
      backgroundColor: '#f7f8fa',
      minHeight: '100vh',
      paddingBottom: '80px'
    }}>
      {/* 头部导航 */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderBottom: '1px solid #e5e5e5',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <button 
              onClick={handleBack}
              style={{ 
                marginRight: '12px',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#409eff'
              }}
            >
              返回
            </button>
            <h1 style={{ 
              margin: 0, 
              fontSize: '18px', 
              color: '#333',
              fontWeight: '600'
            }}>
              健身教程
            </h1>
          </div>
          <button 
            onClick={handleOpenModal}
            style={{
              backgroundColor: '#409eff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            发布视频
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '20px' }}>
        {/* 分类切换 */}
        <div 
          style={{
            marginBottom: '20px',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onWheel={(e) => {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaY;
          }}
        >
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '4px 0',
            minWidth: 'max-content'
          }}>
            {categoryOptions.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedCategory === category.value ? '#409eff' : '#f5f5f5',
                  color: selectedCategory === category.value ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: selectedCategory === category.value ? '600' : '400',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {category.text}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '16px', color: '#969799' }}>加载中...</div>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '16px', color: '#969799', marginBottom: '20px' }}>
              {selectedCategory === '全部' ? '暂无视频，点击上方按钮发布第一个视频' : `暂无${selectedCategory}分类的视频`}
            </div>
            <button
              onClick={handleOpenModal}
              style={{
                backgroundColor: '#409eff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              发布视频
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px'
          }}>
            {filteredVideos.map((video: any, index: number) => (
              <div
                key={video._id || index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => handleVideoClick(video)}
              >
                {/* 视频缩略图区域 */}
                <div style={{
                  width: '100%',
                  height: '180px',
                  backgroundColor: '#f5f5f5',
                  backgroundImage: video.thumbnail ? `url(http://localhost:3000${video.thumbnail})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* 播放按钮 */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderLeft: '12px solid #333',
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      marginLeft: '4px'
                    }} />
                  </div>
                  
                  {/* 视频时长 */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {getVideoDuration(video)}
                  </div>
                  
                  {/* 无缩略图时的占位符 */}
                  {!video.thumbnail && (
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#999',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: '8px 16px',
                      borderRadius: '6px'
                    }}>
                      暂无缩略图
                    </div>
                  )}
                </div>
                
                {/* 视频信息区域 */}
                <div style={{ padding: '12px' }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#323233',
                    margin: '0 0 6px 0',
                    lineHeight: '1.4',
                    height: '40px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {video.title || '视频标题'}
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#969799'
                  }}>
                    <span style={{
                      backgroundColor: '#e1f3ff',
                      color: '#409eff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      {video.category || '健身'}
                    </span>
                    <span style={{ fontSize: '11px' }}>
                      {video.createTime ? new Date(video.createTime).toLocaleDateString() : '未知时间'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 发布视频模态框 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>发布视频</h2>
              <button 
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handlePublishVideo(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
                  视频标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>



              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
                  分类 *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="健身">健身</option>
                  <option value="瑜伽">瑜伽</option>
                  <option value="篮球">篮球</option>
                  <option value="跑步">跑步</option>
                  <option value="足球">足球</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
                  上传缩略图 *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleThumbnailFileChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
                {selectedThumbnailFile && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#409eff'
                  }}>
                    已选择: {selectedThumbnailFile.name}
                  </div>
                )}
                {isThumbnailUploading && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#409eff'
                      }}>
                        缩略图上传进度: {thumbnailUploadProgress}%
                      </div>
                      <button
                        onClick={cancelThumbnailUpload}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        中断
                      </button>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: '#e1f3ff',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${thumbnailUploadProgress}%`,
                        height: '100%',
                        backgroundColor: '#409eff',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
                  上传视频文件 *
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/mov,video/wmv"
                  onChange={handleVideoFileChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
                {selectedVideoFile && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#409eff'
                  }}>
                    已选择: {selectedVideoFile.name}
                  </div>
                )}
                {isUploading && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#409eff'
                      }}>
                        上传进度: {uploadProgress}%
                      </div>
                      <button
                        onClick={cancelVideoUpload}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        暂停
                      </button>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: '#e1f3ff',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        backgroundColor: '#409eff',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
                  视频描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>


              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isUploading || isThumbnailUploading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: (isUploading || isThumbnailUploading) ? '#ccc' : '#409eff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (isUploading || isThumbnailUploading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {(isUploading || isThumbnailUploading) ? '上传中...' : '发布视频'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}