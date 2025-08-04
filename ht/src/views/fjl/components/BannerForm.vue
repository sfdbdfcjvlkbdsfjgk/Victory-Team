<template>
  <div class="simple-form-container">
    <el-form
      :model="formData"
      :rules="formRules"
      ref="formRef"
      label-width="120px"
      class="simple-form"
    >
      <el-form-item label="*所属运营位:" prop="locationType">
        <el-select
          v-model="formData.locationType"
          placeholder="请选择运营位"
          class="form-select"
        >
          <el-option label="首页banner位" value="首页banner位" />
          <el-option label="首页功能位" value="首页功能位" />
        </el-select>
      </el-form-item>

      <el-form-item label="*标题:" prop="title">
        <div class="input-with-hint">
          <el-input
            v-model="formData.title"
            placeholder="请输入标题"
            maxlength="30"
            show-word-limit
            class="form-input"
          />
          <span class="hint-text">1~30个字符</span>
        </div>
      </el-form-item>

      <el-form-item label="*图片上传:" prop="imageUrl">
        <FileUpload
          v-model="formData.imageUrl"
          :accept="uploadConfig.accept"
          :max-size="uploadConfig.maxSize"
          :upload-mode="uploadConfig.mode"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
          @upload-progress="handleUploadProgress"
        />
      </el-form-item>

      <el-form-item label="*跳转地址:" prop="redirectUrl">
        <div class="redirect-container">
          <el-select
            v-model="formData.redirectType"
            placeholder="请选择跳转类型"
            class="redirect-type-select"
          >
            <el-option label="内部" value="内部" />
            <el-option label="外部" value="外部" />
          </el-select>
          <el-input
            v-model="formData.redirectUrl"
            placeholder="请输入跳转地址"
            class="redirect-url-input"
          />
        </div>
      </el-form-item>

      <el-form-item label="*起止时间:" prop="timeRange">
        <el-date-picker
          v-model="formData.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
          class="form-date-picker"
          @change="handleTimeRangeChange"
        />
      </el-form-item>

      <el-form-item label="*状态:" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择状态"
          class="form-select"
        >
          <el-option label="待发布" value="待发布" />
          <el-option label="已发布" value="已发布" />
          <el-option label="已下线" value="已下线" />
        </el-select>
      </el-form-item>

      <el-form-item class="form-actions">
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
          class="submit-btn"
        >
          {{ isEdit ? '更新' : '提交' }}
        </el-button>
        <el-button @click="handleCancel" class="cancel-btn">
          返回
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, markRaw, defineEmits, defineProps, withDefaults } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import FileUpload from './FileUpload.vue';
import type { Banner } from '../api/banner';

interface Props {
  modelValue: Partial<Banner> & { timeRange?: any[] };
  isEdit?: boolean;
  submitLoading?: boolean;
  onlineLimit?: number;
}

interface Emits {
  (e: 'update:modelValue', value: Partial<Banner> & { timeRange?: any[] }): void;
  (e: 'submit', data: Partial<Banner>): void;
  (e: 'cancel'): void;
  (e: 'upload-progress', progress: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  submitLoading: false,
  onlineLimit: 5
});

const emit = defineEmits<Emits>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据 - 使用计算属性保持响应式
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 上传配置 - 使用markRaw优化
const uploadConfig = markRaw({
  accept: '.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.webm',
  maxSize: 10 * 1024 * 1024 * 1024, // 10GB
  mode: 'TURBO' as const
});

// 表单验证规则 - 使用markRaw优化
const formRules = markRaw({
  locationType: [
    { required: true, message: "请选择所属运营位", trigger: "change" },
  ],
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    { min: 1, max: 30, message: "标题长度在1到30个字符", trigger: "blur" },
  ],
  imageUrl: [{ required: true, message: "请上传图片", trigger: "blur" }],
  redirectUrl: [{ required: true, message: "请输入跳转地址", trigger: "blur" }],
  timeRange: [{ required: true, message: "请选择起止时间", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
});

// 检查图片大小
const checkImageSize = (imageUrl: string): boolean => {
  if (!imageUrl) return true;
  
  // 计算base64图片大小
  const base64Length = imageUrl.length;
  const sizeInBytes = Math.ceil((base64Length * 3) / 4);
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 10) {
    ElMessage.error(`图片大小 ${sizeInMB.toFixed(2)}MB 超过限制，请重新上传较小的图片`);
    return false;
  }
  
  return true;
};

// 检查上线数量限制
const checkOnlineLimit = async (): Promise<boolean> => {
  if (formData.value.locationType === "首页banner位" && formData.value.status === "已发布") {
    // 这里应该调用API检查，暂时返回true
    // 在实际应用中，你需要传入一个检查函数或者直接调用API
    try {
      // const response = await getBannerList({ 
      //   locationType: "首页banner位", 
      //   status: "已发布" 
      // });
      // if (response.data.code === 200) {
      //   const onlineCount = response.data.data.length;
      //   if (onlineCount >= props.onlineLimit) {
      //     ElMessage.error(`首页banner位最多只能有${props.onlineLimit}条上线数据`);
      //     return false;
      //   }
      // }
      return true;
    } catch (error) {
      console.error("检查上线数量失败:", error);
      return false;
    }
  }
  return true;
};

