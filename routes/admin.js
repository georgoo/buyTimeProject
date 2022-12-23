let express = require('express');
const { Db } = require('mongodb');
require('dotenv').config()
// const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
let router = express.Router();
const { upload, upload3 } = require('../public/javascripts/multer')
//Verifies the Admin
const verifyAdminLogin=(req,res,next)=>{
  if(req.session.aloggedIn){
    next()
  }else{
    res.redirect('/admin/login')
  }
}

const verifyNotAdminLogin=(req,res,next)=>{
  if(req.session.aloggedIn){
    res.redirect('/admin')
  }else{
    next()
  }
}
const credential={
  email:process.env.adminEmail,
  password:process.env.adminPassword
}

router.get('/login',verifyNotAdminLogin, (req, res) => {
  res.render('admin/adminLogin')
})
/* GET users listing. */
router.get('/', async function(req, res) {
  if (req.session.aloggedIn){
    
      let re=await adminHelpers.getTotalSalesGraph()
      let { dailySale, monthSales, yearlySale } =re
      let todaySale = await  adminHelpers.getTodaySales()
      let totalusers = await adminHelpers.getAllUsers()
      let getMonthlyAmount = await adminHelpers.getMonthlyTotal()
    let paymentsReport = await adminHelpers.getPaymentGraph();
    let {percentageCOD, percentageUPI, percentagePaypal} = paymentsReport
    console.log("paymentsReport");
    console.log(paymentsReport);
    console.log("paymentsReport");

      let paymentmethodsCount= await adminHelpers.getPaymentMethodCount()
      console.log(todaySale,"todaySale");
      console.log(totalusers,"totalusers");
      console.log(getMonthlyAmount,"totalusers");
      res.render('admin/charts',{admin:true,todaySale,totalusers,getMonthlyAmount,dailySale,monthSales,yearlySale,percentageCOD, percentageUPI, percentagePaypal});   
  }else{  
    // res.render('admin/adminLogin',{'aloginErr':req.session.aloginErr});
    res.redirect('/admin/login')
    req.session.aloginErr=false
  } 
});

//Gets the login Page
// router.get('/admin/adminLogin',verifyAdminLogin,(req,res)=>{ 
//   res.render('admin/index',{admin:true})
// })

//Submit Login Page
router.post('/adminLogin', function (req, res) {
  console.log("njnnk");
  adminHelpers.adminLogin(req.body).then(async(response) => {
    console.log(response,"kniknk");
    if (response.status) {
      req.session.admin=response.user
      req.session.aloggedIn = true
      res.redirect('/admin')    
    }else{
      req.session.aloginErr='Invalid Username or PassWord'
      req.session.aloggedIn=false
      res.redirect('/admin/login')
    }
  })
});

//Admin Logout Button
router.get('/adminLogout', (req, res) => {
  delete req.session.admin
  req.session.aloggedIn = null
  res.redirect('/admin/login')

})
//GET the products Page 
router.get('/viewproducts',verifyAdminLogin,async  function (req, res) {
  const page = parseInt(req.query.page) 
  let productsCount = await productHelpers.getProductsCount()
  productHelpers.getPaginatedResult(page, productsCount).then(({limit,startIndex,results}) => {
    
    productHelpers.getAllProducts(limit,startIndex).then((products, category, brands) => {
      res.render('admin/view-products', { admin: 'admin', products, category, brands,results, editProductMessage: req.session.editProductMessage });
      req.session.editProductMessage = false
  })
    
  })
});
//GET the user page
router.get('/viewUsers',verifyAdminLogin, async function (req, res) {
  const page = parseInt(req.query.page) 
  let userCount = await userHelpers.getUserCount()
  productHelpers.getPaginatedResult(page, userCount).then(async({limit,startIndex,results}) => {
    userHelpers.getAllUsers(limit,startIndex).then((users) => {
      res.render('admin/view-users',{admin:'admin',users,results});
    })
    
})
});


//Gets the product adding Page
router.get('/addproducts', async(req, res )=> {
  let categories = await productHelpers.getAllCategories()
  let brands = await productHelpers.getAllBrands()
  console.log(brands);
  console.log(categories);
  res.render('admin/add-product', { admin: 'admin', categories, brands, addProductMessage: req.session.addProductMessage });
  req.session.addProductMessage=false
});


