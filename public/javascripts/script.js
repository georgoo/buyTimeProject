// const { response } = require("../../app")

function addToCart(proId){
        $.ajax({
            url:'/add-to-cart'+proId,
            method:'get',
            
            success:(response)=>{
                
                alert(response)
            }
        })
}

function removeFromCart(proId){
    $.ajax({
        url:'/removeFromCart/'+proId,
        method:'get',

        success:(response)=>{
            alert(response)
        }
    })
}

function addToWishList(proId){
    $.ajax({
        url:'/add-to-wishlist'+proId,
        method:'get',
        success:(response=>{
            
        })
    })
}
