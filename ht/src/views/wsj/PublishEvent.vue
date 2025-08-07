<template>
  <div class="publish-event">


    <h2>发布活动（含赛事活动）</h2>
    <div class="publish-content">
      <el-form :model="eventForm" label-width="120px" :rules="rules" ref="formRef">
        <!-- 类型选择 -->
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="eventForm.type">
            <el-radio label="活动">活动</el-radio>
            <el-radio label="赛事">赛事</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 标题输入 -->
        <el-form-item label="*标题:" prop="title">
          <el-input v-model="eventForm.title" 
            placeholder="请输入标题"
            style="width: 300px;"
          ></el-input>
          <span class="hint-text">5~30个字符</span>
        </el-form-item>
        
        <!-- 运动标签选择 -->
        <el-form-item label="*运动标签:" prop="sportTag">
          <el-select 
            v-model="eventForm.sportTag" 
            placeholder="请选择"
            style="width: 200px;"
          >
            <el-option 
              v-for="tag in sportTags" 
              :key="tag.value" 
              :label="tag.label" 
              :value="tag.value"
            ></el-option>
          </el-select>
          <el-button type="primary" @click="showTagModal" style="margin-left: 10px;">
            +新增标签
          </el-button>
        </el-form-item>
        
        <!-- 内容简介（富文本编辑器） -->
        <el-form-item label="*内容简介:" prop="content">
          <el-card class="editor-card" shadow="never">
            <template #header>
              <div class="card-header">
                <!-- <el-icon><Document /></el-icon> -->
                <!-- <span>内容编辑器</span> -->
              </div>
            </template>
            <QuillEditor
              ref="quillEditorRef"
              v-model:content="eventForm.content"
              contentType="html"
              theme="snow"
              :options="editorOptions"
              @ready="onEditorReady"
              @textChange="onTextChange"
              style="height: 300px;"
            />
          </el-card>
        </el-form-item>
        
        <!-- 封面图片上传 -->
        <el-form-item label="*封面图片:" prop="coverImage">
          <div class="upload-container">
            <div class="upload-area" @click="triggerFileUpload">
              <div v-if="!eventForm.coverImage" class="upload-placeholder">
                <i class="el-icon-plus upload-icon"></i>
                <p>上传照片</p>
              </div>
              <img v-else :src="eventForm.coverImage" class="uploaded-image" />
            </div>
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileUpload" 
              accept="image/*" 
              style="display: none;"
            />
            <div class="upload-hint">
              最佳尺寸: 480*270px, 支持JPG、PNG、GIF
            </div>
          </div>
        </el-form-item>
        

        
        <!-- 报名起止时间 -->
        <el-form-item label="*报名起止时间" prop="registrationTime">
          <el-date-picker
            v-model="eventForm.registrationTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 400px;"
          />
        </el-form-item>
        
        <!-- 活动起止时间 -->
        <el-form-item label="*活动起止时间" prop="activityTime">
          <el-date-picker
            v-model="eventForm.activityTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 400px;"
          />
        </el-form-item>
        
        <!-- 报名项目/费用 -->
        <el-form-item label="*报名项目/费用" prop="registrationItems">
          <el-card class="items-card" shadow="never">
            <el-table :data="eventForm.registrationItems" style="width: 100%;" border>
              <el-table-column label="*项目" width="200" align="center">
                <template #default="scope">
                  <el-input 
                    v-model="scope.row.itemName" 
                    placeholder="请输入项目名称"
                    size="small"
                    clearable
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="费用(元/人)" width="150" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.cost" 
                    :min="0" 
                    :precision="2"
                    placeholder="费用"
                    size="small"
                    style="width: 100px;"
                    controls-position="right"
                  ></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="人数" width="150" align="center">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.maxPeople" 
                    :min="1" 
                    placeholder="人数"
                    size="small"
                    style="width: 100px;"
                    controls-position="right"
                  ></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="scope">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="removeItem(scope.$index)"
                    :icon="Delete"
                    circle
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="hint-text" style="margin-top: 10px;">
              <el-alert
                title="费用不填则为免费报名,人数未填则为不限制"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
            <div style="margin-top: 15px;">
              <el-button type="primary" @click="addItem" :icon="Plus">
                +增加项目
              </el-button>
            </div>
          </el-card>
        </el-form-item>
        

        
        <!-- 报名方式 -->
        <el-form-item label="*报名方式" prop="registrationMethod">
          <el-card class="registration-method-card" shadow="never">
            <el-space direction="vertical" size="large" style="width: 100%;">
              <el-checkbox v-model="eventForm.registrationMethod.individualRegistration" size="large">
                <el-tag type="success" size="small">单人报名</el-tag>
                (仅限登录本人报名)
              </el-checkbox>
              
              <div class="team-registration">
                <el-checkbox v-model="eventForm.registrationMethod.teamRegistration" size="large">
                  <el-tag type="warning" size="small">团队报名</el-tag>
                  (每个团队人数范围
                </el-checkbox>
                <el-input-number 
                  v-model="eventForm.registrationMethod.teamMinSize" 
                  :min="1" 
                  :disabled="!eventForm.registrationMethod.teamRegistration"
                  style="width: 80px; margin: 0 5px;"
                  controls-position="right"
                ></el-input-number>
                <el-divider direction="vertical" />
                <el-input-number 
                  v-model="eventForm.registrationMethod.teamMaxSize" 
                  :min="1" 
                  :disabled="!eventForm.registrationMethod.teamRegistration"
                  style="width: 80px; margin: 0 5px;"
                  controls-position="right"
                ></el-input-number>
                <span>人)</span>
              </div>
              
              <el-checkbox v-model="eventForm.registrationMethod.familyRegistration" size="large">
                <el-tag type="info" size="small">家庭报名</el-tag>
              </el-checkbox>
            </el-space>
          </el-card>
          

        </el-form-item>
        

        
        <!-- 报名咨询电话 -->
        <el-form-item label="报名咨询电话">
          <el-card class="phone-card" shadow="never">
            <el-input 
              v-model="eventForm.consultationPhone" 
              placeholder="请输入咨询电话"
              style="width: 300px;"
              clearable
              :prefix-icon="Phone"
            ></el-input>
            <el-alert
              title="若为座机请加上区号,如:0592-1000000"
              type="info"
              :closable="false"
              show-icon
              style="margin-top: 10px;"
            />
          </el-card>
        </el-form-item>
        
        <!-- 活动地址 -->
        <el-form-item label="活动地址">
          <el-card class="address-card" shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon><Location /></el-icon>
                <span>活动地址</span>
              </div>
            </template>
            <el-space direction="vertical" size="large" style="width: 100%;">
              <div class="address-container">
                <el-select v-model="eventForm.activityAddress.province" placeholder="请选择省份" style="width: 150px;">
                  <el-option 
                    v-for="province in provinces" 
                    :key="province.value" 
                    :label="province.label" 
                    :value="province.label"
                  ></el-option>
                </el-select>
                <el-select v-model="eventForm.activityAddress.city" placeholder="请选择城市" style="width: 150px;">
                  <el-option 
                    v-for="city in cities" 
                    :key="city.value" 
                    :label="city.label" 
                    :value="city.label"
                  ></el-option>
                </el-select>
                <el-select v-model="eventForm.activityAddress.district" placeholder="请选择区县" style="width: 150px;">
                  <el-option 
                    v-for="district in districts" 
                    :key="district.value" 
                    :label="district.label" 
                    :value="district.label"
                  ></el-option>
                </el-select>
              </div>
              <el-input 
                v-model="eventForm.activityAddress.detailAddress" 
                placeholder="请填写街道、门牌号"
                style="width: 100%;"
                clearable
                :prefix-icon="Location"
              ></el-input>
            </el-space>
          </el-card>
        </el-form-item>
        
        <!-- 报名表单信息 -->
        <el-form-item label="*报名表单信息" prop="formFields">
          <el-card class="form-fields-card" shadow="never">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>报名表单信息</span>
              </div>
            </template>
            <el-table :data="eventForm.formFields" style="width: 100%;" border stripe>
              <el-table-column label="报名项" width="200" align="center">
                <template #default="scope">
                  <el-input 
                    v-model="scope.row.fieldName" 
                    :placeholder="scope.row.placeholder || '请输入报名项名称'"
                    size="small"
                    :disabled="scope.row.isSystem"
                    clearable
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="是否必填" width="100" align="center">
                <template #default="scope">
                  <el-checkbox v-model="scope.row.required" :disabled="scope.row.isSystem">必填</el-checkbox>
                </template>
              </el-table-column>
              <el-table-column label="提示语" width="200" align="center">
                <template #default="scope">
                  <!-- 年龄限制字段 -->
                  <div v-if="scope.row.type === 'age-restriction'">
                    <el-radio-group v-model="eventForm.registrantAgeRestriction.type" size="small" @change="updateAgeRestrictionValue">
                      <el-radio label="no-limit">不限制</el-radio>
                      <el-radio label="age-limit">限制年龄</el-radio>
                      <el-radio label="birth-limit">限制生日</el-radio>
                    </el-radio-group>
                    <div v-if="eventForm.registrantAgeRestriction.type === 'age-limit'" style="margin-top: 5px;">
                      <el-input-number 
                        v-model="eventForm.registrantAgeRestriction.minAge" 
                        :min="0" 
                        :max="100"
                        size="small"
                        style="width: 60px;"
                        controls-position="right"
                        @change="updateAgeRestrictionValue"
                      ></el-input-number>
                      <span style="margin: 0 5px;">-</span>
                      <el-input-number 
                        v-model="eventForm.registrantAgeRestriction.maxAge" 
                        :min="0" 
                        :max="100"
                        size="small"
                        style="width: 60px;"
                        controls-position="right"
                        @change="updateAgeRestrictionValue"
                      ></el-input-number>
                      <span style="margin-left: 5px;">岁</span>
                    </div>
                    <div v-if="eventForm.registrantAgeRestriction.type === 'birth-limit'" style="margin-top: 5px;">
                      <el-date-picker
                        v-model="eventForm.registrantAgeRestriction.birthStart"
                        type="date"
                        placeholder="开始日期"
                        size="small"
                        style="width: 120px;"
                        @change="updateAgeRestrictionValue"
                      />
                      <span style="margin: 0 5px;">-</span>
                      <el-date-picker
                        v-model="eventForm.registrantAgeRestriction.birthEnd"
                        type="date"
                        placeholder="结束日期"
                        size="small"
                        style="width: 120px;"
                        @change="updateAgeRestrictionValue"
                      />
                    </div>
                  </div>
                  <!-- 性别限制字段 -->
                  <div v-else-if="scope.row.type === 'gender-restriction'">
                    <el-radio-group v-model="eventForm.registrantGenderRestriction.type" size="small" @change="updateGenderRestrictionValue">
                      <el-radio label="no-limit">不限制</el-radio>
                      <el-radio label="female">女</el-radio>
                      <el-radio label="male">男</el-radio>
                    </el-radio-group>
                  </div>
                  <!-- 普通字段 -->
                  <el-input 
                    v-else
                    v-model="scope.row.hintText" 
                    placeholder="最多10个字符"
                    size="small"
                    maxlength="10"
                    show-word-limit
                    clearable
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="center">
                <template #default="scope">
                  <el-button 
                    v-if="!scope.row.isSystem"
                    type="danger" 
                    size="small" 
                    @click="removeFormField(scope.$index)"
                    :icon="Delete"
                    circle
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
            

            
            <!-- 选项显示区域 -->
            <div v-for="(field, fieldIndex) in getOptionFields()" :key="fieldIndex" class="field-options">
              <div class="options-header">
                <span class="options-title">{{ field.fieldName || '选项' }}的选项:</span>
              </div>
              <div class="options-list">
                <div v-for="(option, optionIndex) in getFieldOptions(field)" :key="optionIndex" class="option-item">
                  <el-radio v-if="field.type === 'radio'" :model-value="true" disabled></el-radio>
                  <el-checkbox v-if="field.type === 'checkbox'" :model-value="true" disabled></el-checkbox>
                  <el-input 
                    v-model="option.text" 
                    :placeholder="`输入选项${optionIndex + 1}`"
                    size="small"
                    style="width: 200px; margin-left: 10px;"
                  ></el-input>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="removeOption(fieldIndex, optionIndex)"
                    style="margin-left: 10px;"
                    :icon="Delete"
                    circle
                  ></el-button>
                </div>
                <el-button type="primary" size="small" @click="addOption(fieldIndex)" style="margin-top: 10px;" :icon="Plus">
                  +添加
                </el-button>
              </div>
            </div>
            
            <!-- 添加表单字段按钮 -->
            <div class="add-field-buttons">
              <el-button type="primary" @click="addTextField" style="margin-right: 10px;" :icon="Plus">
                添加文本输入
              </el-button>
              <el-button type="primary" @click="addRadioField" style="margin-right: 10px;" :icon="Plus">
                添加单选
              </el-button>
              <el-button type="primary" @click="addCheckboxField" :icon="Plus">
                添加多选
              </el-button>
            </div>
            

            

          </el-card>
        </el-form-item>
        
        <el-form-item>
          <el-button @click="saveDraft">存草稿</el-button>
          <el-button type="primary" @click="submitForm">发布</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 标签模态框 -->
    <el-dialog
      v-model="imageModalVisible"
      title="新增标签"
      width="600px"
      :before-close="closeTagModal"
      center
      destroy-on-close
    >
      <el-card shadow="never" style="margin-bottom: 20px;">
        <!-- 长度超限警告信息 -->
        <el-alert
          v-if="newTagName.length > 5"
          title="每个标签最多5个字符"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
        
        <!-- 其他警告信息 -->
        <el-alert
          v-if="tagWarning && newTagName.length <= 5"
          :title="tagWarning"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
        
        <!-- 新增标签输入 -->
        <el-form label-width="0" size="large">
          <el-form-item>
            <el-input
              v-model="newTagName"
              placeholder="请输入标签名称"
              clearable
              :prefix-icon="Edit"
              @keyup.enter="addNewTagInModal"
              @input="clearTagWarning"
            />
          </el-form-item>
        </el-form>
        
        <el-text type="info" size="small">
          <el-icon><InfoFilled /></el-icon>
          每个标签最多5个字符
        </el-text>
      </el-card>
      
      <!-- 现有标签展示 -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Collection /></el-icon>
            <span>现有标签</span>
            <el-tag type="info" size="small">{{ existingTags.length }}个标签</el-tag>
          </div>
        </template>
        
        <!-- 加载状态 -->
        <div v-if="isLoadingTags" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <!-- 标签列表 -->
        <el-space wrap v-else>
          <el-tag
            v-for="tag in existingTags"
            :key="tag._id || tag"
            :class="{ 'selected': selectedTags.includes(tag.sport_tag || tag) }"
            @click="selectTag(tag.sport_tag || tag)"
            closable
            @close="removeTag(tag)"
            size="large"
            effect="light"
            style="cursor: pointer; transition: all 0.3s;"
          >
            <el-icon style="margin-right: 4px;"><PriceTag /></el-icon>
            {{ tag.sport_tag || tag }}
          </el-tag>
        </el-space>
        
        <el-empty v-if="!isLoadingTags && existingTags.length === 0" description="暂无标签">
          <template #image>
            <el-icon style="font-size: 60px; color: #c0c4cc;"><Collection /></el-icon>
          </template>
          <template #description>
            <span style="color: #909399;">还没有任何标签，快来添加第一个标签吧！</span>
          </template>
        </el-empty>
      </el-card>
      
      <template #footer>
        <div class="dialog-footer">
          <el-space>
            <el-button @click="closeTagModal" :icon="Close">关闭</el-button>
            <el-button type="primary" @click="confirmTagModal" :icon="Check" :disabled="newTagName.length > 5">确定</el-button>
          </el-space>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, User, Phone, Location, Document, Edit, InfoFilled, Collection, PriceTag, Close, Check } from '@element-plus/icons-vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import axios from 'axios'

