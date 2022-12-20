let express = require("express");
require('dotenv').config()
const { Db, ObjectId } = require("mongodb");
let router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const client = require("twilio")(
  process.env.twilioAccountSID,
  process.env.twilioAuthToken
);
const paypal = require("paypal-rest-sdk");
const { getOrderdetails } = require("../helpers/user-helpers");
const collection = require("../config/collection");
paypal.configure({
  mode: "sandbox",
  client_id:
  process.env.paypalClientId,
  client_secret:
  process.env.paypalClientSecret,
});



//To verify the user
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/userlogin");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let usersession = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let banners = await productHelpers.getBanners()
  productHelpers.getAllProducts().then((products) => {
    res.render("user/index", {
      user: "user",
      products,
      usersession,
      cartCount,
      banners,
    });
  });
});
/*GET Login Page*/
router.get("/userlogin", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/userlogin", {
      user: "user",
      loginErr: req.session.loginErr,
    });
    req.session.loginErr = false;
  }
});
/*Submit the Login Form */
router.post("/login", function (req, res, next) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.block) {
      req.session.loginErr = "Admin Blocked You";
      res.redirect("/userlogin");
    } else if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      let d = new Date().toJSON().slice(0, 10).replace(/-/g, "-")
      console.log(d,"ddddd");
      res.redirect("/");
    } else {
      req.session.loginErr = "Invalid Username or PassWord";
      res.redirect("/userlogin");
    }
  });
});
/*GET Signup Page*/
router.get("/usersignup", function (req, res, next) {
  res.render("user/userSignup", { user: "user",emailMessage:req.session.emailMessage,phoneMessage :req.session.phoneMessage});
  req.session.emailMessage = ""
   req.session.phoneMessage = ""
});
/*Submitting Signup Form*/
router.post("/signup", function (req, res, next) {
  req.body.blockStatus = false;
  userHelpers.doSignUp(req.body).then((response) => {
    req.session.loggedIn = true;
    req.session.user = response;
    res.redirect("/");  
  }).catch((response) => {
   req.session.emailMessage = response.emailMessage
   req.session.phoneMessage = response.phoneMessage
    res.redirect("/usersignup")
    // res.render("user/usersignup",{emailMessage,phoneMessage,user:"user"})
  })
});

/*Logout Button*/
router.get("/logout", (req, res) => {
  delete req.session.user;
  req.session.loggedIn = false;
  res.redirect("/");
});
//GET cart Page
router.get("/cart", verifyLogin, async (req, res) => {
  req.session.loggedIn = true;
  let usersession = req.session.user;
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
  let getTotalMRP = await userHelpers.getTotalMRP(req.session.user._id);
  console.log(getTotalMRP,"hooha");
  console.log(products,"hooha");
  res.render("user/cart", {
    user: req.session.user._id,
    products,
    totalValue,
    usersession,
    getTotalMRP
  });
});
//GET user Profile Page
router.get("/userProfile", verifyLogin, async (req, res) => {
  let usersession = req.session.user;
  let userProfile = await userHelpers.getUser(req.session.user._id);
  res.render("user/userProfile", { user: req.session.user._id, userProfile,usersession });
});
//GET edit user page
router.get("/editUser", verifyLogin, async (req, res) => {
  let usersession = req.session.user;
  let userDetails = await userHelpers.getUser(req.session.user._id);
  res.render("user/edit-user", { user: "user" , userDetails,usersession });
});
//Submit Edit User Page
router.post("/editUser", verifyLogin, (req, res) => {
  userHelpers.updateUser(req.session.user._id, req.body).then(() => {
    console.log(req.session.user._id);
    res.redirect("/userProfile");
  });
});
//GET product details page
router.get("/productDetails/:id", verifyLogin, async (req, res) => {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let usersession = req.session.user;
  let product = await productHelpers.getProductDetails(req.params.id);
  res.render("user/product-details", {
    user: "user",
    product,
    usersession,
    cartCount,
  });
});
//GET OTP Login page
router.get("/otp", (req, res) => {
  if (req.session.otpError) {
    return res.render("user/otp", {
      otpError: req.session.otpError,
      user: "user",
    });
  }
  res.render("user/otp", { user: "user" });
});
//OTP Login API SUBMIT
router.post("/sendcode", async (req, res) => {
  req.session.phonenumber = req.body.phonenumber;

  let user = await userHelpers.verifyPhoneNumber(req.body.phonenumber);
  if (user) {
    req.session.user = user;
    client.verify
      .services(process.env.twilioServiceId) // Change service ID
      .verifications.create({
        to: `+91${req.body.phonenumber}`,
        channel: req.query.channel === "call" ? "call" : "sms",
      })
      .then((data) => {
        res.render("user/otpMessage");
      })
      .catch((err) => {
        console.log(err)
      });
  } else {
    req.session.otpError = "Invalid phone number";
    res.redirect("/otp");
  }
});
//OTP Login API verify
router.post("/verify", (req, res) => {
  client.verify
    .services(process.env.twilioServiceId) // Change service ID
    .verificationChecks.create({
      to: `+91${req.session.phonenumber}`,
      code: req.body.code,
    })
    .then((data) => {
      if (data.status === "approved") {
        req.session.loggedIn = true;
        // req.session.user = req.session.user;
        res.redirect("/");
      } else {
         signupErr = "invalid OTP !!",
         res.render("user/otpMessage",{signupErr})
        
      }
    });
});

