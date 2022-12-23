const collection = require("../config/collection");
let db = require("../config/connection");
const bcrypt = require("bcrypt");
// const { response } = require("express");
let objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { log } = require("console");

let instance = new Razorpay({
  key_id: "rzp_test_8qn3kB4rvSeZH8",
  key_secret: "wVczEsRlpH8tBCQF7I155amE",
});

module.exports = {
  doSignUp: (userData) => {
    let respond = {};
    return new Promise(async (resolve, reject) => {
      let userEmail = await db.get().collection(collection.USER_COLLECTION).findOne({ remail: userData.remail });
      let userMobile = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: userData.phone });
      if (userEmail) {
        respond.emailMessage = "User with Same Email Id Already exists";
        reject(respond);
      } else if (userMobile) {
        respond.phoneMessage = "User with Same Phone Number Already exists";
        reject(respond);
      } else {
        userData.totalWalletAmount = 0
        const salt = await bcrypt.genSalt(10);
        userData.rpassword = await bcrypt.hash(userData.rpassword, salt);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ remail: userData.remail });
      if (user) {
        bcrypt.compare(userData.rpassword, user.rpassword).then((status) => {
          if (status) {
            if (user.blockStatus == false) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              response.block = true;
              resolve(response);
            }
          } else {
            response.status = false;
            resolve(response);
          }
        });
      } else {
        response.status = false;
        resolve(response);
      }
    });
  },

  verifyPhoneNumber: (phonenumber) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ phone: phonenumber });
      resolve(user);
    });
  },

  getAllUsers: (limit,startIndex) => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find().sort({_id:-1}).limit(limit).skip(parseInt(startIndex)).toArray();
      resolve(users);
    });
  },
  getUserCount: () => {
    return new Promise(async(resolve,reject)=>{
        let count=await db.get().collection(collection.USER_COLLECTION).count()
        
        console.log("?????");
        console.log(count)

        resolve(count)


    })  
},

  getUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userProfile = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      resolve(userProfile);
    });
  },

  updateUser: (userId, userDetails) => {
    console.log(userId);
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              name: userDetails.name,
              remail: userDetails.remail,
              phone: userDetails.phone,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  addToCart: async(proId, userId) => {
    let productname =await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
    console.log(productname.Name,"productname");
    let productObj = {
      item: objectId(proId),
      quantity: 1,
      name:productname.Name
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let prodExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (prodExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: productObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [productObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {});
      }
    });
  },

  addToWishList: (proId, userId) => {
    let productObj = {
      item: objectId(proId),
    };
    return new Promise(async (resolve, reject) => {
      let userWishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userWishlist) {
        let prodExist = userWishlist.products.findIndex(
          (product) => product.item == proId
        );
        if (prodExist != -1) {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) }, {
                $pull: {
                  products:{item:objectId(proId)}
                }
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: productObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let wishlistObj = {
          user: objectId(userId),
          products: [productObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishlistObj)
          .then((response) => {});
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $addFields: {
              productTotal: {
                $multiply: ["$quantity", { $toInt: "$product.Price" }],
              },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    }); 
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  getTotalMRP: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ["$quantity", { $toInt: "$product.originalPrice" }],
                },
              },
            },
          },
        ])
        .toArray();
      if (total.length) {
        resolve(total[0].total);
      } else {
        resolve(total);
      }
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ["$quantity", { $toInt: "$product.Price" }],
                },
              },
            },
          },
        ])
        .toArray();
      if (total.length) {
        resolve(total[0].total);
      } else {
        resolve(total);
      }
    });
  },

  getSingleItemAmount: (userId) => {
    return new Promise(() => {});
  },

  placeOrder: (order, address, products, total, userId,couponDiscountAmount) => {
    console.log(order, "The oreer");
    console.log(total);
    console.log(address);
    let pricebeforeCoupon=order.originalPrice-(order.savedAmount-couponDiscountAmount)
    let d = new Date();
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    let time = [year, month, day].join("-");
    const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
    let monthofbusiness =monthNames[d.getMonth()]
    let yearofbusiness = year;
    return new Promise((resolve, reject) => {
      console.log(order, products, total);
      let status = order["payment-method"] === "COD" || "WALLET" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: address.address,

        userId: objectId(userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: parseInt(total),
        status: status,
        originalPrice:order.originalPrice,
        savedAmount: order.savedAmount,
        pricebeforeCoupon:pricebeforeCoupon,
        couponDiscountAmount:parseInt(couponDiscountAmount),
        date: time,
        month: monthofbusiness,
        year: yearofbusiness,
        createdAt: new Date()
      };

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .remove({ user: objectId(userId) });
          console.log("orderId :", response.insertedId);
          resolve(response.insertedId);
        });
    });
  },

  updateOrder: (orderId) => {
    console.log("orderId");
    console.log(orderId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then((data) => {
          console.log("data");
          console.log(data);
          console.log("data");
          resolve();
        });
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
    });
  },

  getUserOrders: (userId,limit,startIndex) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) }).sort({createdAt:-1}).limit(limit).skip(parseInt(startIndex))
        .toArray();
      resolve(orders);
    });
  },

  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              orderCancelled:1
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
              orderCancelled:1
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },

  removeFromCart: (proId, userId) => {
    console.log(userId, proId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: objectId(userId), "products.item": objectId(proId) },
          {
            $pull: {
              products: { item: objectId(proId) },
            },
          }
        )
        .then((result) => {
          console.log(result);
          resolve();
        });
    });
  },

  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("New Order :", order);
          resolve(order);
        }
      });
    });
  },

  veryfyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "wVczEsRlpH8tBCQF7I155amE");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  deleteOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .deleteOne({ _id: objectId(orderId) })
        .then(() => {
          resolve();
        });
    });
  },
  getWishlistIds: (userId) => {
    return new Promise(async(resolve, reject) => {
      let wishlists = await db.get().collection(collection.WISHLIST_COLLECTION).find({ user: objectId(userId) }, { products:1 }).toArray()
      console.log('wishlists')
      console.log(wishlists[0].products)
      console.log('wishlists')
      resolve(wishlists[0].products)
    })
  },

  getWishlistItems: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(wishItems);
    });
  },

  saveAddress: (address, userId) => {
    address.mobile = parseInt(address.mobile);
    return new Promise(async (resolve, reject) => {
      let addressObj = {
        user: objectId(userId),
        address,
      };
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .insertOne(addressObj)
        .then((response) => {
          resolve();
        });
    });
  },

  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .find({ user: objectId(userId) })
        .toArray();
      resolve(address);
    });
  },

  getSelectedAddress: (addressId) => {
    return new Promise(async (resolve, reject) => {
      let buyerAddress = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: objectId(addressId) });
      resolve(buyerAddress);
    });
  },

  removeFromWishList: (wishlist, proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { user: objectId(wishlist) },
          {
            $pull: {
              products: { item: objectId(proId) },
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  applyCoupon: (couponcode, cartTotal, userId) => {
    let response = {};
    let coupon = couponcode.coupon;
    // console.log(coupon);
    return new Promise(async (resolve, reject) => {
      let coup = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ couponCode: coupon });
      if (coup) {
        response.couponFind = true;
        // console.log("coupon is there");
        let expDate = coup.expiryDate;
        let currentDate = new Date().toJSON().slice(0, 10).replace(/-/g, "-");
        if (expDate >= currentDate) {
          response.couponExpired = false;
          let usedCoupon = await db
            .get()
            .collection(collection.USEDCOUPON_COLLECTION)
            .findOne({ couponId: objectId(coup._id) });
          if (usedCoupon) {
            //coupon already used
            response.usedCoupon = true;
            response.usedCouponMessage = "Coupon already used";
            reject(response)
          } else {
            response.usedCoupon = false;
            response.couponAppliedMessage = "Coupon Successfully applied";
            let couponDIscountPercentage = coup.percentage;
            let discountPrice = Math.round((couponDIscountPercentage / 100) * cartTotal);
            let savedAmount=discountPrice
            if (discountPrice >=coup.maxAmount) {
              discountPrice=coup.maxAmount
            }
            let totalPriceAfterOffer = cartTotal - discountPrice;
            response.totalPriceAfterOffer = totalPriceAfterOffer;
            response.discountPrice = discountPrice;
            response.couponId = coup._id
            response.savedAmount=savedAmount

            appliedCouponObj = {
              userId: objectId(userId),
              couponId: coup._id,
            };
            db.get()
              .collection(collection.USEDCOUPON_COLLECTION)
              .insertOne(appliedCouponObj);
            resolve(response);
            db.get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $set: { couponId: coup._id },
                },
                { upsert: true }
              );
          }
        } else {
          //coupon expired

          response.couponExpired = true;
          response.couponExpiredMessage = "Coupon is Expired!!!";
          console.log("coupon is  Expired");
          reject(response);
        }
      } else {
        //coupon not valid
        response.couponFind = false;
        response.couponNotFound = "Coupon Not Found";
        reject(response);
      }
    });
  },

  cancelOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
        $set: {
          status: "Cancelled",
          orderCancelled:true
        }
      })
      resolve()
    })
  },

  returnProduct: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId)}, {
        $set: {
          status: "returned",
          orderReturned:true
        }
      }).then(() => {
        
        resolve()
      })
    })
  },

  removeCoupon: (userId,couponId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USEDCOUPON_COLLECTION).deleteOne({ userId: objectId(userId), couponId: objectId(couponId) })
        .then(() => {
          resolve()
        })
    })
  },

  refundToWallet: (userId, totalAmount) => {
    
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
        
          $inc:{ totalWalletAmount:totalAmount}
       
      }).then(() =>{
        resolve()
        
      })
    })
  },
  getOrderTotalAmount: (orderId) => {
    return new Promise((resolve,reject) => {
      db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) }, {
        totalAmount: 1,_id:0
        
      }).then((total) => {
        console.log(total.totalAmount,"totalllllllllll")
        resolve(total.totalAmount)
      })
    })  
  },

  getWalletAmount: (userId) => {
    let wallet={}
    return new Promise(async(resolve, reject) => {
    wallet=await  db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) },{
        totalWalletAmount:1,_id:0
    })
        resolve(wallet)
      
      })
  },

  decrementWalletAmount: (userId, walletAmount,totalcartValue) => {
    console.log(walletAmount,"......");
    return new Promise((resolve, reject) => {
        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
          $inc: {
            totalWalletAmount: -totalcartValue
          }
        }).then(() => {
          resolve()
        })
       
    })
  },

  getOrderdetails: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) }).then((order) => {
        resolve(order)
      })
    })
  },

  addToWalletHistory: (userId, order) => {
    let orderObj={}
    if (order.paymentMethod=="WALLET") {
      orderObj = {
        orderId:order._id,
        orderDate: order.date,
        paymentMethod: order.paymentMethod,
        products: order.products,
        orderStatus: order.status,
        amountPaid: order.totalAmount,
        debitAmount:order.totalAmount,
        debitDate: new Date().toJSON().slice(0, 10).replace(/-/g, "-"),
      }
    } else {
       orderObj = {
        orderId:order._id,
        orderDate: order.date,
        paymentMethod: order.paymentMethod,
        products: order.products,
        orderStatus: order.status,
        amountPaid: order.totalAmount,
        creditAmount:order.totalAmount,
        creditDate: new Date().toJSON().slice(0, 10).replace(/-/g, "-"),
      }
    }
    
    return new Promise(async(resolve, reject) => {
      let walletHistory =await db.get().collection(collection.WALLET_COLLECTION).findOne({ user: objectId(userId) })
      if (walletHistory) {
        console.log("in if condition");
        db.get().collection(collection.WALLET_COLLECTION).updateOne({ user: objectId(userId) }, {
          $push: {
            orderDetails:orderObj
          }
        }).then((response) => {
          resolve()
        })
      } else {
        console.log("in Else");
        let walletObj = {
          user: objectId(userId),
          orderDetails:[orderObj]
        }
        db.get().collection(collection.WALLET_COLLECTION).insertOne(walletObj).then((response) => {
          
        })
        
      }
      
    })
    
  },

  getWalletHistory: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.WALLET_COLLECTION).findOne({ user: objectId(userId) }).then((data) => {
        resolve(data)
      })
    })
  }
  
    
 
};