//Submit the Add Product Page
router.post('/add-products',upload.array('image'), function(req, res ) {
  const files = req.files
  const file = files.map((file)=>{
      return file
  })
  const fileName = file.map((file)=>{
      return file.filename
  })
  const product = req.body
  product.originalPrice = parseInt(product.Price)
  product.img = fileName
  productHelpers.addproduct(req.body, (id) => {
    req.session.addProductMessage = "Product Added SuccessFully"
    res.redirect('/admin/addproducts')  

  })
});
//Gets the edit Product Page
router.get('/edit-product/:id', async (req, res) => {
  let brands=await productHelpers.getAllBrands()
  let categories = await productHelpers.getAllCategories()
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{admin:'admin',product,categories,brands})
})
//Submits the edit Product page
router.post('/edit-product/:id', upload.array('image'), async (req, res) => {
  try {
    let oldProductDetails = await productHelpers.getProductDetails(req.params.id)
    console.log(oldProductDetails,"old");
    const file = req.files
    let filename
    req.body.img =(req.files.length!=0) ? (filename = file.map((file)=>{ return file.filename })) : oldProductDetails.img

    await productHelpers.updateProduct(req.params.id, req.body).then((response) => {
      req.session.editProductMessage = "Product Edited SuccessFully"
      res.redirect('/admin/viewproducts'); 
    }).catch(error=>{
      console.log(error);
    })   
  } catch (error) {
    console.log(error)
  }
})

//Delete Product request
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/viewproducts')
  })
})

//Gets the category Listing page   
router.get('/category',verifyAdminLogin,async (req, res) => {
  const page = parseInt(req.query.page) 
  let categoryCount = await productHelpers.getCategoryCount()
  productHelpers.getPaginatedResult(page, categoryCount).then(async({limit,startIndex,results}) => {
    let categories = await productHelpers.getCategories(limit, startIndex) 
    res.render('admin/category', { admin: 'admin', categories,editCategoryMessage:req.session.editCategoryMessage,results })
    req.session.editCategoryMessage=false
  })
})

//Gets the category adding Page 
router.get('/addCategory',(req,res)=>{
  res.render('admin/addCategory', { admin: 'admin',addCategoryMessage:req.session.addCategoryMessage })
  req.session.addCategoryMessage=false
  
})
//Submits the category Adding Page
router.post('/addCategory',(req,res)=>{
  productHelpers.addCategory(req.body).then(() => {
    req.session.addCategoryMessage="Category Added Successfully"
    res.redirect('/admin/addCategory')
  })
})

router.get("/editCategory/:id", async (req, res) => {
  let category = await productHelpers.getCategoryDetails(req.params.id)
  console.log(category,"Cat");
  res.render("admin/editCategory", { admin: "admin", category})
  
 })

router.post('/editCategory/:id', async (req, res) => {
  let id=req.params.id
  productHelpers.updateCategory(req.params.id, req.body).then(() => {
    req.session.editCategoryMessage="Category Edited Successfully"
    res.redirect('/admin/category')
  })
})

router.get('/brand',verifyAdminLogin, async (req, res) => {
  const page = parseInt(req.query.page) 
  let brandCount = await productHelpers.getBrandCount()
  productHelpers.getPaginatedResult(page, brandCount).then(async({limit,startIndex,results}) => {
    let brands = await productHelpers.getBrands(limit,startIndex)
    res.render('admin/brand', { admin: 'admin', brands,editBrandMessage:req.session.editBrandMessage,results})
    req.session.editBrandMessage=false
  })
})

router.get('/addBrand',(req,res)=>{
  res.render('admin/addBrand', { admin: 'admin', addBrandMessage: req.session.addBrandMessage })
  req.session.addBrandMessage=false
})

router.post('/addBrand',(req,res)=>{
  productHelpers.addBrand(req.body).then(() => {
    req.session.addBrandMessage="Brand Added Successfully"
    res.redirect('/admin/addBrand')
  })
})

router.get("/editBrand/:id", async (req, res) => {
  let brand = await productHelpers.getBrandDetails(req.params.id)
     res.render("admin/editBrand",{admin:"admin",brand})
})
 
router.post('/editBrand/:id', async (req, res) => {
  let id=req.params.id
  productHelpers.updateBrand(req.params.id, req.body).then(() => {
    req.session.editBrandMessage="Brand Edited Successfully"
    res.redirect('/admin/brand')
  })
})

router.get('/deleteBrand/:id', async(req, res) => {
  let brandId = req.params.id
  await adminHelpers.removeBrand(brandId).then((response) => {
    res.redirect('/admin/brand')
  
  })
})

// blocking user request
router.get('/block/:id',(req,res)=>{
 let userId =  req.params.id
 adminHelpers.blockUser(userId).then((response)=>{
  res.redirect('/admin/viewUsers')
 })
})
//Unblocking user request
router.get('/unblock/:id',(req,res)=>{
  let userId=req.params.id
  adminHelpers.unblockUser(userId).then((response)=>{
    res.redirect('/admin/viewUsers')
  })
})
//Gets the sales chart and graphs
router.get('/charts',verifyAdminLogin, async(req,res)=>{
  let response=await adminHelpers.getTotalSalesGraph()
  let { dailySale, monthSales, yearlySale } = response
  let todaySale = await  adminHelpers.getTodaySales()
  let totalusers = await adminHelpers.getAllUsers()
  let getMonthlyAmount = await adminHelpers.getMonthlyTotal()
  res.render('admin/charts',{admin:'admin',dailySale,monthSales,yearlySale,todaySale,totalusers,getMonthlyAmount})
})