//Add to cart button
router.get("/add-to-cart/:id", (req, res) => {
  console.log("adding");
  userHelpers.addToCart(req.params.id, req.session.user._id);
  res.json({ status: true });
});
//Remove from cart Button
router.get("/removeFromCart/:id", verifyLogin, async (req, res) => {
  await userHelpers.removeFromCart(req.params.id, req.session.user._id);
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  // let response
  console.log(total);
  res.json({ status: true, total});
}); 

//GET Wishlist Page
router.get("/wishlist", verifyLogin, async (req, res) => {
  let usersession = req.session.user;
  wishItems = await userHelpers.getWishlistItems(req.session.user._id);
  res.render("user/wishlist", { user: "user", wishItems, usersession });
});
//Add to wishlist Heart Icon
router.get("/add-to-wishlist/:id", verifyLogin, (req, res) => {
  userHelpers.addToWishList(req.params.id, req.session.user._id);
  res.json({ status: true });
});
// Remove product from wishlist
router.get("/removeFromWishlist/:id", (req, res) => {
  userHelpers.removeFromWishList(req.body,req.params.id)
  console.log(req.body);
  res.redirect("/wishlist")
});

//Change Product quantity  Buttons in cart
router.post("/change-product-quantity", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});
//GET checkout Page
router.get("/placeOrder", verifyLogin, async (req, res) => {
  let usersession = req.session.user;
  let user = req.session.user._id;
  
  let addresses = await userHelpers.getAddress(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  let savedAmount=0
  let originalPrice=await userHelpers.getTotalMRP(req.session.user._id);
  let walletAmount = await userHelpers.getWalletAmount(req.session.user._id);
 
  let coupon = "";
  if (req.session.totalPrice) {
    total = req.session.totalPrice;
  }
  if (req.session.savedAmount) {
    savedAmount=req.session.savedAmount
  }
  if (req.session.coupon) {
    coupon = req.session.coupon
  }
  
  console.log(req.session.user);
  let discountPrice = await userHelpers.getCouponAppliedPrice(req.session.user._id, total)

  console.log(discountPrice,"haaa");
  res.render("user/checkout", { user: req.session.user,user, usersession,total,addresses, coupon,walletAmount,originalPrice,savedAmount});
});

//Gets Add address Page
router.get("/addAddress", verifyLogin,async(req, res) => {
  res.render("user/addAddress",{user:'user'});
});

//Placing order Button
router.post("/place-order", async (req, res) => {
  console.log('body');
  console.log(req.body);
  console.log('body');
  let address = await userHelpers.getSelectedAddress(req.body.addressId)
  let products = await userHelpers.getCartProductList(req.session.user._id);
  let totalPrice = await userHelpers.getTotalAmount(req.session.user._id);
  let walletAmount = await userHelpers.getWalletAmount(req.session.user._id)
  let  walletTotal = walletAmount.totalWalletAmount
  if (req.session.totalPrice) {
    totalPrice = req.session.totalPrice;
  }
  
  if (req.body["payment-method"] == "WALLET" && walletTotal < totalPrice) {
    
    res.json({ walletNotEnough: true });
    
  } else{
  
  userHelpers.placeOrder(req.body, address, products, totalPrice, req.session.user._id).then(async(orderId) => {
   
    if (req.body["payment-method"] == "COD") {
      res.json({ codSuccess: true });
      productHelpers.getOrderProductsQuantity(orderId).then((data) => {
        data.forEach((element) => {
          productHelpers.updateStockDecrease(element);
        });
      });
    } else if (req.body["payment-method"] == "WALLET") {
      
        let order = await userHelpers.getOrderdetails(orderId)
        res.json({ walletSuccess: true });
        
        await userHelpers.addToWalletHistory(req.session.user._id,order)
        await userHelpers.decrementWalletAmount(req.session.user._id,walletTotal,totalPrice)
        productHelpers.getOrderProductsQuantity(orderId).then((data) => {
          data.forEach((element) => {
            productHelpers.updateStockDecrease(element);
          });
        });
      
    } else if (req.body["payment-method"] == "RAZORPAY") {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response);
        productHelpers.getOrderProductsQuantity(orderId).then((data) => {
          data.forEach((element) => {
            productHelpers.updateStockDecrease(element);
          });
        });
      });
    } else {
      console.log("It's paypal");
      res.json({ paypalT: true, order: orderId });
      productHelpers.getOrderProductsQuantity(orderId).then((data) => {
        data.forEach((element) => {
          productHelpers.updateStockDecrease(element);
        });
      });
    }
  });
}
});
//GET order success Page
router.get("/order-success", verifyLogin, (req, res) => {
  req.session.totalPrice = false
  req.session.coupon = false
  req.session.savedAmount = false
  
  res.render("user/orderSuccess", { user: req.session.user });
});
//GET Order list Page
router.get("/orders",verifyLogin, async (req, res) => {
  let page = req.query.page
  let orderCount = await productHelpers.getOrderCount()
  let usersession = req.session.user;
  productHelpers.getPaginatedResult(page, orderCount).then(async({limit,startIndex,results}) => {
    let orders = await userHelpers.getUserOrders(req.session.user._id,limit,startIndex);
    // console.log(orders);
    res.render("user/orders", { user: req.session.user, orders, usersession,results });
    
  })
});


