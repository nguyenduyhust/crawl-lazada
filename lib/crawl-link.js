var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');

const DEFAULT_MAX_CONCURRENT_REQUEST = 10;
const DEFAULT_REQUEST_NUMBER_PER_SECOND = 100;

function CrawlLink() {
    this.crawledUrls = [];
    this.currentUrlsToCrawl = [];

    this.maxConcurrentRequest = DEFAULT_MAX_CONCURRENT_REQUEST;
    this.requestNumberPerSecond = DEFAULT_REQUEST_NUMBER_PER_SECOND;

    this.concurrentRequestNumber = 0;
}

CrawlLink.prototype.configure = function (maxConcurrentRequest, requestNumberPerSecond) {
    if (maxConcurrentRequest) {
        this.maxConcurrentRequest = maxConcurrentRequest;
    }

    if (requestNumberPerSecond) {
        this.requestNumberPerSecond = requestNumberPerSecond;
    }

    return this;
}

CrawlLink.prototype.crawl = function (url, callback) {
    this.originUrl = url;
    this.manager = this.createManager();
    this.manager.start();
    this.callback = callback;

    this.crawlUrl(url);

    return this;
}

CrawlLink.prototype.createManager = function () {
    var self = this;

    return new Manager({
        requestNumberPerSecond: this.requestNumberPerSecond,
        maxConcurrentRequest: this.maxConcurrentRequest,
        canProcess: function () {
            return self.concurrentRequestNumber < self.maxConcurrentRequest;
        }
    });
}

CrawlLink.prototype.crawlUrl = function (url) {
    var self = this;

    this.currentUrlsToCrawl.push(url);

    this.manager.addTask(function (url) {
        self.concurrentRequestNumber++;
        request(url, function (err, response, html) {

            if (response.statusCode == 200) {
                self.callback({
                    url: url,
                    err: err,
                    response: response,
                    html: html
                })
                self.dissectPage(err, response, html);
            }
            self.completedRequest(url);
        })
    }, [url]);
}

CrawlLink.prototype.completedRequest = function (url) {
    this.crawledUrls.push(url);
    this.concurrentRequestNumber--;

    var indexOfUrl = this.currentUrlsToCrawl.indexOf(url);

    this.currentUrlsToCrawl.splice(indexOfUrl, 1);

    if (this.currentUrlsToCrawl.length === 0) {
        this.manager.stop();
    }
}

CrawlLink.prototype.dissectPage = function (err, response, html) {
    var self = this;
    var $ = cheerio.load(html);

    var relativeLinks = $("a[href^='/']");
    relativeLinks.each(function () {
        var link = self.originUrl + $(this).attr('href');

        if ((!_.contains(self.crawledUrls, link)) 
            && (!_.contains(self.currentUrlsToCrawl, link))) {
            self.crawlUrl(link);
        }
    })
}

function Manager(options) {
    this.timeBetweenRequests = (1 / options.requestNumberPerSecond) * 1000;
    this.maxConcurrentRequest = options.maxConcurrentRequest;
    this.isStopped = false;
    this.tasksQueue = [];
    this.canProcess = options.canProcess || function () { return true; }
}

Manager.prototype.start = function () {
    this.loop();
}

Manager.prototype.stop = function () {
    this.isStopped = true;
}

Manager.prototype.addTask = function (func, url) {
    this.tasksQueue.push({
        func: func,
        url: url
    });
}

Manager.prototype.loop = function () {
    var self = this;

    if (this.canProcess()) {
        if (this.tasksQueue.length !== 0) {
            var task = this.tasksQueue.shift();

            task.func.apply(null, task.url);
        }
    }

    if (this.isStopped) {
        return;
    }

    setTimeout(function () {
        self.loop();
    }, this.timeBetweenRequests)
}

module.exports = CrawlLink;