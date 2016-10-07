var request = require('request');
var cheerio = require('cheerio');
var Product = require('../models').Product;
var _ = require('underscore');

function extractLazada(body) {
    var $ = cheerio.load(body);
    $('#prodinfo').each(function (i, element) {
        var productCode = $(this).children('#prod_content_wrapper').children('.prod_l_content')
            .children('.prod_cta').children().children('#config_id').attr('value');
        productCode = productCode.toString();

        var productTitle = $(this).children('.prd-header-wrapper').children('.prod_header')
            .children('.prod_header_main').children('.prod_header_title').children('#prod_title').text();
        productTitle = productTitle.replace(/\n/g, ' ');
        productTitle = productTitle.trim();
        var productBrand = $(this).children('.prd-header-wrapper').children('.prod_header')
            .children('.prod_header_main').children('.prod_header_title').children('.prod_header_brand')
            .children('#prod_brand').children().prev().children().text();
        var productDesc = $(this).children('#prod_content_wrapper').children('.prod_l_content')
            .children('.prod_content').children('.prod_details').text();
        productDesc = productDesc.replace(/\n/g, ' ');
        productDesc = productDesc.trim();
        var productPrice = $(this).children('#prod_content_wrapper').children('.prod_l_content')
            .children('#product-price-box').children('.prod_pricebox_price').children('.prod_pricebox_price_final')
            .children('#product_price').text();
        productPrice = parseInt(productPrice);
        var currencyUnit = $(this).children('#prod_content_wrapper').children('.prod_l_content')
            .children('#product-price-box').children('.prod_pricebox_price').children('.prod_pricebox_price_final')
            .children('#special_currency_box').text();
        var oldPrice = $(this).children('#prod_content_wrapper').children('.prod_l_content')
            .children('#product-price-box').children('.prod_pricebox_price').children('#special_price_area')
            .children('.price_erase').text();
        oldPrice = oldPrice.replace(/\./g, '');
        oldPrice = parseInt(oldPrice);

        var product = {
            code: productCode,
            title: productTitle,
            brand: productBrand,
            description: productDesc,
            price: productPrice,
            oldPrice: oldPrice,
            currency: currencyUnit
        }

        Product.create(product).then(function (product) {
            console.log(product)
        }).catch(function (err) {
            console.log(err);
        })
    });
}

module.exports = extractLazada;