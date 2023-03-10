const multer= require('multer')

// handle storage using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/product-images')
    },
    filename: (req, file, cb) => {
        cb(null,  Date.now() + '_'+ file.originalname)
    }
});
 const upload = multer({ storage: storage });


// handle storage using multer
const storage2 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/brand-images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() +'_'+file.originalname )
    }
});

 const upload2 = multer({ storage: storage2 });

 // handle storage using multer
const storage3 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/banner-images')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() +'_'+file.originalname)
    }
});

 const upload3 = multer({ storage: storage3 });

 module.exports= {
    upload,
    upload2,
    upload3
};