router.get('/charts-test',async(req,res)=>{
  let response=await adminHelpers.getTotalSalesGraph()
  let {dailySale,monthSales,yearlySale}=response
  res.render('admin/charttest',{admin:'admin',dailySale,monthSales,yearlySale})
})

// Gets all the orders
router.get('/orderManagement',verifyAdminLogin, async (req, res) => {
  const page = parseInt(req.query.page)
  let orderCount = await productHelpers.getOrderCount()
  productHelpers.getPaginatedResult(page, orderCount).then(async({limit,startIndex,results}) => {
    let allOrders=await adminHelpers.getAllOrders(limit,startIndex)
     res.render('admin/orderManagement',{admin:'admin',allOrders,results})
  })
})
 
router.get("/couponAdding",verifyAdminLogin, async (req, res) => {
  const page = parseInt(req.query.page) 
  let couponCount = await productHelpers.getCouponCount()
  productHelpers.getPaginatedResult(page, couponCount).then(async({limit,startIndex,results}) => {
    let coupon= await adminHelpers.getAllCoupons(limit,startIndex)
    res.render('admin/addCoupon', { admin: 'admin', coupon,addCouponMessage:req.session.addCouponMessage,results })
    req.session.addCouponMessage=false
  })
});

router.post("/addCoupon", async(req, res) => {
  await adminHelpers.addCoupon(req.body)
  req.session.addCouponMessage="Coupon Added Succesfully"
  res.redirect("/admin/couponAdding")
});

router.get("/deleteCoupon/:id", async (req,res) => {
  let couponId= req.params.id
  await adminHelpers.removeCoupon(couponId).then((response) => {
    res.redirect("/admin/couponAdding")
  })
})

router.get("/deleteCategory/:id", async (req, res) => {
 let categoryId=req.params.id
  await adminHelpers.removeCategory(categoryId).then((response) => {
    res.redirect("/admin/category")
  })
})

router.get("/banners",verifyAdminLogin, async (req, res) => {
  const page = parseInt(req.query.page) 
  let bannerCount = await productHelpers.getBannerCount()
  productHelpers.getPaginatedResult(page, bannerCount).then(async({limit,startIndex,results}) => {
    let banners= await productHelpers.getAllBanners(limit,startIndex)
    res.render("admin/viewBanners", { admin: "admin", banners,bannerAddedMessage:req.session.bannerAddedMessage,results })
    req.session.bannerAddedMessage=false
  })
})

router.get("/add-banner",verifyAdminLogin, (req, res) => {
  res.render("admin/addBanner",{admin:"admin"})
})

router.post("/addBanners",upload3.array('image'), (req, res) => {
  const files = req.files
  const file = files.map((file)=>{
      return file
  })
  const fileName = file.map((file)=>{
      return file.filename
  })
  const banner = req.body
  banner.img = fileName

  productHelpers.addBanner(req.body, (id) => {
    req.session.bannerAddedMessage="Banner added successfully"
    res.redirect("/admin/banners")
    
  })
})
router.get("/deleteBanner/:id", async(req, res) => {
  let bannerId=req.params.id
  await adminHelpers.deleteBanner(bannerId).then((response) => {
    res.redirect("/admin/banners")
  })
})

router.get("/salesReport",verifyAdminLogin, async(req, res) => {
  let salesReport = await adminHelpers.getSalesReport()
  console.log(salesReport, "iji");
  let monthlyReport = await adminHelpers.getMonthlyReport()
  let yearlyReport = await adminHelpers.getYearlyReport()
  let { weeklyReport} = salesReport
  res.render("admin/salesReport", { admin: 'admin',weeklyReport,monthlyReport,yearlyReport})
})

router.post("/updateOrderStatus/:id", (req, res) => {
  adminHelpers.updateOrderStatus(req.params.id,req.body)
  res.redirect("/admin/orderManagement")
})

router.get("/view-orders/:id",verifyAdminLogin, async(req, res) => {
  console.log(req.params.id);
  orderDetails = await adminHelpers.getOrderDetails(req.params.id)
  orderedProducts = await userHelpers.getOrderProducts(req.params.id)
  console.log(orderedProducts,"orderedProductsorderedProducts");
  res.render("admin/orderDetails",{admin:"admin",orderDetails,orderedProducts})
})

module.exports = router;
