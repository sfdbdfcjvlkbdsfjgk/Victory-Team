const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://yy2935140484:439952014710q@cluster0.kuvzpp4.mongodb.net/sport').then(() => {
    console.log('数据库连接成功')
}).catch(err => {
    console.log('数据库连接失败', err)
})

// const userSchema = new mongoose.Schema({
//     username: String,
//     password: String,
// })
// const User = mongoose.model('User', userSchema)
const activitymanageSchema = new mongoose.Schema({
        id: String,
        title: String,
        activityprogress: String,
        sportstype: String,
        state: String,
        topstate: String,
        type: String,
        enrollment: Number,
        readnumber: Number,
        createtime: Date
})
const Activitymanage = mongoose.model('activitymanage', activitymanageSchema,'activitymanage')








module.exports = {
    // User
    Activitymanage
}