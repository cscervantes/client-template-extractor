var url = require('url').parse
var request = require('request')
var S = require('string')
var cheerio = require('cheerio')
const puppeteer = require('puppeteer')
var truncatise = require('truncatise')
var Tokenizer = require('sentence-tokenizer');
var tokenizer = new Tokenizer('Chuck');
exports.ArticleLink = (data, cb) => {
    try{
      if(process.platform === 'win32'){
        puppeteer.launch().then(async browser => {
          const page = await browser.newPage();
              await page.setExtraHTTPHeaders({Referer: data.referer}) 
              // await page.goto(data.url, {waitUntil: 'networkidle0', timeout: 50000});
              await page.goto(data.url, {timeout: 59000});
              await page.waitForSelector('ul#grid_thumbnail_stories');
              const stories = await page.evaluate((raw_data) => {
                const links = Array.from(document.querySelectorAll(raw_data.selector))
                const filtered = links.map(link => link.href)
                let hrefs = []
  
                for(var i=0; i < filtered.length; i++){
                  let href = filtered[i].split('/')
                  if(href.length > 7 && !href.includes('www.facebook.com') && !href.includes('twitter.com') && !href.includes('instagram.com')){
                    hrefs.push(filtered[i])
                  }else{
                    continue
                  }
                }
  
                // if(raw_data.section == 'headlines'){
                //   return Array.from(new Set(hrefs)).slice(0,2)
                // }else{
                //   return Array.from(new Set(hrefs)).slice(0,1)
                // }
                return Array.from(new Set(hrefs)).slice(0,4)
                
              }, data)
                await browser.close();
                return cb(null, stories)
        });
      }else{
        puppeteer.launch().then(async browser => {
          const page = await browser.newPage();
              await page.setExtraHTTPHeaders({Referer: data.referer}) 
              // await page.goto(data.url, {waitUntil: 'networkidle0', timeout: 50000});
              await page.goto(data.url, {timeout: 59000});
              await page.waitForSelector('ul#grid_thumbnail_stories');
              const stories = await page.evaluate((raw_data) => {
                console.log(raw_data)
                const links = Array.from(document.querySelectorAll(raw_data.selector))
                const filtered = links.map(link => link.href)
                let hrefs = []
  
                for(var i=0; i < filtered.length; i++){
                  let href = filtered[i].split('/')
                  if(href.length > 7 && !href.includes('www.facebook.com') && !href.includes('twitter.com') && !href.includes('instagram.com')){
                    hrefs.push(filtered[i])
                  }else{
                    continue
                  }
                }
  
                // if(raw_data.section == 'headlines'){
                //   return Array.from(new Set(hrefs)).slice(0,2)
                // }else{
                //   return Array.from(new Set(hrefs)).slice(0,1)
                // }
                return Array.from(new Set(hrefs)).slice(0,4)
                
              }, data)
                await browser.close();
                return cb(null, stories)
        });
      }
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
        var raw_html = JSON.parse($('script[type="application/ld+json"]').html())
        var article_text = raw_html.articleBody
        tokenizer.setEntry(S(S(S(article_text).decodeHTMLEntities().s).stripTags().s).collapseWhitespace().s)        
        var article_title = S(S(raw_html.headline).decodeHTMLEntities().s).collapseWhitespace().s
        var article_published = raw_html.datePublished
        jsonBody.article_title = S(article_title).splitLeft(' | ')[0]
        jsonBody.article_published = article_published
        jsonBody.article_image = null
        // jsonBody.article_raw = article_text
        jsonBody.article_text = tokenizer.getSentences().map(v=>S(v).collapseWhitespace().s).join('\n\n')
        return cb(null, jsonBody)
      }
    })
  }catch(e){
    return cb(null, e)
  }
}