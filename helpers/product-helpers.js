// const { response } = require('../app');
const collection = require('../config/collection');
let db=require('../config/connection')
let objectId=require('mongodb').ObjectId

module.exports={

    addproduct:async(product,cb)=>{
        product.Price = parseInt(product.Price)
        product.Stock = parseInt(product.Stock)
        product.createdAt= new Date()
        if (product.productOfferPercentage) {
            product.productOfferPercentage = parseInt(product.productOfferPercentage)
            product.productOffer=true
        } else {
            product.productOfferPercentage = 0
            product.productOffer=false
        }
        let categoryName = product.category
        category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: categoryName })
        if(category.categoryOffer){
            product.categoryOfferPercentage = parseInt(category.categoryOffer)
            product.categoryOffer=true
        } else {
            product.categoryOfferPercentage = 0
            product.categoryOffer=false
        }
        let brandName = product.brand
        brand = await db.get().collection(collection.BRAND_COLLECTION).findOne({ name: brandName })
        if (brand.brandOffer) {
            product.brandOfferPercentage = parseInt(brand.brandOffer)
            product.brandOffer=true
        }else {
            product.brandOfferPercentage = 0
            product.brandOffer=false
        }
        if (product.productOfferPercentage==0&&product.categoryOfferPercentage==0&&product.brandOfferPercentage==0) {
            
            product.offers = false
        } else {
            product.offers = true
        }

        if (product.productOffer == true && product.categoryOffer == false && product.brandOffer==false) {
            product.higherOfferPercentage=product.productOfferPercentage
        } else if (product.categoryOffer == true && product.productOffer == false && product.brandOffer==false) {
            product.higherOfferPercentage=product.categoryOfferPercentage
        } else if (product.brandOffer==true && product.productOffer == false && product.categoryOffer == false ) {
            product.higherOfferPercentage=product.brandOfferPercentage
         }

        
        if (product.productOfferPercentage == product.categoryOfferPercentage && product.brandOfferPercentage) {
            product.higherOfferPercentage= product.productOfferPercentage
        }else if (product.productOfferPercentage > product.categoryOfferPercentage &&product.productOfferPercentage > product.brandOfferPercentage) {
                product.higherOfferPercentage=product.productOfferPercentage
            }else if (product.categoryOfferPercentage > product.productOfferPercentage && product.categoryOfferPercentage > product.brandOfferPercentage) {
                product.higherOfferPercentage=product.categoryOfferPercentage
            }else if (product.brandOfferPercentage > product.categoryOfferPercentage && product.brandOfferPercentage > product.productOfferPercentage) {
                product.higherOfferPercentage=product.brandOfferPercentage
            }
        
        if (product.higherOfferPercentage) {
            product.Price= Math.round(product.Price-(product.higherOfferPercentage/100)*product.Price)
            
        }
        db.get().collection('product').insertOne(product).then((data)=>{
            cb(data.insertedId)
        })
    },

    getAllProducts: (limit, startIndex) => {
        limit = parseInt(limit)
        startIndex=parseInt(startIndex)
        return new Promise(async (resolve, reject) => {
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({createdAt:-1}).limit(limit).skip(parseInt(startIndex)).toArray()
            let brands = await db.get().collection(collection.BRAND_COLLECTION).find().toArray()
            resolve(products,category,brands)  
        })

    },
    getProductsCount: () => {
        return new Promise(async(resolve,reject)=>{
            let count=await db.get().collection(collection.PRODUCT_COLLECTION).count()
            
            console.log("?????");
            console.log(count)
    
            resolve(count)
    
    
        })  
    },

    deleteProduct:(proId)=>{
        return new Promise( (resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)    
            })
        })
    },

    updateProduct: async(proId, proDetails) => {
        console.log(proDetails);

        return new Promise(async (resolve, reject) => {
            let categoryName= proDetails.category
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: categoryName })
            console.log(category._id,"category");
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    Name: proDetails.Name,
                    categoryId: category._id,
                    category:proDetails.category,
                    originalPrice: parseInt(proDetails.Price),
                    Description: proDetails.Description,
                    brand: proDetails.brand,
                    Stock: parseInt(proDetails.Stock),
                    img: proDetails.img,
                }
            }).then(async() => {
                
                if (proDetails.productOfferPercentage) {
                    proDetails.productOfferPercentage = parseInt(proDetails.productOfferPercentage)
                    proDetails.productOffer=true
                } else {
                    proDetails.productOfferPercentage = 0
                    proDetails.productOffer=false
                }
                let categoryId = category._id
                category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id:objectId(categoryId) })
                if(category.categoryOffer){
                    proDetails.categoryOfferPercentage = parseInt(category.categoryOffer)
                    proDetails.categoryOffer=true
                } else {
                    proDetails.categoryOfferPercentage = 0
                    proDetails.categoryOffer=false
                }
                let brandName = proDetails.brand
                brand = await db.get().collection(collection.BRAND_COLLECTION).findOne({ name: brandName })
                if (brand.brandOffer) {
                    proDetails.brandOfferPercentage = parseInt(brand.brandOffer)
                    proDetails.brandOffer=true
                }else {
                    proDetails.brandOfferPercentage = 0
                    proDetails.brandOffer=false
                }
                if (proDetails.productOfferPercentage==0&&proDetails.categoryOfferPercentage==0&&proDetails.brandOfferPercentage==0) {
                    
                    proDetails.offers = false
                } else {
                    proDetails.offers = true
                }

                 if (proDetails.productOffer == true && proDetails.categoryOffer == false && proDetails.brandOffer==false) {
                    proDetails.higherOfferPercentage=proDetails.productOfferPercentage
                } else if (proDetails.categoryOffer == true && proDetails.productOffer == false && proDetails.brandOffer==false) {
                    proDetails.higherOfferPercentage=proDetails.categoryOfferPercentage
                } else if (proDetails.brandOffer==true && proDetails.productOffer == false && proDetails.categoryOffer == false ) {
                    proDetails.higherOfferPercentage=proDetails.brandOfferPercentage
                 }

                
                if (proDetails.productOfferPercentage == proDetails.categoryOfferPercentage && proDetails.brandOfferPercentage) {
                    proDetails.higherOfferPercentage= proDetails.productOfferPercentage
                }else if (proDetails.productOfferPercentage > proDetails.categoryOfferPercentage &&proDetails.productOfferPercentage > proDetails.brandOfferPercentage) {
                        proDetails.higherOfferPercentage=proDetails.productOfferPercentage
                    }else if (proDetails.categoryOfferPercentage > proDetails.productOfferPercentage && proDetails.categoryOfferPercentage > proDetails.brandOfferPercentage) {
                        proDetails.higherOfferPercentage=proDetails.categoryOfferPercentage
                    }else if (proDetails.brandOfferPercentage > proDetails.categoryOfferPercentage && proDetails.brandOfferPercentage > proDetails.productOfferPercentage) {
                        proDetails.higherOfferPercentage=proDetails.brandOfferPercentage
                    }
                
                if (proDetails.higherOfferPercentage) {
                    proDetails.Price=  Math.round(proDetails.Price-(proDetails.higherOfferPercentage/100)*proDetails.Price)
                    
                }

                db.get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({ _id: objectId(proId) }, {
                        $set:{
                            Price: parseInt(proDetails.Price),
                            productOffer: proDetails.productOffer,
                            categoryOffer: proDetails.categoryOffer,
                            categoryOfferPercentage: proDetails.categoryOfferPercentage,
                            brandOfferPercentage: proDetails.brandOfferPercentage,
                            brandOffer: proDetails.brandOffer,
                            offers: proDetails.offers,
                            higherOfferPercentage: proDetails.higherOfferPercentage,
                            productOfferPercentage: proDetails.productOfferPercentage,
                            


                    }
                    }).then(() => {
                    
                        resolve()
                })


            })
        })
    },

    addCategory: (category) => {
        if (category.categoryOffer) {
            
            category.categoryOffer=parseInt(category.categoryOffer)
        }
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((response)=>{
                resolve(response)
            })
        })
    },

    getAllCategories:()=>{
        return new Promise(async(resolve,reject)=>{
           let categories =await db.get().collection(collection.CATEGORY_COLLECTION).find().sort({_id:-1}).toArray()
            resolve(categories)
        })
    },
    getCategories:(limit,startIndex)=>{
        return new Promise(async(resolve,reject)=>{
           let categories =await db.get().collection(collection.CATEGORY_COLLECTION).find().sort({_id:-1}).limit(limit).skip(parseInt(startIndex)).toArray()
            resolve(categories)
        })
    },
    getAllCategories:()=>{
        return new Promise(async(resolve,reject)=>{
           let categories =await db.get().collection(collection.CATEGORY_COLLECTION).find().sort({_id:-1}).toArray()
            resolve(categories)
        })
    },
    getCategoryCount: () => {
        return new Promise(async(resolve,reject)=>{
            let count=await db.get().collection(collection.CATEGORY_COLLECTION).count() 
            console.log(count)
            resolve(count)

        })  
    },

    getBrandCount: () => {
        return new Promise(async(resolve,reject)=>{
            let count=await db.get().collection(collection.BRAND_COLLECTION).count() 
            console.log(count)
            resolve(count)

        })  
        
    },

    getCouponCount: () => {
        return new Promise(async(resolve,reject)=>{
            let count=await db.get().collection(collection.COUPON_COLLECTION).count() 
            console.log(count)
            resolve(count)

        })  
    },

    getBannerCount: () => {
        return new Promise(async(resolve, reject) => {
            let count=await db.get().collection(collection.BANNER_COLLECTION).count() 
            console.log(count)
            resolve(count)
        })
    },
    getOrderCount: () => {
        return new Promise(async(resolve, reject) => {
            let count=await db.get().collection(collection.ORDER_COLLECTION).count() 
            console.log(count)
            resolve(count)
        })
    },

    getCategoryDetails: (categoryId) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) })
            resolve(category)
        })
    },
    updateCategory: (categoryId,categoryDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryId) }, {
                $set:{
                    name: categoryDetails.name,
                    description: categoryDetails.description,
                    categoryOffer:categoryDetails.categoryOffer
                    
                }
            }).then((response) => {
                resolve(response)                
            })
            
        })
    },
    addBrand: (brand) => {
        if (brand.brandOffer) {
            
            brand.brandOffer=parseInt(brand.brandOffer)
        }
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION).insertOne(brand).then((response)=>{
                resolve(response)
            })
        })
    },

    getAllBrands:()=>{
        return new Promise(async(resolve,reject)=>{
           let brands =await db.get().collection(collection.BRAND_COLLECTION).find().sort({_id:-1}).toArray()
            resolve(brands)
        })
    },

    getBrands:(limit,startIndex)=>{
        return new Promise(async(resolve,reject)=>{
           let brands =await db.get().collection(collection.BRAND_COLLECTION).find().sort({_id:-1}).limit(limit).skip(parseInt(startIndex)).toArray()
            resolve(brands)
        })
    },

    getBrandDetails: (brandId) => {
        return new Promise(async (resolve, reject) => {
            let brand = await db.get().collection(collection.BRAND_COLLECTION).findOne({ _id: objectId(brandId) })
            resolve(brand)
        }) 
    },
    updateBrand: (brandId,brandDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).updateOne({ _id: objectId(brandId) }, {
                $set:{
                    name: brandDetails.name,
                    description: brandDetails.description,
                    brandOffer:brandDetails.brandOffer
                    
                }
            }).then((response) => {
                resolve(response)                
            })
            
        })
    },

    addBanner:(banner,cb)=>{
        db.get().collection('banner').insertOne(banner).then((data)=>{
            cb(data.insertedId)
        })
    },
    getAllBanners: (limit,startIndex) => {
        return new Promise(async(resolve,reject) => {
          let banners=await  db.get().collection(collection.BANNER_COLLECTION).find().sort({_id:-1}).limit(limit).skip(parseInt(startIndex)).toArray()
                resolve(banners)
           
        })
    },
    getBanners: (limit,startIndex) => {
        return new Promise(async(resolve,reject) => {
          let banners=await  db.get().collection(collection.BANNER_COLLECTION).find().sort({_id:-1}).toArray()
                resolve(banners)
           
        })
    },

    getOrderProductsQuantity: (orderId) => {
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.ORDER_COLLECTION).aggregate([{$match:{_id:objectId(orderId)}},{
                $unwind:'$products'
              },
              {
                $project:{
                  productId:"$products.item",
                    quantity:"$products.quantity"
                }
              },
              ]).toArray().then((response)=>{
           
          
                // console.log(response);
                resolve(response)
                
            })
        })
    },

    updateStockDecrease:({productId,quantity})=>{
        console.log(productId);

        return new Promise(async(resolve, reject)=>{
            console.log('into int');
            console.log(quantity);
            quantity=parseInt(quantity)
    
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},{
                $inc:{Stock: -quantity}
            })
        })
    
    },
    updateStockIncrease: ({ productId, quantity }) => {
        console.log("function called")
        return new Promise((resolve,reject)=>{
              db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)}, {
              $inc: {Stock: quantity}
              }).then(() => {
              resolve()
                console.log("resolved")
              })
    
        })
    },
    
    getPaginatedResult: (page, count) => {
        console.log(page,"page");
        console.log(count,"pag");
        return new Promise(async(resolve, reject) => {
            // const page = parseInt(req.query.page) 
            const limit =7
            const startIndex = parseInt(page - 1) * limit
            const endIndex = page * limit
            const results = {}
            console.log('##');
            console.log(startIndex, endIndex);
            // let userCount = await userHelpers.getUserCount()
            if (endIndex < count) {
              results.next = {
                page: page + 1,
                limit: limit
              }
            }
            
            if (startIndex > 0) {
              results.previous = {
                page: page - 1,
                limit: limit
              }
          
              console.log("stattIndex");
              console.log(startIndex);
            } 

            results.pageCount =Math.ceil(parseInt(count)/parseInt(limit)).toString() 
    results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1)    
    results.currentPage =page.toString()
            
            console.log(results,"lpppppp");
            resolve({limit,startIndex,results})
        })
    },

    getCategoriesForUserSide: (orderIds) => {
        console.log(orderIds,"orderIdsorderIdsorderIds");
        return new Promise(async (resolve, reject) => {
            if (Array.isArray(orderIds)) {
                orderIds.forEach(convert);
                function convert(item, index, arr) {
                    arr[index] = objectId(item)
                }
                console.log("-=-=-=-=-=-=-=-=-=-=-=-=");
                console.log(orderIds);
                console.log("-=-=-=-=-=-=-=-=-=-=-=-=");

                let categories = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                    categoryId: { $in: orderIds }
                }).toArray()
                console.log(categories);
                resolve(categories)
            }else {
                // let filterArray = filterItems;
                let filterData = objectId(orderIds)
                console.log("==========================");
                console.log(filterData);
                console.log("==========================");

                let categories = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                    categoryId: { $in: [filterData] }
                }).toArray()
                console.log(categories);
                resolve(categories)
            }
            
        })
    },

    getCategoryNames: (orderIds) => {
        return new Promise(async (resolve, reject) => {
            if (Array.isArray(orderIds)) {
                orderIds.forEach(convert);
                function convert(item, index, arr) {
                    arr[index] = objectId(item)
                }

                let categoryNames = await db.get().collection(collection.CATEGORY_COLLECTION).find({
                    _id: { $in: orderIds }
                }).toArray()
                resolve(categoryNames)
            }else {
                // let filterArray = filterItems;
                let filterData = objectId(orderIds)
                let categoryNames = await db.get().collection(collection.CATEGORY_COLLECTION).find({
                    _id: { $in: [filterData] }
                }).toArray()
                resolve(categoryNames)
            }
            
        })
    }


   

}