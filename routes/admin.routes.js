const express = require("express")
const {addNewProduct,deleteProduct,updateProduct,productDetails,getUserDetails,getCustomerOrder,
    getDashboardCounts
} = require("../controllers/admin.controller")
const AdminRouter = express.Router()



AdminRouter.post('/addProduct',addNewProduct)
AdminRouter.delete('/deleteProduct',deleteProduct)
AdminRouter.put('/updateProduct',updateProduct)
AdminRouter.post('/productDetails',productDetails)
AdminRouter.get('/getUserDetails',getUserDetails)
AdminRouter.get('/getCustomerOrder',getCustomerOrder)
AdminRouter.get('/getDashboardCounts',getDashboardCounts)















module.exports = AdminRouter