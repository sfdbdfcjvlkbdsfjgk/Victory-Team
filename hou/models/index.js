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









module.exports = {
    // User
}