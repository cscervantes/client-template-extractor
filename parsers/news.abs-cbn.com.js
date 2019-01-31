var url = require('url').parse
var request = require('request')
var S = require('string')
var cheerio = require('cheerio')
const puppeteer = require('puppeteer')
// var truncatise = require('truncatise')
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
                    hrefs.push(S(S(ref).chompLeft('/').s).ensureLeft(`${url(data.url).protocol}//${url(data.url).hostname}/`).s)  
                  }
                    
              })
              var new_hrefs = Array.from(new Set(hrefs))
              for(var i = 0; i < new_hrefs.length; i++){
                  
                  var href = S(new_hrefs[i]).splitLeft('/')
                  if(href.length < 7 || S(new_hrefs[i]).contains('facebook.com') || S(new_hrefs[i]).contains('twitter.com') || S(new_hrefs[i]).contains('instagram.com')){
                      continue
                  }else{
                    // console.log(new_hrefs[i])
                      ahrefs.push(new_hrefs[i])
                  }
              }
              return cb(null, ahrefs.splice(0, 4))
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
        var ignoreSelector = [
          'ul[class="op-related-articles"]', 'div.embed-wrap', 'div[class="iwantbar"]',
          '.op-interactive', '.twitter-tweet', '*:empty',
        ]
        var article_published = $('meta[itemprop="datePublished"]').attr('content')
        ignoreSelector.forEach(function(element){
          $(element).remove()
        })
        var raw_html = $('div[itemprop="articleBody"]').html()
        var raw_image = $('script[type="application/ld+json"]').html()
        var article_text = raw_html
        // tokenizer.setEntry(S(S(S(article_text).decodeHTMLEntities().s).stripTags().s).collapseWhitespace().s)
        var article_title = S(S($('title').html()).decodeHTMLEntities().s).collapseWhitespace().s
        
        // console.log(article_published)
        jsonBody.article_title = S(S(S(article_title).splitLeft(' | ')[0]).decodeHTMLEntities().s).collapseWhitespace().s
        var tempDate = moment(new Date(article_published)).utcOffset(-8).format('LLLL')
        jsonBody.article_published = moment(new Date(tempDate)).add(1, 'days').utcOffset(8).format('LLLL')
        // jsonBody.article_published = article_published
        jsonBody.article_image = S(raw_image).between('"ImageObject","url":"', '",').s || null
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