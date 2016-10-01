var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var crawlLink = require('./lib/crawl-link.js');
var extractLazada = require('./lib/extract-data-lazada.js');

var url = "http://www.lazada.vn";

new crawlLink()
    .configure(null, null)
    .crawl(url, function (page) {
        console.log(page.url);
        extractLazada(page.body);
    })
