var request = require('request')
var S = require('string')
var cheerio = require('cheerio')
var Tokenizer = require('sentence-tokenizer');
var tokenizer = new Tokenizer('Chuck');
var moment = require('moment')
exports.ColumnLinks = (data, cb) => {
    request(data.c_link, function(error, response, body){
        if(error){
            return cb(null, error)
        }else{
            var $ = cheerio.load(body)
            var hrefs = []
            var ahrefs = []
            $('div[id="inq-channel-left"] a').each(function(i, e){
                hrefs.push($(e).attr('href'))    
            })

            var new_hrefs = Array.from(new Set(hrefs))
            for(var i = 0; i < new_hrefs.length; i++){
                if(new_hrefs[i] == '#' || S(new_hrefs[i]).contains('/authors/')){
                    continue
                }else{
                    ahrefs.push(new_hrefs[i])
                }
            }
            return cb(null, ahrefs.splice(0, 1))
        }
    })
}

exports.ColumnArticle = (data, cb) => {
    var jsonBody = {}
    request(data.c_link, function(error, response, body){
        if(error){
            return cb(null, error)
        }else{
            var $ = cheerio.load(body)
            var article_title = $('h1.entry-title').html()
            var uncleaneDate = S($('script[type="application/ld+json"]').eq(-1).html()).decodeHTMLEntities().s
            var article_published = S(uncleaneDate).between('"datePublished": "', '",').s
            var ignoreSelector = [
            'div[id="art-head-group"]', 'div[id="billboard_article"]', '*:empty', 'figure',
            'p[style="color:#989898;font-size:14px;"]', 'p:last-child',
            'div[class="teads-adCall"]', 'div[id="article-new-featured"]',
            'div[id="rn-lbl"]', 'div[id^=read-next]', '#article_social_trending',
            '#article_disclaimer', '#article_tags', '.-ob-div', '#lsmr-lbl',
            '#lsmr-wrap', '#ch-follow-us', '.view-comments', ,'script', 'noscript', 'style'
            ]
            ignoreSelector.forEach(function(element){
            $(element).remove()
            })
        
            var raw_html = $('article[id="article_level_wrap"]').html()
            var content = raw_html
            // tokenizer.setEntry(S(S(S(content).decodeHTMLEntities().s).stripTags().s).collapseWhitespace().s)
            jsonBody.article_title = S(S(article_title).decodeHTMLEntities().s).collapseWhitespace().s
            // jsonBody.article_published = article_published
            jsonBody.article_published = moment(new Date(article_published)).utcOffset(-8).format('LLLL')            
            jsonBody.article_image = data.c_img
            jsonBody.article_link = data.c_link
            jsonBody.article_author = data.c_author
            // jsonBody.article_text = tokenizer.getSentences().map(v=>S(v).collapseWhitespace().s).join('\n\n')
            jsonBody.article_text = `<div>${raw_html}</div>`
            return cb(null, jsonBody)
        }
    })
}