// axios配置
axios.defaults.baseURL = 'http://localhost:3000'
axios.defaults.timeout = 10000
axios.defaults.headers.common['Content-Type'] = 'application/json'

// 请求拦截器
axios.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      // 可以在这里处理登录跳转
    } else if (error.response?.status === 403) {
      ElMessage.error('没有权限访问')
    } else if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误')
    }
    return Promise.reject(error)
  }
)

const formRef = ref()
const fileInput = ref()
const quillEditorRef = ref()

// 图片模态框相关
const imageModalVisible = ref(false)
const newTagName = ref('')
const existingTags = ref([])
const selectedTags = ref([])
const tagWarning = ref('')
const isLoadingTags = ref(false)

const eventForm = reactive({
  type: '活动',
  title: '',
  sportTag: '',
  content: '',
  coverImage: '',
  registrationTime: [],
  activityTime: [],
  registrationItems: [
    { itemName: '', cost: null, maxPeople: null }
  ],

  consultationPhone: '',
  // 活动地址对象
  activityAddress: {
    province: '福建省',
    city: '厦门市',
    district: '思明区',
    detailAddress: ''
  },
  formFields: [
    { 
      fieldName: '姓名', 
      required: true, 
      type: 'text',
      hintText: '',
      isSystem: true,
      placeholder: '姓名'
    },
    { 
      fieldName: '手机号', 
      required: true, 
      type: 'text',
      hintText: '',
      isSystem: true,
      placeholder: '手机号'
    },
    { 
      fieldName: '证件类型/证件号', 
      required: true, 
      type: 'text',
      hintText: '',
      isSystem: true,
      placeholder: '证件类型/证件号'
    },
    { 
      fieldName: '年龄限制', 
      required: true, 
      type: 'age-restriction',
      hintText: '',
      isSystem: true,
      placeholder: '年龄限制'
    },
    { 
      fieldName: '性别限制', 
      required: true, 
      type: 'gender-restriction',
      hintText: '',
      isSystem: true,
      placeholder: '性别限制'
    }
  ],
  // 报名方式相关
  registrationMethod: {
    individualRegistration: true,
    teamRegistration: false,
    teamMinSize: 2,
    teamMaxSize: 10,
    familyRegistration: true
  },

  // 报名人年龄限制
  registrantAgeRestriction: {
    type: 'no-limit',
    minAge: 18,
    maxAge: 65,
    birthStart: '',
    birthEnd: '',
    // 存储具体的限制值
    restrictionValue: null
  },
  // 报名人性别限制
  registrantGenderRestriction: {
    type: 'no-limit',
    // 存储具体的限制值
    restrictionValue: null
  }
})

