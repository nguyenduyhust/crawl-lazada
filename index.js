var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var CrawlLink = require('./lib/crawl-link.js');
// var CrawlData = require('./lib/crawl-data.js');

var url = "http://zalora.vn";

new CrawlLink()
    .configure(null, null)
    .crawl(url, function (page) {
        console.log(page.url);
    })
