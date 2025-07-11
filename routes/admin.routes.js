const express = require("express")
const {addNewProduct,deleteProduct,updateProduct,productDetails} = require("../controllers/admin.controller")
const AdminRouter = express.Router()



AdminRouter.post('/addProduct',addNewProduct)
AdminRouter.delete('/deleteProduct',deleteProduct)
AdminRouter.put('/updateProduct',updateProduct)
AdminRouter.post('/productDetails',productDetails)














module.exports = AdminRouter