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
            $('div[class="tmt-blog-flex tmt-flex less-margin"] a').each(function(i, e){
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
            var title = $('h2.tmt-sub-title').html()
            var datePublished = $('meta[property="article:published_time"]').attr('content')
            
            var ignoreSelector = [
                '.tmt-sub-title', '*:empty', 'div[class="tmt-flex tmt-flex-row tmt-flex-min"]', 'ul#breadcrumb',
                '.tmt-social-share', 'div[class="google-auto-placed ap_container"]', 'div[id^=manil-]',
                '#comments', 'section[class="tmt-other-stories section-block"]', 'section[class="tmt-more-blog section-block"]',
                'aside', 'figure',
            ]

            ignoreSelector.forEach(function(element){
                $(element).remove()
            })

            var raw_html = $('div.article-wrap').html()
            // tokenizer.setEntry(S(S(S(content).decodeHTMLEntities().s).stripTags().s).collapseWhitespace().s)
            jsonBody.article_title = S(S(title).decodeHTMLEntities().s).collapseWhitespace().s
            // jsonBody.article_published = datePublished
            jsonBody.article_published = moment(new Date(datePublished)).utcOffset(8).format('LLLL')
            jsonBody.article_image = data.c_img
            jsonBody.article_link = data.c_link
            jsonBody.article_author = data.c_author
            // jsonBody.article_text = tokenizer.getSentences().map(v=>S(v).collapseWhitespace().s).join('\n\n')
            jsonBody.article_text = `<div>${raw_html}</div>`
            return cb(null, jsonBody)
        }
    })
}
