var express = require('express');
var router = express.Router();
const stripe = require('stripe')

var fs = require('fs');

var Cart = require('../models/cart');
var products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));

router.get('/', function (req, res, next) {
  res.render('index', 
  { 
    title: 'NodeJS Shopping Cart',
    products: products,
    checkout_success_message: null
  }
  );
});

router.get('/add/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  var product = products.filter(function(item) {
    return item.id == productId;
  });
  cart.add(product[0], productId);
  req.session.cart = cart;
  res.redirect('/');
});

router.get('/cart', function(req, res, next) {
  if (!req.session.cart) {
    return res.render('cart', {
      products: null
    });
  }
  var cart = new Cart(req.session.cart);
  res.render('cart', {
    title: 'NodeJS Shopping Cart',
    products: cart.getItems(),
    totalPrice: cart.totalPrice
  });
});

router.get('/remove/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.remove(productId);
  req.session.cart = cart;
  res.redirect('/cart');
});

router.get('/checkout', (req, res) => {
  console.log('checkout')

  

  // Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')('sk_test_4eC39HqLyjWDarjtT1zdp7dc');
var cart = new Cart(req.session.cart ? req.session.cart : {});
let session
const products = cart.getItems()
console.log({products})
console.log(products[0].item)
// res.render('checkout')
const line_items = []
products.forEach( product => {
  line_items.push({
    name: product.item.title,
    description: product.item.description,
    images: ['https://example.com/t-shirt.png'],
    amount: product.price + '00',
    currency: 'usd',
    quantity: product.quantity
  })
})
console.log({line_items})
// res.render('checkout')
if (line_items.length > 0) {
  (async () => {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      success_url: 'http://localhost:3000/checkout_success',
      cancel_url: 'http://localhost:3000/checkout_failed',
    });

    session ? res.render('checkout', {sessionId: session.id}) : res.render('checkout', {sessionId: null, error: 'stopp'})
    
  })();
}

})


router.get('/checkout_success', (req, res) => {
  new Cart({});
  req.session.destroy()
  res.render('index', { checkout_success_message: 'Your purchase was successful. Thank you for Shopping'})
})

router.get('/checkout_failed', (req, res) => {
  res.render('checkout_failed')
})

module.exports = router;
