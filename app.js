let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let userRouter = require('./routes/user');
let adminRouter = require('./routes/admin');
let expbs = require('express-handlebars');
let Handlebars = require('handlebars');
let app = express();
// let fileUpload=require('express-fileupload')
const hbsHelpers=require('./helpers/hbsHelpers')

const hbs = expbs.create({
  extname:'hbs',defaultLayout:'layout',
  layoutsDir:__dirname+'/views/layout/',
  partialsDir:__dirname+'/views/partials/',
  
  helpers:{
    ifEquals: hbsHelpers.ifEquals,
    indexing: hbsHelpers.indexing,
    ifNotEquals:hbsHelpers.ifNotEquals
  }
})

let db=require('./config/connection')
let session=require('express-session')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
app.use(session({secret:"key",cookie:{maxAge:600000},resave: true,saveUninitialized: true}))

Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

db.connect((err)=>{
  if(err)console.log("Connection error"+err);
  else console.log("Database Connected to port 27017");
})

app.use((req,res,next)=>{
  res.set('cache-control','no-store')
  next()
})

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