//GET view ordered product Individually
router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  orderId=req.params.id
  let usersession = req.session.user;
  let products = await userHelpers.getOrderProducts(orderId);
  console.log(orderId,"orderId");
  res.render("user/view-order-products", {
    user: req.session.user,
    products,
    usersession,
    orderId
  });
});


router.get("/cancel-order/:id", verifyLogin,async (req, res) => {
  let usersession = req.session.user;
  let order = await userHelpers.getOrderdetails(req.params.id)
  let totalAmount =await userHelpers.getOrderTotalAmount(req.params.id)
  let paymentMethod = order.paymentMethod
  console.log(paymentMethod, "paymentMethod");
  userHelpers.cancelOrder(req.params.id).then(async() => {
    productHelpers.getOrderProductsQuantity(req.params.id).then((data) => {
      data.forEach((element) => {
        productHelpers.updateStockIncrease(element);
      });
    });
    if (paymentMethod != 'COD') {
      console.log("Its not cod");
      await userHelpers.refundToWallet(req.session.user._id, totalAmount)
      await userHelpers.addToWalletHistory(req.session.user._id,order)
    }
    console.log(req.params.id);
    res.render("user/orderCancelled",{user: req.session.user,usersession})
    
  })
})

router.get("/returnProduct/:id", async(req, res) => {
  console.log("entered")

  let order = await userHelpers.getOrderdetails(req.params.id)
  userHelpers.returnProduct(req.params.id).then(() => {
    productHelpers.getOrderProductsQuantity(req.params.id).then(async (data) => {
  console.log("order producd") 
      data.forEach((element) => {
        productHelpers.updateStockIncrease(element);
      });
      let totalAmount =await userHelpers.getOrderTotalAmount(req.params.id)
      console.log(totalAmount,"total");
      await userHelpers.refundToWallet(req.session.user._id, totalAmount)
      await userHelpers.addToWalletHistory(req.session.user._id,order)
      res.redirect("/orders")
    });
  }) 
})

