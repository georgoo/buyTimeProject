module.exports={
    
    ifEquals:(value1,value2,options)=>{
    
    
        if(value1==value2){
           
           return options.fn() 
        }else{
            
            return options.inverse();   
        }
  },
  
  ifNotEquals: (value1, value2, options) => {
    console.log("kkkkkkkkkkkkkkkkkkkkk",value1, value2);
    if(value1!=value2){
           
      return options.fn() 
   }else{
       
       return options.inverse();   
   }
    
  },

    indexing:(index,page,limit)=>{
      console.log("kjk");
      console.log(index ,page ,limit);
      if(page&&limit){
        return ((parseInt(page)-1)*limit)+parseInt(index)+1
      }else{
        return parseInt(index)+1;
      }
  },
  wishlistHeartIcon: (productId, wishlistArray, options) => {
    if (wishlistArray!=null) {
        function doesAnyWishlistIdMatch(wishlist){
            return productId.toString() == wishlist.item
        }
        if(wishlistArray.some(doesAnyWishlistIdMatch)){
            return options.fn()
        }else{
            return options.inverse();   
        }
    }else{
        return options.inverse();   
    }
    
},
    
    
   
    
    
    }