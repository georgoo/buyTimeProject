
function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
                 
                swal("Item Added TO Cart", "", "success");
            }
            
        }
    })
}

function removeFromCart(proId){
    $.ajax({
        url:'/removeFromCart/'+proId,
        method:'get',
        success:(response)=>{
            // alert(response)
            if(response.status){
                document.getElementById('wish'+proId).style.display = 'none'
                document.getElementById('total').innerHTML = response.total
                if (response.total=="") {
                    location.reload()
                }
            }
        }
    })
}

function addToWishList(proId){
    $.ajax({
        url:'/add-to-wishlist/'+proId,
        method:'get',
        success: (response => {
            if (document.getElementById('wishlistColor'+proId).style.color == 'red') {
                document.getElementById('wishlistColor'+proId).style.color='white'
            } else {
                document.getElementById('wishlistColor'+proId).style.color='red'
            }
        })
    })
}

// const icon = document.querySelector('.fa-heart');

// icon.addEventListener('click', () => {
//   icon.classList.toggle('selected');
// });


