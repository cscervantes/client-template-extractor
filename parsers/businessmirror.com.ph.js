var url = require('url').parse
var request = require('request')
var S = require('string')
var cheerio = require('cheerio')
const puppeteer = require('puppeteer')
var truncatise = require('truncatise')
var Tokenizer = require('sentence-tokenizer');
var tokenizer = new Tokenizer('Chuck');
var moment = require('moment')
exports.ArticleLink = (data, cb) => {
    try{
      request(data.url, function(error, response, body){
        if(error){
            return cb(null, error)
        }else{
            var $ = cheerio.load(body)
            var hrefs = []
            var ahrefs = []
            $(data.selector).each(function(i, e){
              
                var ref = $(e).attr('href')
                if(ref && ref !== '#'){
                  // console.log(S(S(ref).chompLeft('/').s).ensureLeft(`${url(data.url).protocol}//${url(data.url).hostname}/`).s)
                  hrefs.push(ref)
                  // console.log(ref)
                }
                  
            })
            var hrefs2 = []
            $('div[class="td-ss-main-content"] a').each(function(i, e){
              
                var ref = $(e).attr('href')
                if(ref && ref !== '#'){
                  // console.log(S(S(ref).chompLeft('/').s).ensureLeft(`${url(data.url).protocol}//${url(data.url).hostname}/`).s)
                //   hrefs.push(ref)
                  hrefs2.push(ref)
                }
                  
            })
            var new_hrefs = Array.from(new Set(hrefs.concat(hrefs2)))
            for(var i = 0; i < new_hrefs.length; i++){
                
                var href = S(new_hrefs[i]).splitLeft('/')
                if(href.length < 6 || S(new_hrefs[i]).contains('/category/') || S(new_hrefs[i]).contains('/author/') || S(new_hrefs[i]).contains('facebook.com') || S(new_hrefs[i]).contains('twitter.com') || S(new_hrefs[i]).contains('instagram.com')){
                    continue
                }else{
                //   console.log(new_hrefs[i])
                    ahrefs.push(new_hrefs[i])
                }
            }
            
            return cb(null, ahrefs.splice(1, 4))
        }
    })
    }catch(e){
        return cb(null, e)
    }
}

exports.ArticleContent = (data, cb) => {
  var jsonBody = {}
  jsonBody.article_link = data.article_link
  jsonBody.section = data.section
  jsonBody.pub_name = data.pub_name
  try{
    request(data.article_link, function(error, response, body){
      if(error){
        return cb(null, error)
      }else{
        var opts = {
          TruncateLength: 5,
          TruncateBy : "paragraphs",
          Strict : false,
          StripHTML : true,
          // Suffix : ' (Read More)'
          Suffix: ''
        }
        var $ = cheerio.load(body)
        var article_title = $('article h1.entry-title').html()
        // var article_published = JSON.parse($('script[type="application/ld+json"]').html())
        // var uncleaneDate = S($('script[type="application/ld+json"]').html()).decodeHTMLEntities().s
        // var article_published = S(uncleaneDate).between('"datePublished": "', '",').s
        var article_published = $('article header time.entry-date').attr('datetime')
        var ignoreSelector = [
          'div[class="td-post-header"]', 'div[id="billboard_article"]', '*:empty', 'div.abh_box',
          'div[class="uk-grid uk-grid-large uk-margin-bottom"]', 'div[class^="google-auto-placed"]',
          'p[style="color:#989898;font-size:14px;"]', 'div[id="related_block"]', 'div[class^="adsbymahimeta"]',
          'div.facebook-philstar-embed', '#inserted_instream', '#inserted_mrec', 'div[class="uk-visible-small uk-margin-top uk-margin-bottom"]',
          'div[class="teads-adCall"]', 'div[id="article-new-featured"]', 'div#related_post',  'div#disqus_thread',
          'div[id="rn-lbl"]', 'div[id^=read-next]', '#article_social_trending', 'header', 'div[class^="addtoany_share_save_container"]',
          '#article_disclaimer', '#article_tags', '.-ob-div', '#lsmr-lbl', 'footer',
          '#lsmr-wrap', '#ch-follow-us', '.view-comments', ,'script', 'noscript', 'style'
        ]

        ignoreSelector.forEach(function(element){
          $(element).remove()
        })
        
        var raw_html = $('article[id^=post-]').html()
        var image = $('article img').attr('src')
        // tokenizer.setEntry(S(S(S(article_text).decodeHTMLEntities().s).stripTags().s).collapseWhitespace().s)        
        // console.log($('article[id="article_level_wrap"] div[id="article_content"] img'))
        jsonBody.article_title = S(S(article_title).decodeHTMLEntities().s).collapseWhitespace().s
        jsonBody.article_published = moment(new Date(article_published)).utc().format('LLLL')
        // jsonBody.article_published = article_published
        jsonBody.article_image = image || null
        // jsonBody.article_raw = article_text
        // jsonBody.article_text = tokenizer.getSentences().map(v=>S(v).collapseWhitespace().s).join('\n\n')
        jsonBody.article_text = `<div>${raw_html}</div>`      
        return cb(null, jsonBody)
      }
    })
  }catch(e){
    return cb(null, e)
  }
}

