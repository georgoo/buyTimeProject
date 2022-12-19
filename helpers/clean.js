if (proDetails.productOfferPercentage) {
    proDetails.productOfferPercentage = parseInt(proDetails.productOfferPercentage)
    proDetails.productOffer=true
} else {
    proDetails.productOfferPercentage = null
    proDetails.productOffer=false
}
let categoryName = proDetails.category
category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: categoryName })
if(category.categoryOffer){
    proDetails.categoryOfferPercentage = parseInt(category.categoryOffer)
    proDetails.categoryOffer=true
} else {
    proDetails.categoryOfferPercentage = null
    proDetails.categoryOffer=false
}
let brandName = proDetails.brand
brand = await db.get().collection(collection.BRAND_COLLECTION).findOne({ name: brandName })
if (brand.brandOffer) {
    proDetails.brandOfferPercentage = parseInt(brand.brandOffer)
    proDetails.brandOffer=true
}else {
    proDetails.brandOfferPercentage = null
    proDetails.brandOffer=false
}
if (proDetails.productOfferPercentage==null&&proDetails.categoryOfferPercentage==null&&proDetails.brandOfferPercentage==null) {
    
    proDetails.offers = false
} else {
    proDetails.offers = true
}

if (proDetails.productOffer == true && proDetails.categoryOffer == true) {
    if (proDetails.productOfferPercentage > proDetails.categoryOfferPercentage&&proDetails.productOfferPercentage > proDetails.brandOfferPercentage) {
        proDetails.higherOfferPercentage=proDetails.productOfferPercentage
    } else if (proDetails.categoryOfferPercentage >  proDetails.productOfferPercentage &&proDetails.categoryOfferPercentage > proDetails.brandOfferPercentage) {
        proDetails.higherOfferPercentage=proDetails.categoryOfferPercentage
    } else if( proDetails.brandOfferPercentage > proDetails.categoryOfferPercentage&&proDetails.brandOfferPercentage > proDetails.productOfferPercentage){
        proDetails.higherOfferPercentage=proDetails.brandOfferPercentage
    } else if(proDetails.productOfferPercentage==proDetails.categoryOfferPercentage ==proDetails.brandOfferPercentage){
        proDetails.higherOfferPercentage=proDetails.productOfferPercentage
    }
} else if (proDetails.productOffer == true && proDetails.categoryOffer == false &&proDetails.brandOfferPercentage==false) {
    proDetails.higherOfferPercentage=proDetails.productOfferPercentage
} else if (proDetails.productOffer == false && proDetails.categoryOffer == true&&proDetails.brandOfferPercentage==false) {
    proDetails.higherOfferPercentage=proDetails.categoryOfferPercentage
} else if (proDetails.productOffer == false && proDetails.categoryOffer == false &&proDetails.brandOfferPercentage==true) {
    proDetails.higherOfferPercentage=proDetails.categoryOfferPercentage
}
if (proDetails.higherOfferPercentage) {
    proDetails.Price=proDetails.Price-(proDetails.higherOfferPercentage/100)*proDetails.Price
    
}