const sportTags = ref([])

// 地区数据
const provinces = ref([])
const cities = ref([])
const districts = ref([])

// 获取省份列表
const getProvinces = async () => {
  try {
    // 临时使用本地数据，避免API问题
    provinces.value = [
      { label: '福建省', value: '350000' },
      { label: '广东省', value: '440000' },
      { label: '浙江省', value: '330000' },
      { label: '江苏省', value: '320000' },
      { label: '山东省', value: '370000' },
      { label: '北京市', value: '110000' },
      { label: '上海市', value: '310000' },
      { label: '天津市', value: '120000' },
      { label: '重庆市', value: '500000' }
    ]
    
    // TODO: 修复高德API后启用以下代码
    /*
    const response = await axios.get('https://restapi.amap.com/v3/config/district', {
      params: {
        key: '566796b98ac26732077e8d8a5099ffc7',
        keywords: '中国',
        subdistrict: 1
      }
    })
    
    console.log('高德API响应:', response.data)
    
    if (response.data && response.data.status === '1') {
      provinces.value = response.data.districts[0].districts.map((item: any) => ({
        label: item.name,
        value: item.adcode
      }))
    }
    */
  } catch (error: any) {
    console.error('获取省份列表失败:', error.response?.data?.message || error.message)
  }
}

