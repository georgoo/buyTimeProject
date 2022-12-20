const collection = require("../config/collection");
require("dotenv").config();
let db = require("../config/connection");
const bcrypt = require("bcrypt");
const { COUPON_COLLECTION } = require("../config/collection");

// const { response } = require('../app');
let objectId = require("mongodb").ObjectId;

const user = {
  email: process.env.adminEmail,
  password: process.env.adminPassword,
};

module.exports = {
  // This is where the admin login
  adminLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};

      if (
        userData.email === user.email &&
        userData.adminpassword === user.password
      ) {
        response.user = user;
        response.status = true;
        resolve(response);
      } else {
        resolve({ status: false });
      }
    });
  },
// To block the user 
  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: { blockStatus: true },
          }
        )
        .then((result) => {
          resolve();
        });
    });
  },
// To unblock the user
  unblockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: { blockStatus: false },
          }
        )
        .then((result) => {
          resolve();
        });
    });
  },
// To get the sales graph
  getTotalSalesGraph: () => {
    return new Promise(async (resolve, reject) => {
      let dailySale = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          // {
          //     $unwind: '$products'

          // },
          {
            $match: {
              status: { $nin: ["canceled"] },
            },
          },
          {
            $group: {
              _id: "$date",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 7,
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ])
        .toArray();

      let monthSales = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          // {
          //     $unwind: '$products'

          // },
          {
            $match: {
              status: { $nin: ["canceled"] },
            },
          },
          {
            $group: {
              _id: "$month",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 12,
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ])
        .toArray();

      let yearlySale = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          
          {
            $match: {
              status: { $nin: ["canceled"] },
            },
          },
          {
            $group: {
              _id: "$year",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 5,
          },
        ])
        .toArray();
      resolve({ dailySale, monthSales, yearlySale });
    });
  },
  // to add coupon
  addCoupon: (coupon) => {
    coupon.percentage = parseInt(coupon.percentage);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne(coupon)
        .then((response) => {
          resolve();
        });
    });
  },
  // To get all the coupons
  getAllCoupons: (limit, startIndex) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .limit(limit)
        .skip(parseInt(startIndex))
        .toArray();
      resolve(coupons);
    });
  },
// To get all the orders
  getAllOrders: (limit, startIndex) => {
    return new Promise(async (resolve, reject) => {
      let allOrders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .limit(limit)
        .skip(parseInt(startIndex))
        .toArray();
      resolve(allOrders);
    });
  },
// To remove the category
  removeCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: objectId(categoryId) })
        .then(() => {
          resolve();
        });
    });
  },
  // To remove the coupon
  removeCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: objectId(couponId) })
        .then(() => {
          resolve();
        });
    });
  },
// To delete the banner
  deleteBanner: (bannerId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .deleteOne({ _id: objectId(bannerId) })
        .then(() => {
          resolve();
        });
    });
  },
// To remove the brand
  removeBrand: (brandId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BRAND_COLLECTION)
        .deleteOne({ _id: objectId(brandId) })
        .then(() => {
          resolve();
        });
    });
  },
// To get the sales report
  getSalesReport: () => {
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();
    return new Promise(async (resolve, reject) => {
      let weeklyReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({
          createdAt: {
            $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
          },
        })
        .toArray();

      let monthlyReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({
          $expr: { $eq: [{ $month: "$createdAt" }, month] },
        })
        .toArray();

      let yearlyReport = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({
          $expr: { $eq: [{ $year: "$createdAt" }, year] },
        })
        .toArray();
      resolve({ weeklyReport, monthlyReport, yearlyReport });
    });
  },
// To update the order status
  updateOrderStatus: (orderId, orderDetails) => {
    return new Promise(async (resolve, reject) => {
      if (orderDetails.status == "delivered") {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: orderDetails.status,
                orderDelivered: true,
              },
            }
          );
        resolve();
      } else {
        await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: orderDetails.status,
              },
            }
          );
        resolve();
      }
    });
  },
  // To get the order details
  getOrderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      orderDetails = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) });
      resolve(orderDetails);
    });
  },
// To get Sales of one day
  getTodaySales: () => {
    newdate = new Date().toJSON().slice(0, 10).replace(/-/g, "-");

    return new Promise(async (resolve, reject) => {
      try {
        let todaySale = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ date: newdate })
          .count();
        resolve(todaySale);
      } catch (err) {
        let error = {};
        error.message = "Something went wrong";
        reject(error);
      }
    });
  },
  // To get all the users
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let allUsers = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .find()
          .count();
        resolve(allUsers);
      } catch (err) {
        let error = {};
        error.message = "Something went wrong";
        reject(error);
      }
    });
  },
// To get the monthly total
  getMonthlyTotal: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let MonthlyTotal = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                status: {
                  $nin: ["cancelled", "returned"],
                },
              },
            },
            {
              $group: {
                _id: "$month",
                totalSaleAmount: { $sum: "$totalAmount" },
              },
            },
            {
              $sort: {
                _id: -1,
              },
            },
            {
              $limit: 1,
            },
            {
              $sort: {
                _id: 1,
              },
            },
          ])
          .toArray();
        resolve(MonthlyTotal);
      } catch (err) {
        let error = {};
        error.message = "Something went wrong";
        reject(error);
      }
    });
  },
// To get the monthly report
  getMonthlyReport: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$month",
              MonthlySaleAmount: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray()
        .then((weekReport) => {
          resolve(weekReport);
        })
        .catch((err) => {
          let error = {};
          error.message = "Something went wrong";
          reject(error);
        });
    });
  },
// To get the yearly report
  getYearlyReport: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$year",
              YearlySaleAmount: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray()
        .then((weekReport) => {
          resolve(weekReport);
        })
        .catch((err) => {
          let error = {};
          error.message = "Something went wrong";
          reject(error);
        });
    });
  },
// To get the payment method count
  getPaymentMethodCount: () => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      response.COD = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$paymentMethod",
              totalSaleAmount: { $sum: "$totalAmount" },
            },
          },
        ])
        .toArray();
      response.RAZORPAY = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$RAZORPAY",
              totalSaleAmount: { $sum: "$totalAmount" },
            },
          },
        ])
        .toArray();
      response.WALLET = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ paymentMethod: "WALLET" })
        .count();
      response.PAYPAL = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ paymentMethod: "PAYPAL" })
        .count();
      console.log(response, "paymentMethodcount");
      resolve(response);
    });
  },
};