router.post("/verify-payment", (req, res) => {
  console.log(req.body);
  userHelpers
    .veryfyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        console.log("payment Successfull");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "" });
    });
});

//paypal
router.post("/pay", (req, res) => {
  let order = req.body.orderId;
  try {
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/success?order=" + order,
        cancel_url: "http://localhost:3000/cancel",
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: "25.00",
          },
          description: "testtt",
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.json(payment.links[i].href);
          }
        }
      }
    });
  } catch (e) {
    console.log(e);
  }
});

router.get("/success", (req, res) => {
  let orderId = req.query.order;
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: "25.00",
          },
        },
      ],
    };

    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      function (error, payment) {
        if (error) {
          console.log(error.response);
          throw error;
        } else {
          console.log(JSON.stringify(payment));
          let user = req.session.user;
          userHelpers.deleteOrder(user._id).then(() => {
            userHelpers.updateOrder(orderId);
            res.redirect("/order-success");
          });
        }
      }
    );
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

//save asdress 
router.post("/saveAddress",async(req, res) => {
await userHelpers.saveAddress(req.body,req.session.user._id).then((response) => {
})
res.redirect("/addAddress");
});



router.get("/productFilter", async(req, res) => {
  let categories=await productHelpers.getAllCategories()
  productHelpers.getAllProducts().then((products) => {
    res.render("user/productSort", {
      user: "user",
      products,
      categories
    });
  });
})

router.post('/getCategorisedResults', async(req, res) => {
  console.log(req.body.category, "useruseruseruser");
  let categoryName=await productHelpers.getCategoryNames(req.body.category)
  let categoryProducts=await productHelpers.getCategoriesForUserSide(req.body.category)
  res.render('user/categorisedResults',{user:'user',categoryProducts,categoryName})
})


router.post("/applyCoupon", verifyLogin, async (req, res) => {
  try {
    let cartTotal= await userHelpers.getTotalAmount(req.session.user._id)
    let coupon = await userHelpers.applyCoupon(req.body, cartTotal, req.session.user._id)
    req.session.totalPrice = coupon.totalPriceAfterOffer;
    req.session.savedAmount = coupon.savedAmount;
    req.session.coupon = coupon
    console.log(coupon);
    req.session.couponId=coupon.couponId;
    res.json(coupon)
  } catch (error) {
    console.log(error);
    res.json(error)
  }
});

router.get('/removeCoupon', (req, res) => {
  console.log(req.session.couponId);
  userHelpers.removeCoupon(req.session.user._id,req.session.couponId)
  req.session.coupon.couponAppliedMessage = false
  req.session.totalPrice=false
  req.session.savedAmount=false
  res.redirect("/placeOrder")
})

router.get('/view-invoice/:id',async (req,res) => {
  let orderId = req.params.id
  let order = await userHelpers.getOrderdetails(orderId)
 let orderProducts= await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-invoice',{user:'user',order,orderProducts})
})

router.get('/walletHistory', verifyLogin, async(req, res) => {
  let usersession = req.session.user;
  let userDetails = await userHelpers.getUser(req.session.user._id)
  let walletAmount = userDetails.totalWalletAmount
  let wallet = await userHelpers.getWalletHistory(req.session.user._id)
  let walletDetails=wallet.orderDetails
  console.log(walletDetails,"walletDetails");
  res.render("user/walletHistory",{user:'user',usersession,walletAmount,walletDetails})
})



module.exports = router;