// 获取城市列表
const getCities = async (provinceCode: string) => {
  try {
    // 使用高德地图API获取城市数据
    const response = await axios.get('https://restapi.amap.com/v3/config/district', {
      params: {
        key: '566796b98ac26732077e8d8a5099ffc7', // 高德地图API Key
        keywords: provinceCode,
        subdistrict: 1,
        extensions: 'base'
      }
    })
    
    if (response.data && response.data.status === '1') {
      cities.value = response.data.districts[0].districts.map((item: any) => ({
        label: item.name,
        value: item.adcode
      }))
    } else {
      console.error('获取城市列表失败:', response.data?.info || '未知错误')
      // 备用方案：根据省份代码返回对应城市
      const cityMap: { [key: string]: any[] } = {
        '350000': [
          { label: '厦门市', value: '350200' },
          { label: '福州市', value: '350100' },
          { label: '泉州市', value: '350500' }
        ],
        '440000': [
          { label: '广州市', value: '440100' },
          { label: '深圳市', value: '440300' },
          { label: '珠海市', value: '440400' }
        ],
        '330000': [
          { label: '杭州市', value: '330100' },
          { label: '宁波市', value: '330200' },
          { label: '温州市', value: '330300' }
        ]
      }
      cities.value = cityMap[provinceCode] || []
    }
  } catch (error: any) {
    console.error('获取城市列表失败:', error.response?.data?.message || error.message)
    cities.value = []
  }
}

// 获取区县列表
const getDistricts = async (cityCode: string) => {
  try {
    // 使用高德地图API获取区县数据
    const response = await axios.get('https://restapi.amap.com/v3/config/district', {
      params: {
        key: '566796b98ac26732077e8d8a5099ffc7', // 高德地图API Key
        keywords: cityCode,
        subdistrict: 1,
        extensions: 'base'
      }
    })
    
    if (response.data && response.data.status === '1') {
      districts.value = response.data.districts[0].districts.map((item: any) => ({
        label: item.name,
        value: item.adcode
      }))
    } else {
      console.error('获取区县列表失败:', response.data?.info || '未知错误')
      // 备用方案：根据城市代码返回对应区县
      const districtMap: { [key: string]: any[] } = {
        '350200': [
          { label: '思明区', value: '350203' },
          { label: '湖里区', value: '350206' },
          { label: '集美区', value: '350211' }
        ],
        '350100': [
          { label: '鼓楼区', value: '350102' },
          { label: '台江区', value: '350103' },
          { label: '仓山区', value: '350104' }
        ],
        '440100': [
          { label: '越秀区', value: '440104' },
          { label: '海珠区', value: '440105' },
          { label: '荔湾区', value: '440103' }
        ]
      }
      districts.value = districtMap[cityCode] || []
    }
  } catch (error: any) {
    console.error('获取区县列表失败:', error.response?.data?.message || error.message)
    districts.value = []
  }
}

const selectedParagraphStyle = ref('p')
const selectedFontFamily = ref('sans-serif')
const selectedFontSize = ref('16')

// QuillEditor配置
const editorOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image', 'video']
    ]
  },
  placeholder: '请输入内容...',
  theme: 'snow'
}



