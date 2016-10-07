var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var url = require('url');

const DEFAULT_MAX_CONCURRENT_REQUEST = 10;
const DEFAULT_REQUEST_NUMBER_PER_SECOND = 100;

function CrawlLink() {
    this.crawledUrls = [];
    this.currentUrlsToCrawl = [];

    this.maxConcurrentRequest = DEFAULT_MAX_CONCURRENT_REQUEST;
    this.requestNumberPerSecond = DEFAULT_REQUEST_NUMBER_PER_SECOND;

    this.concurrentRequestNumber = 0;
    this.shouldCrawl = function () {
        return true;
    };
}

CrawlLink.prototype.configure = function (options) {
    this.maxConcurrentRequests = (options && options.maxConcurrentRequests) || this.maxConcurrentRequests;
    this.requestNumberPerSecond = (options && options.requestNumberPerSecond) || this.requestNumberPerSecond;
    this.shouldCrawl = (options && options.shouldCrawl) || this.shouldCrawl;

    return this;
}

CrawlLink.prototype.crawl = function (url, callback) {
    // this.originUrl = url;
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
        request(url, function (err, response, body) {

            if (!err && response.statusCode == 200) {
                self.extractPage(url, err, response, body);
            } else {
                self.crawledUrls.push(url);
            }
            self.completedRequest(url);
        })
    }, [url]);
}

CrawlLink.prototype.completedRequest = function (url) {
    this.concurrentRequestNumber--;

    var indexOfUrl = this.currentUrlsToCrawl.indexOf(url);

    this.currentUrlsToCrawl.splice(indexOfUrl, 1);

    if (this.currentUrlsToCrawl.length === 0) {
        this.manager.stop();
    }
}

CrawlLink.prototype.extractPage = function (url, err, response, body) {
    var self = this;
    var lastUrl = response.request.uri.href;
    this.crawledUrls.push(url);

    this.callback({
        url: url,
        err: err,
        response: response,
        body: body
    })

    var links = this.getLinks(lastUrl, body);

    _.each(links, function (link) {
        if (self.allowCrawl(link) && self.shouldCrawl(link)) {
            self.crawlUrl(link);
        }
    })
}

CrawlLink.prototype.allowCrawl = function (url) {
    if ((!_.contains(this.crawledUrls, url)) && (!_.contains(this.currentUrlsToCrawl, url))) {
        return true;
    }
    return false;
}

CrawlLink.prototype.getLinks = function (lastUrl, body) {
    var self = this;

    // delete comment
    body.replace(/<!--.*?-->/g, '');

    // var originUrlRegex = this.originUrl.replace("\/\/", "\\/\\/");
    // var regex = '<a[^>]+?href="(.*?' + originUrlRegex + '|\/).*?"';
    var regex = /<a[^>]+?href=".*?"/gmi;

    // regex = new RegExp(regex, "gmi");

    var links = body.match(regex) || [];
    var urls = _.chain(links)
        .map(function (link) {
            var match = /href=\"(.*?)[#\"]/i.exec(link);

            link = match[1];
            link = url.resolve(lastUrl, link);
            return link;
        })
        .uniq()
        // .filter(this.shouldCrawl)
        .value();

    return urls;
};

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