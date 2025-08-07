<template>
  <div class="activity-registration">
    <h2>活动报名设置</h2>
    <div class="registration-content">
      <el-form :model="registrationForm" label-width="140px" :rules="rules" ref="formRef">
        <!-- 报名人数上限 -->
        <el-form-item label="报名人数上限">
          <el-input-number 
            v-model="registrationForm.maxParticipants" 
            :min="1" 
            placeholder="请输入人数上限"
            style="width: 200px;"
          ></el-input-number>
          <span class="unit-text">人</span>
          <span class="hint-text">未填写则为不限制</span>
        </el-form-item>
        
        <!-- 报名起止时间 -->
        <el-form-item label="*报名起止时间" prop="registrationTime">
          <el-date-picker
            v-model="registrationForm.registrationTime"
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
            v-model="registrationForm.activityTime"
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
          <div class="items-table">
            <el-table :data="registrationForm.registrationItems" style="width: 100%;">
              <el-table-column label="项目" width="200">
                <template #default="scope">
                  <el-input 
                    v-model="scope.row.itemName" 
                    placeholder="请输入项目名称"
                    size="small"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="费用(元/人)" width="150">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.cost" 
                    :min="0" 
                    :precision="2"
                    placeholder="费用"
                    size="small"
                    style="width: 100px;"
                  ></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="人数" width="150">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.maxPeople" 
                    :min="1" 
                    placeholder="人数"
                    size="small"
                    style="width: 100px;"
                  ></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="scope">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="removeItem(scope.$index)"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="hint-text" style="margin-top: 10px;">
              费用不填则为免费报名,人数未填则为不限制
            </div>
            <el-button type="primary" @click="addItem" style="margin-top: 10px;">
              +增加项目
            </el-button>
          </div>
        </el-form-item>
        
        <!-- 需要购买保险 -->
        <el-form-item label="*需要购买保险" prop="requireInsurance">
          <el-radio-group v-model="registrationForm.requireInsurance">
            <el-radio :label="true">是</el-radio>
            <el-radio :label="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 报名咨询电话 -->
        <el-form-item label="报名咨询电话">
          <el-input 
            v-model="registrationForm.consultationPhone" 
            placeholder="请输入咨询电话"
            style="width: 300px;"
          ></el-input>
          <span class="hint-text">若为座机请加上区号,如:0592-1000000</span>
        </el-form-item>
        
        <!-- 活动地址 -->
        <el-form-item label="活动地址">
          <div class="address-container">
            <el-select v-model="registrationForm.province" placeholder="请选择省份" style="width: 150px; margin-right: 10px;">
              <el-option 
                v-for="province in provinces" 
                :key="province.value" 
                :label="province.label" 
                :value="province.value"
              ></el-option>
            </el-select>
            <el-select v-model="registrationForm.city" placeholder="请选择城市" style="width: 150px; margin-right: 10px;">
              <el-option 
                v-for="city in cities" 
                :key="city.value" 
                :label="city.label" 
                :value="city.value"
              ></el-option>
            </el-select>
            <el-select v-model="registrationForm.district" placeholder="请选择区县" style="width: 150px; margin-right: 10px;">
              <el-option 
                v-for="district in districts" 
                :key="district.value" 
                :label="district.label" 
                :value="district.value"
              ></el-option>
            </el-select>
            <el-input 
              v-model="registrationForm.detailAddress" 
              placeholder="请填写街道、门牌号"
              style="width: 300px;"
            ></el-input>
          </div>
          <div class="coordinates-container" style="margin-top: 10px;">
            <span class="label-text">地址坐标:</span>
            <el-input 
              v-model="registrationForm.latitude" 
              placeholder="纬度"
              style="width: 150px; margin-right: 10px;"
            ></el-input>
            <el-input 
              v-model="registrationForm.longitude" 
              placeholder="经度"
              style="width: 150px;"
            ></el-input>
          </div>
        </el-form-item>
        
        <!-- 报名表单信息 -->
        <el-form-item label="*报名表单信息" prop="formFields">
          <div class="form-fields-table">
            <el-table :data="registrationForm.formFields" style="width: 100%;">
              <el-table-column label="报名项名称" width="200">
                <template #default="scope">
                  <el-input 
                    v-model="scope.row.fieldName" 
                    placeholder="请输入报名项名称"
                    size="small"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="是否必填" width="150">
                <template #default="scope">
                  <el-checkbox v-model="scope.row.required">必填</el-checkbox>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="removeFormField(scope.$index)"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" @click="addFormField" style="margin-top: 10px;">
              新增报名项
            </el-button>
          </div>
        </el-form-item>
        
        <!-- 操作按钮 -->
        <!-- <el-form-item>
          <el-button @click="saveDraft">存草稿</el-button>
          <el-button type="primary" @click="publishRegistration">发布</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item> -->
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const formRef = ref()

const registrationForm = reactive({
  maxParticipants: null,
  registrationTime: [],
  activityTime: [],
  registrationItems: [
    { itemName: '', cost: null, maxPeople: null }
  ],
  requireInsurance: true,
  consultationPhone: '',
  province: '福建省',
  city: '厦门市',
  district: '思明区',
  detailAddress: '',
  latitude: '',
  longitude: '',
  formFields: [
    { fieldName: '姓名', required: true },
    { fieldName: '手机号', required: true }
  ]
})

// 地区数据
const provinces = ref([
  { label: '福建省', value: '福建省' },
  { label: '广东省', value: '广东省' },
  { label: '浙江省', value: '浙江省' }
])

const cities = ref([
  { label: '厦门市', value: '厦门市' },
  { label: '福州市', value: '福州市' },
  { label: '泉州市', value: '泉州市' }
])

const districts = ref([
  { label: '思明区', value: '思明区' },
  { label: '湖里区', value: '湖里区' },
  { label: '集美区', value: '集美区' }
])

const rules = {
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
  requireInsurance: [
    { required: true, message: '请选择是否需要购买保险', trigger: 'change' }
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
  ]
}

// 添加报名项目
const addItem = () => {
  registrationForm.registrationItems.push({
    itemName: '',
    cost: null,
    maxPeople: null
  })
}

// 删除报名项目
const removeItem = (index: number) => {
  if (registrationForm.registrationItems.length > 1) {
    registrationForm.registrationItems.splice(index, 1)
  } else {
    ElMessage.warning('至少需要保留一个报名项目')
  }
}

// 添加表单字段
const addFormField = () => {
  registrationForm.formFields.push({
    fieldName: '',
    required: false
  })
}

// 删除表单字段
const removeFormField = (index: number) => {
  if (registrationForm.formFields.length > 1) {
    registrationForm.formFields.splice(index, 1)
  } else {
    ElMessage.warning('至少需要保留一个报名表单字段')
  }
}






// 返回
const goBack = () => {
  // 这里可以添加返回逻辑，比如路由跳转
  console.log('返回上一页')
}

// 重置表单
const resetForm = () => {
  formRef.value.resetFields()
  registrationForm.registrationItems = [
    { itemName: '', cost: null, maxPeople: null }
  ]
  registrationForm.formFields = [
    { fieldName: '姓名', required: true },
    { fieldName: '手机号', required: true }
  ]
}





</script>

<style scoped>
.activity-registration {
  padding: 20px;
}

.registration-content {
  margin-top: 20px;
  max-width: 1000px;
}

.unit-text {
  margin-left: 10px;
  color: #666;
}

.hint-text {
  margin-left: 10px;
  color: #999;
  font-size: 12px;
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
</style> 