const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 5, max: 30, message: '标题长度在5到30个字符', trigger: 'blur' }
  ],
  sportTag: [
    { required: true, message: '请选择运动标签', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入内容简介', trigger: 'blur' }
  ],
  coverImage: [
    { required: true, message: '请上传封面图片', trigger: 'change' }
  ],
  registrationTime: [
    { required: true, message: '请选择报名起止时间', trigger: 'change' }
  ],
  activityTime: [
    { required: true, message: '请选择活动起止时间', trigger: 'change' }
  ],
  registrationItems: [
    { 
      required: true, 
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一个报名项目'))
        } else {
          const hasValidItem = value.some((item: any) => item.itemName && item.itemName.trim())
          if (!hasValidItem) {
            callback(new Error('请至少填写一个项目名称'))
          } else {
            callback()
          }
        }
      },
      trigger: 'change'
    }
  ],

  formFields: [
    { 
      required: true, 
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一个报名表单字段'))
        } else {
          const hasValidField = value.some((field: any) => field.fieldName && field.fieldName.trim())
          if (!hasValidField) {
            callback(new Error('请至少填写一个报名项名称'))
          } else {
            callback()
          }
        }
      },
      trigger: 'change'
    }
  ],
  registrationMethod: [
    { 
      required: true, 
      validator: (rule: any, value: any, callback: any) => {
        const { individualRegistration, teamRegistration, familyRegistration } = eventForm.registrationMethod
        if (!individualRegistration && !teamRegistration && !familyRegistration) {
          callback(new Error('请至少选择一种报名方式'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// QuillEditor相关方法
const onEditorReady = (quill: any) => {
  console.log('编辑器已就绪:', quill)
}

const onTextChange = (delta: any, oldDelta: any, source: any) => {
  console.log('文本已变化:', source)
}

// 标签模态框相关方法
const showTagModal = async () => {
  imageModalVisible.value = true
  newTagName.value = ''
  selectedTags.value = []
  tagWarning.value = ''
  
  // 获取标签数据
  await loadExistingTags()
}

const closeTagModal = () => {
  imageModalVisible.value = false
}

// 加载现有标签数据
const loadExistingTags = async () => {
  isLoadingTags.value = true
  try {
    const response = await axios.get('/wsj/getlabel')
    console.log('标签接口响应:', response.data) // 调试信息
    
    if (response.data && response.data.code === 200) {
      // 后端返回的数据结构可能不同，需要适配
      existingTags.value = response.data.data || []
      if (existingTags.value.length > 0) {
        ElMessage.success('标签数据加载成功')
      }
    } else {
      console.error('获取标签数据失败:', response.data?.msg || '未知错误')
      existingTags.value = []
    }
  } catch (error: any) {
    console.error('获取标签数据失败:', error.response?.data?.msg || error.message)
    existingTags.value = []
  } finally {
    isLoadingTags.value = false
  }
}

const addNewTagInModal = async () => {
  if (!newTagName.value.trim()) {
    tagWarning.value = '请输入标签名称'
    return
  }
  
  // 检查标签长度
  if (newTagName.value.length > 5) {
    return
  }
  
  // 检查标签是否已存在
  if (existingTags.value.includes(newTagName.value)) {
    tagWarning.value = `"${newTagName.value}"标签已存在,不可重复添加,若重复的标签未显示在下方,可联系管理员恢复。`
    return
  }
  
      try {
      // 调用后端接口添加标签
      const response = await axios.post('/wsj/addlabel', { 
        sport_tag: newTagName.value 
      })
    
    if (response.data && response.data.code === 200) {
      newTagName.value = ''
      tagWarning.value = ''
      ElMessage.success('标签添加成功')
      // 重新加载标签数据
      await loadExistingTags()
    } else {
      ElMessage.error(response.data?.msg || '标签添加失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '标签添加失败')
    console.error('添加标签失败:', error)
  }
}

const removeTag = async (tag: any) => {
  const tagName = tag.sport_tag || tag
  const tagId = tag._id || tag.id || tag
  
  // 添加确认删除对话框
  const confirmResult = await ElMessageBox.confirm(
    `确定要删除标签"${tagName}"吗？删除后将无法恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).catch(() => {
    return 'cancel'
  })

  if (confirmResult === 'cancel') {
    return
  }

  try {
    console.log('准备删除标签:', tagName, 'ID:', tagId) // 调试信息
    // 调用后端接口删除标签
    const response = await axios.post('/wsj/deletelabel', { id: tagId })
    
    if (response.data && response.data.code === 200) {
      ElMessage.success(response.data.msg || '删除成功')
      // 重新加载标签数据
      await loadExistingTags()
      // 同时更新下拉框数据
      await initSportTags()
    } else {
      ElMessage.error(response.data?.msg || '标签删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '标签删除失败')
    console.error('删除标签失败:', error)
  }
}

const selectTag = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagName)
  }
}

// 清除标签警告
const clearTagWarning = () => {
  if (tagWarning.value && newTagName.value.length <= 5) {
    tagWarning.value = ''
  }
}

const confirmTagModal = async () => {
  // 如果有输入新标签名称，则添加标签
  if (newTagName.value.trim()) {

    
    // 检查标签是否已存在
    const tagExists = existingTags.value.some((tag: any) => 
      (tag.sport_tag || tag) === newTagName.value
    )
    if (tagExists) {
      tagWarning.value = `"${newTagName.value}"标签已存在,不可重复添加,若重复的标签未显示在下方,可联系管理员恢复。`
      return
    }
    
    try {
      // 调用后端接口添加标签
      const response = await axios.post('/wsj/addlabel', { 
        sport_tag: newTagName.value 
      })
      
      if (response.data && response.data.code === 200) {
        newTagName.value = ''
        tagWarning.value = ''
        ElMessage.success('标签添加成功')
        // 重新加载标签数据
        await loadExistingTags()
        // 重新加载运动标签下拉框
        await initSportTags()
      } else {
        tagWarning.value = response.data?.msg || '标签添加失败'
        return
      }
    } catch (error: any) {
      tagWarning.value = error.response?.data?.msg || '标签添加失败'
      console.error('添加标签失败:', error)
      return
    }
  }
  
  // 关闭弹窗
  closeTagModal()
  ElMessage.success('操作完成')
}

// 文件上传相关方法
const triggerFileUpload = () => {
  fileInput.value.click()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    uploadImage(file)
  }
}

const uploadImage = async (file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axios.post('/wsj/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    console.log('上传响应:', response.data) // 调试信息
    
    if (response.data && response.data.success) {
      // 根据后端返回的数据结构，构建完整的图片URL
      let imageUrl = ''
      
      if (response.data.data?.url) {
        // 如果后端直接返回完整URL
        imageUrl = response.data.data.url
      } else if (response.data.data?.fileName) {
        // 如果后端返回文件名，构建完整URL
        imageUrl = `http://localhost:3000/uploads/${response.data.data.fileName}`
      } else if (response.data.data?.path) {
        // 如果后端返回相对路径
        imageUrl = `http://localhost:3000${response.data.data.path}`
      } else {
        // 尝试从响应中获取任何可能的图片信息
        console.error('后端返回的数据结构:', response.data.data)
        ElMessage.error('无法获取图片URL')
        return
      }
      
      // 如果URL是相对路径，添加完整域名
      if (imageUrl.startsWith('/')) {
        imageUrl = `http://localhost:3000${imageUrl}`
      }
      
      eventForm.coverImage = imageUrl
      console.log('设置的图片URL:', eventForm.coverImage) // 调试信息
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(response.data?.message || '图片上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '图片上传失败')
    console.error('上传失败:', error)
  }
}

// 新增标签
const addNewTag = async () => {
  const tagName = prompt('请输入新标签名称：')
  if (tagName) {
    try {
      const response = await axios.post('/addlabel', { sport_tag: tagName })
      if (response.data && response.data.code === 200) {
        ElMessage.success('标签添加成功')
        // 重新加载标签数据
        await initSportTags()
      } else {
        ElMessage.error(response.data?.msg || '标签添加失败')
      }
    } catch (error: any) {
      ElMessage.error(error.response?.data?.msg || '标签添加失败')
      console.error('添加标签失败:', error)
    }
  }
}

// 添加报名项目
const addItem = () => {
  eventForm.registrationItems.push({
    itemName: '',
    cost: null,
    maxPeople: null
  })
}

// 删除报名项目
const removeItem = (index: number) => {
  if (eventForm.registrationItems.length > 1) {
    eventForm.registrationItems.splice(index, 1)
  } else {
    ElMessage.warning('至少需要保留一个报名项目')
  }
}

// 添加文本输入字段
const addTextField = () => {
  eventForm.formFields.push({
    fieldName: '',
    required: false,
    type: 'text',
    hintText: '',
    isSystem: false,
    placeholder: '请输入文本输入标题'
  })
}

// 添加单选字段
const addRadioField = () => {
  eventForm.formFields.push({
    fieldName: '',
    required: false,
    type: 'radio',
    hintText: '',
    isSystem: false,
    placeholder: '输入单选标题',
    options: [
      { text: '' },
      { text: '' }
    ]
  } as any)
}

// 添加多选字段
const addCheckboxField = () => {
  eventForm.formFields.push({
    fieldName: '',
    required: false,
    type: 'checkbox',
    hintText: '',
    isSystem: false,
    placeholder: '输入多标题',
    options: [
      { text: '' },
      { text: '' }
    ]
  } as any)
}

// 添加选项
const addOption = (fieldIndex: number) => {
  const field = eventForm.formFields[fieldIndex] as any
  if (field.options) {
    field.options.push({ text: '' })
  }
}

// 删除选项
const removeOption = (fieldIndex: number, optionIndex: number) => {
  const field = eventForm.formFields[fieldIndex] as any
  if (field.options && field.options.length > 1) {
    field.options.splice(optionIndex, 1)
  } else {
    ElMessage.warning('至少需要保留一个选项')
  }
}

// 添加表单字段（保留原有方法名）
const addFormField = () => {
  addTextField()
}

// 删除表单字段
const removeFormField = (index: number) => {
  if (eventForm.formFields.length > 1) {
    eventForm.formFields.splice(index, 1)
  } else {
    ElMessage.warning('至少需要保留一个报名表单字段')
  }
}

// 获取选项字段
const getOptionFields = () => {
  return eventForm.formFields.filter(field => field.type === 'radio' || field.type === 'checkbox')
}

// 获取字段选项
const getFieldOptions = (field: any) => {
  return field.options || []
}

// 限制设置字段
const restrictionFields = ref([
  {
    fieldName: '报名人年龄限制',
    required: true,
    type: 'age',
    isSystem: true
  },
  {
    fieldName: '报名人性别限制',
    required: true,
    type: 'gender',
    isSystem: true
  }
])

// 更新年龄限制值
const updateAgeRestrictionValue = () => {
  const { type, minAge, maxAge, birthStart, birthEnd } = eventForm.registrantAgeRestriction
  
  if (type === 'no-limit') {
    eventForm.registrantAgeRestriction.restrictionValue = null
  } else if (type === 'age-limit') {
    eventForm.registrantAgeRestriction.restrictionValue = `${minAge}-${maxAge}岁`
  } else if (type === 'birth-limit') {
    eventForm.registrantAgeRestriction.restrictionValue = `${birthStart} 至 ${birthEnd}`
  }
  
  // 同时更新formFields中对应字段的值
  const ageField = eventForm.formFields.find(field => field.type === 'age-restriction')
  if (ageField) {
    ageField.hintText = eventForm.registrantAgeRestriction.restrictionValue || '不限制'
  }
}

// 更新性别限制值
const updateGenderRestrictionValue = () => {
  const { type } = eventForm.registrantGenderRestriction
  
  if (type === 'no-limit') {
    eventForm.registrantGenderRestriction.restrictionValue = null
  } else if (type === 'female') {
    eventForm.registrantGenderRestriction.restrictionValue = '女'
  } else if (type === 'male') {
    eventForm.registrantGenderRestriction.restrictionValue = '男'
  }
  
  // 同时更新formFields中对应字段的值
  const genderField = eventForm.formFields.find(field => field.type === 'gender-restriction')
  if (genderField) {
    genderField.hintText = eventForm.registrantGenderRestriction.restrictionValue || '不限制'
  }
}

// 表单验证接口
const validateForm = async () => {
  try {
    const response = await axios.post('/api/form/validate', eventForm)
    return response.data.success
  } catch (error: any) {
    console.error('表单验证失败:', error.response?.data?.message || error.message)
    return false
  }
}

// 获取表单模板
const getFormTemplate = async () => {
  try {
    const response = await axios.get('/api/form/template')
    if (response.data.success) {
      // 可以设置默认的表单字段
      console.log('获取表单模板成功:', response.data.data)
    }
  } catch (error: any) {
    console.error('获取表单模板失败:', error.response?.data?.message || error.message)
  }
}

// 获取活动详情
const getActivityDetail = async (id: string) => {
  try {
    const response = await axios.get(`/api/activity/detail/${id}`)
    if (response.data.success) {
      return response.data.data
    }
  } catch (error: any) {
    console.error('获取活动详情失败:', error.response?.data?.message || error.message)
  }
  return null
}

// 更新活动
const updateActivity = async (id: string, data: any) => {
  try {
    const response = await axios.put(`/api/activity/update/${id}`, data)
    if (response.data.success) {
      ElMessage.success('更新成功！')
      return true
    } else {
      ElMessage.error(response.data.message || '更新失败')
      return false
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '更新失败')
    console.error('更新失败:', error)
    return false
  }
}

// 删除活动
const deleteActivity = async (id: string) => {
  try {
    const response = await axios.delete(`/api/activity/delete/${id}`)
    if (response.data.success) {
      ElMessage.success('删除成功！')
      return true
    } else {
      ElMessage.error(response.data.message || '删除失败')
      return false
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '删除失败')
    console.error('删除失败:', error)
    return false
  }
}

// 返回
const goBack = () => {
  console.log('返回上一页')
}

// 表单提交
const submitForm = async () => {
  try {
    // 前端验证
    const valid = await formRef.value.validate()
    if (!valid) {
      ElMessage.error('请完善必填信息')
      return
    }
    
    // 提交前更新限制值
    updateAgeRestrictionValue()
    updateGenderRestrictionValue()
    
    // 处理地址数据 - 如果详细地址为空，使用默认值
    if (!eventForm.activityAddress.detailAddress || eventForm.activityAddress.detailAddress.trim() === '') {
      eventForm.activityAddress.detailAddress = '详细地址待补充'
    }
    
    // 构建提交数据，设置状态为发布(1)
    const submitData = {
      ...eventForm,
      state: 1, // 发布状态
      // 替换限制字段为具体值
      formFields: eventForm.formFields.map(field => {
        if (field.type === 'age-restriction') {
          return {
            ...field,
            fieldName: '年龄限制',
            hintText: eventForm.registrantAgeRestriction.restrictionValue || '不限制'
          }
        } else if (field.type === 'gender-restriction') {
          return {
            ...field,
            fieldName: '性别限制',
            hintText: eventForm.registrantGenderRestriction.restrictionValue || '不限制'
          }
        }
        return field
      })
    }
    
    // 调试：打印限制值
    console.log('提交的限制值:', {
      ageRestriction: eventForm.registrantAgeRestriction,
      genderRestriction: eventForm.registrantGenderRestriction
    })
    
    // 调试：打印地址数据
    console.log('提交的地址数据:', {
      activityAddress: eventForm.activityAddress,
      fullAddress: `${eventForm.activityAddress.province} ${eventForm.activityAddress.city} ${eventForm.activityAddress.district} ${eventForm.activityAddress.detailAddress}`
    })
    
    // 调试：打印formFields数据
    console.log('提交的formFields数据:', submitData.formFields)
    
    // 提交表单到后端接口
    const response = await axios.post('/wsj/noreleaseactivity', submitData)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('发布成功！')
      resetForm()
    } else {
      ElMessage.error(response.data?.msg || '发布失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '发布失败')
    console.error('发布失败:', error)
  }
}

const saveDraft = async () => {
  try {
    // 提交前更新限制值
    updateAgeRestrictionValue()
    updateGenderRestrictionValue()
    
    // 处理地址数据 - 如果详细地址为空，使用默认值
    if (!eventForm.activityAddress.detailAddress || eventForm.activityAddress.detailAddress.trim() === '') {
      eventForm.activityAddress.detailAddress = '详细地址待补充'
    }
    
    // 构建提交数据，设置状态为草稿(0)
    const submitData = {
      ...eventForm,
      state: 0, // 草稿状态
      // 替换限制字段为具体值
      formFields: eventForm.formFields.map(field => {
        if (field.type === 'age-restriction') {
          return {
            ...field,
            fieldName: '年龄限制',
            hintText: eventForm.registrantAgeRestriction.restrictionValue || '不限制'
          }
        } else if (field.type === 'gender-restriction') {
          return {
            ...field,
            fieldName: '性别限制',
            hintText: eventForm.registrantGenderRestriction.restrictionValue || '不限制'
          }
        }
        return field
      })
    }
    
    // 调试：打印提交数据
    console.log('保存草稿数据:', submitData)
    
    // 提交到后端接口
    const response = await axios.post('/wsj/noreleaseactivity', submitData)
    
    if (response.data && response.data.code === 200) {
      ElMessage.success('草稿保存成功！')
      resetForm()
    } else {
      ElMessage.error(response.data?.msg || '草稿保存失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.msg || '草稿保存失败')
    console.error('草稿保存失败:', error)
  }
}

const resetForm = () => {
  // 重置表单字段
  formRef.value.resetFields()
  
  // 清空富文本编辑器内容
  eventForm.content = ''
  if (quillEditorRef.value) {
    quillEditorRef.value.setText('')
  }
  
  // 清空封面图片
  eventForm.coverImage = ''
  
  // 清空文件输入框
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  eventForm.registrationItems = [
    { itemName: '', cost: null, maxPeople: null }
  ]
  eventForm.formFields = [
    { 
      fieldName: '姓名', 
      required: true, 
      type: 'text',
      hintText: '',
      isSystem: true,
      placeholder: '姓名'
    },
    { 
      fieldName: '手机号', 
      required: true, 
      type: 'text',
      hintText: '',
      isSystem: true,
      placeholder: '手机号'
    },
    { 
      fieldName: '证件类型/证件号', 
      required: true, 
      type: 'text',
      hintText: '',
      isSystem: true,
      placeholder: '证件类型/证件号'
    },
    { 
      fieldName: '年龄限制', 
      required: true, 
      type: 'age-restriction',
      hintText: '',
      isSystem: true,
      placeholder: '年龄限制'
    },
    { 
      fieldName: '性别限制', 
      required: true, 
      type: 'gender-restriction',
      hintText: '',
      isSystem: true,
      placeholder: '性别限制'
    }
  ]
  // 重置报名方式相关
  eventForm.registrationMethod = {
    individualRegistration: true,
    teamRegistration: false,
    teamMinSize: 2,
    teamMaxSize: 10,
    familyRegistration: true
  }

  // 重置报名人年龄限制
  eventForm.registrantAgeRestriction = {
    type: 'no-limit',
    minAge: 18,
    maxAge: 65,
    birthStart: '',
    birthEnd: '',
    restrictionValue: null
  }
  // 重置报名人性别限制
  eventForm.registrantGenderRestriction = {
    type: 'no-limit',
    restrictionValue: null
  }
  
  // 重置地址信息
  eventForm.activityAddress = {
    province: '福建省',
    city: '厦门市',
    district: '思明区',
    detailAddress: ''
  }
  
  // 重置其他字段
  eventForm.type = '活动'
  eventForm.title = ''
  eventForm.sportTag = ''
  eventForm.registrationTime = []
  eventForm.activityTime = []
  eventForm.consultationPhone = ''


}

// 初始化运动标签
// const initSportTags = async () => {
//   try {
//     const response = await axios.get('/wsj/getlabel')
//     if (response.data && response.data.code === 200) {
//       // 将后端返回的标签数据转换为下拉框需要的格式
//       // 根据后端返回的数据结构进行调整
//       const tags = response.data.data || []
//       sportTags.value = tags.map((tag: any) => ({
//         label: tag.sport_tag || tag,
//         value: tag.sport_tag || tag
//       }))
//     } else {
//       console.error('获取运动标签失败:', response.data?.msg || '未知错误')
//       sportTags.value = []
//     }
//   } catch (error: any) {
//     console.error('获取运动标签失败:', error.response?.data?.msg || error.message)
//     sportTags.value = []
//   }
// }

onMounted(() => {
  // initSportTags()
  getProvinces()
  
  // 初始化限制值
  updateAgeRestrictionValue()
  updateGenderRestrictionValue()
})

// 监听省份变化
const watchProvince = () => {
  if (eventForm.activityAddress.province) {
    getCities(eventForm.activityAddress.province)
    eventForm.activityAddress.city = ''
    eventForm.activityAddress.district = ''
  }
}

// 监听城市变化
const watchCity = () => {
  if (eventForm.activityAddress.city) {
    getDistricts(eventForm.activityAddress.city)
    eventForm.activityAddress.district = ''
  }
}

// 使用watch监听器替代DOM事件
watch(() => eventForm.activityAddress.province, (newVal) => {
  if (newVal) {
    // 根据省份中文名称找到对应的代码
    const provinceCode = provinces.value.find(p => p.label === newVal)?.value
    if (provinceCode) {
      getCities(provinceCode)
    }
    eventForm.activityAddress.city = ''
    eventForm.activityAddress.district = ''
  }
})

watch(() => eventForm.activityAddress.city, (newVal) => {
  if (newVal) {
    // 根据城市中文名称找到对应的代码
    const cityCode = cities.value.find(c => c.label === newVal)?.value
    if (cityCode) {
      getDistricts(cityCode)
    }
    eventForm.activityAddress.district = ''
  }
})

</script>

<style scoped>

.publish-content {
  margin-top: 20px;
  max-width: 1000px;
}

.hint-text {
  margin-left: 10px;
  color: #999;
  font-size: 12px;
}

.unit-text {
  margin-left: 10px;
  color: #666;
}

.editor-card {
  margin-bottom: 20px;
}

/* QuillEditor样式优化 */
:deep(.ql-editor) {
  min-height: 250px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.ql-toolbar) {
  border-top: 1px solid #dcdfe6;
  border-left: 1px solid #dcdfe6;
  border-right: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

:deep(.ql-container) {
  border-bottom: 1px solid #dcdfe6;
  border-left: 1px solid #dcdfe6;
  border-right: 1px solid #dcdfe6;
  border-radius: 0 0 4px 4px;
}

:deep(.ql-editor:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.upload-container {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.upload-area {
  width: 200px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-placeholder {
  text-align: center;
  color: #999;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.upload-hint {
  color: #999;
  font-size: 12px;
  line-height: 1.4;
  max-width: 200px;
}

.label-text {
  color: #666;
  margin-right: 10px;
}

.items-table {
  width: 100%;
}

.form-fields-table {
  width: 100%;
}

.address-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.coordinates-container {
  display: flex;
  align-items: center;
}

/* 表格样式优化 */
:deep(.el-table .el-input-number) {
  width: 100%;
}

:deep(.el-table .el-input) {
  width: 100%;
}

:deep(.el-table .el-checkbox) {
  margin: 0;
}

.registration-method {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.team-registration {
  display: flex;
  align-items: center;
  gap: 5px;
}

.children-age-restriction,
.registrant-age-restriction {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.age-inputs,
.birth-inputs {
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 5px;
}

.age-inputs span,
.birth-inputs span {
  color: #666;
  margin: 0 5px;
}

.field-options {
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}

.options-header {
  margin-bottom: 10px;
}

.options-title {
  font-weight: bold;
  color: #333;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-field-buttons {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

/* Element Plus 组件样式 */
.items-card,
.insurance-card,
.registration-method-card,
.age-restriction-card,
.gender-restriction-card,
.phone-card,
.address-card,
.form-fields-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.card-header .el-icon {
  font-size: 18px;
  color: #409eff;
}

.team-registration {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}



.address-container {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 表格样式优化 */
:deep(.el-table .el-input-number) {
  width: 100%;
}

:deep(.el-table .el-input) {
  width: 100%;
}

:deep(.el-table .el-checkbox) {
  margin: 0;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-alert) {
  margin: 0;
}

/* 标签模态框样式优化 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.el-tag.selected {
  background-color: #409eff !important;
  color: white !important;
  border-color: #409eff !important;
}

.el-tag:hover {
  transform: scale(1.05);
}

.loading-container {
  padding: 20px;
}

/* 标签模态框样式优化 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.el-tag.selected {
  background-color: #409eff !important;
  color: white !important;
  border-color: #409eff !important;
}

.el-tag:hover {
  transform: scale(1.05);
}

.loading-container {
  padding: 20px;
}
</style>