// 处理时间范围变化
const handleTimeRangeChange = (value: any): void => {
  if (value && value.length === 2) {
    const newFormData = { ...formData.value };
    newFormData.startTime = value[0];
    newFormData.endTime = value[1];
    emit('update:modelValue', newFormData);
  }
};

// 处理文件上传成功
const handleUploadSuccess = (result: any): void => {
  console.log('文件上传成功:', result);
};

// 处理文件上传错误
const handleUploadError = (error: any): void => {
  console.error('文件上传失败:', error);
};

// 处理上传进度
const handleUploadProgress = (progress: number): void => {
  emit('upload-progress', progress);
};

// 提交表单
const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    
    // 检查图片大小
    if (!checkImageSize(formData.value.imageUrl || '')) {
      return;
    }
    
    // 检查上线数量限制
    if (!(await checkOnlineLimit())) {
      return;
    }
    
    // 处理时间字段 - 确保从timeRange中提取时间
    let startTime = formData.value.startTime;
    let endTime = formData.value.endTime;
    
    if (formData.value.timeRange && formData.value.timeRange.length === 2) {
      startTime = formData.value.timeRange[0];
      endTime = formData.value.timeRange[1];
    }
    
    // 检查时间过期自动下线逻辑
    let finalStatus = formData.value.status;
    if (formData.value.status === "已发布" && endTime) {
      const currentTime = new Date();
      const endTimeDate = new Date(endTime);
      if (currentTime > endTimeDate) {
        try {
          await ElMessageBox.confirm(
            "当前时间大于结束时间，提交后将自动下线，确认要继续提交吗？",
            "提示",
            {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            }
          );
          // 自动将状态改为下线
          finalStatus = "已下线";
        } catch (error) {
          // 用户取消提交
          return;
        }
      }
    }
    
    // 准备提交的数据
    const submitData: Partial<Banner> = {
      locationType: formData.value.locationType,
      title: formData.value.title,
      imageUrl: formData.value.imageUrl,
      redirectType: formData.value.redirectType || '内部',
      redirectUrl: formData.value.redirectUrl,
      startTime: startTime,
      endTime: endTime,
      status: finalStatus,
    };
    
    // 为新创建的Banner添加默认sortOrder
    if (!props.isEdit) {
      submitData.sortOrder = Date.now(); // 使用时间戳作为默认排序
    }
    
    if (props.isEdit && formData.value._id) {
      submitData._id = formData.value._id;
    }
    
    // 开发环境下输出调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 提交数据:', submitData);
      console.log('🔍 时间范围:', formData.value.timeRange);
      console.log('⏰ 开始时间:', startTime);
      console.log('⏰ 结束时间:', endTime);
    }
    
    // 最终验证必要字段
    const requiredFields = ['locationType', 'title', 'imageUrl', 'redirectUrl', 'startTime', 'endTime', 'status'];
    const missingFields = requiredFields.filter(field => !submitData[field as keyof typeof submitData]);
    
    if (missingFields.length > 0) {
      ElMessage.error(`缺少必要字段: ${missingFields.join(', ')}`);
      console.error('❌ 缺少必要字段:', missingFields);
      return;
    }
    
    emit('submit', submitData);
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

// 取消表单
const handleCancel = (): void => {
  emit('cancel');
};

// 重置表单
const resetForm = (): void => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 验证表单
const validateForm = (): Promise<boolean> => {
  if (!formRef.value) return Promise.resolve(false);
  
  return formRef.value.validate().then(() => true).catch(() => false);
};

// 暴露方法
defineExpose({
  resetForm,
  validateForm
});
</script>

<style scoped>
.simple-form-container {
  width: 100%;
  padding: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.simple-form {
  width: 100%;
}

.form-select,
.form-input,
.form-date-picker {
  width: 100%;
}

.redirect-type-select {
  width: 120px;
  margin-right: 12px;
}

.redirect-url-input {
  flex: 1;
}

.input-with-hint {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-text {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}

.redirect-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn {
  min-width: 80px;
}

.submit-btn {
  min-width: 80px;
}

/* 表单样式优化 */
:deep(.el-form-item__label) {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-form-item__label::before) {
  content: "*";
  color: #f56c6c;
  margin-right: 4px;
}

:deep(.el-form-item.is-required .el-form-item__label::before) {
  display: inline;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .simple-form-container {
    padding: 16px;
  }
  
  .redirect-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .redirect-type-select {
    width: 100%;
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .input-with-hint {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .submit-btn,
  .cancel-btn {
    width: 100%;
  }
}

/* 加载状态优化 */
.form-loading {
  opacity: 0.6;
  pointer-events: none;
}

/* 动画效果 */
.simple-form-container {
  transition: all 0.3s ease;
}

.form-actions .el-button {
  transition: all 0.3s ease;
}

.form-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style> 