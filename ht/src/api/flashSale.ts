import api from './txs';

// 获取活动列表
export const getFlashSaleList = (params: any) => api.get('/bkc/flash-sale/activities', { params });
// 新建活动
export const createFlashSale = (data: any) => api.post('/bkc/flash-sale/activities', data);
// 编辑活动
export const updateFlashSale = (id: string, data: any) => api.put(`/bkc/flash-sale/activities/${id}`, data);
// 删除活动
export const deleteFlashSale = (id: string) => api.delete(`/bkc/flash-sale/activities/${id}`);
// 下线活动
export const offlineFlashSale = (id: string) => api.post(`/bkc/flash-sale/activities/${id}/offline`); 