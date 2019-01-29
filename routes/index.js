var express = require('express');
var router = express.Router();
var websites = require('../websites')
var columnists = require('../columnists')
var url = require('url').parse
var async = require('async')
var fs = require('fs')
// var slugify = require('slugify')
// var S = require('string')
// var moment = require('moment')
// var officegen = require('officegen');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', data: websites.Websites, columnists: columnists.Columnists });
});

router.post('/scrape', function(req, res, next){
  let selector = req.body.selector
  let scraper = require(`../parsers/${req.body.fqdn}.js`)
  let protocol = url(req.body.article_link).protocol
  let hostname = url(req.body.article_link).hostname
  let referer = `${protocol}//${hostname}/`
  let raw = {
    url: req.body.article_link,
    headless: true,
    referer: referer,
    selector: selector,
    section: req.body.section
  }
  scraper.ArticleLink(raw, function(error, result){
    if(error){
      res.json(error)
    }else{
      var articleLists = []
      var ct = 0
      result.forEach(element => {
        var fqdn = req.body.fqdn
        var raw_element = {}
        raw_element.section = req.body.section
        raw_element.article_link = element
        raw_element.pub_name = req.body.pub_name
        articleLists.push(function(cb){
          setTimeout(function(){
            if(req.body.section === 'headlines'){
              ct++
              scraper.ArticleContent(raw_element, function(ers, result){
                if(ers) throw ers;
                fs.writeFile(`reports/headlines/${fqdn}-${ct}.json`, JSON.stringify(result, null, 4), 'utf-8', function(err){
                  if(err) throw err;
                  console.log(`Saved ${element}`)
                  return cb(null, `Saved ${element}`)
                })
              })
            }else{
              ct++
              scraper.ArticleContent(raw_element, function(ers, result){
                if(ers) throw ers;
                fs.writeFile(`reports/business/${fqdn}-${ct}.json`, JSON.stringify(result, null, 4), 'utf-8', function(err){
                // fs.writeFile(`reports/business/${fqdn}.json`, JSON.stringify(result, null, 4), 'utf-8', function(err){
                  if(err) throw err;
                  console.log(`Saved ${element}`)
                  return cb(null, `Saved ${element}`)
                })
              })
            }
          }, 500)
        })
      });
      async.series(articleLists, function(errs){
        if(errs){
          res.json(errs)
        }else{
          res.json({'message': 'Success'})
        }
      })
    }
  })
})

router.post('/columnists', function(req, res, next){
  var columnScraper = require(`../column_parsers/${req.body.c_crawler}`)
  var params = {}
  columnScraper.ColumnLinks(req.body, function(err, result){
    if(err){
      res.json(err)
    }else{
      params.c_link = result[0]
      params.c_img = req.body.c_img
      params.c_author = req.body.c_author
      columnScraper.ColumnArticle(params, function(err2, result2){
        if(err2){
          res.json(err2)
        }else{
          fs.writeFile(`reports/columnists/${req.body.c_author}.json`, JSON.stringify(result2, null, 4), 'utf-8', function(err3){
            if(err3){
              res.json(err3)
            }else{
              res.json({'message': 'Success'})
            }
          })
        }
      })
    }
  })
})

router.get('/generate/:title', function(req, res, next){
  var params = {}
  async.waterfall([
    function(cb){
      fs.readdir('reports/headlines', function(err, items) {
        if(err){
          res.json(err)
        }else{
          var bLists = []
          items.forEach(element => {
            bLists.push(function(cbW){
              var obj = JSON.parse(fs.readFileSync(`reports/headlines/${element}`, 'utf8'))
              return cbW(null, obj)
            })
          });
          async.series(bLists, function(errHere, results){
            params.headlines = results
            return cb(null, params)
          })
          
        }
      })
    },function(obj1, cb){
      fs.readdir('reports/business', function(err, items) {
        if(err){
          res.json(err)
        }else{
          var bLists = []
          items.forEach(element => {
            bLists.push(function(cbW){
              var obj = JSON.parse(fs.readFileSync(`reports/business/${element}`, 'utf8'))
              return cbW(null, obj)
            })
          });
          async.series(bLists, function(errHere, results){
            // return cb(null,obj1.concat(results))
            params.business = results
            return cb(null,params)
          })
          
        }
      })
    }
    // ,function(obj2, cb){
    //   fs.readdir('reports/columnists', function(err, items) {
    //     if(err){
    //       res.json(err)
    //     }else{
    //       var bLists = []
    //       items.forEach(element => {
    //         bLists.push(function(cbW){
    //           var obj = JSON.parse(fs.readFileSync(`reports/columnists/${element}`, 'utf8'))
    //           return cbW(null, obj)
    //         })
    //       });
    //       async.series(bLists, function(errHere, results){
    //         return cb(null,obj2.concat(results))
    //       })
          
    //     }
    //   })
    // }
  ], function(err, result){
    if(err){
      // res.json(err)
      next(err)
    }else{
      // res.json(result)
      res.render('extract-news', {title: req.params.title, data: result})
    }
  })
  

  

  
})

router.get('/columnpicks', function(req, res, next){
  var params = {}
  async.waterfall([
    function(cb){
      fs.readdir('reports/columnists', function(err, items) {
        if(err){
          res.json(err)
        }else{
          var bLists = []
          items.forEach(element => {
            bLists.push(function(cbW){
              var obj = JSON.parse(fs.readFileSync(`reports/columnists/${element}`, 'utf8'))
              return cbW(null, obj)
            })
          });
          async.series(bLists, function(errHere, results){
            params.columnpicks = results
            return cb(null,params)
          })
          
        }
      })
    }
  ], function(err, result){
    if(err){
      // res.json(err)
      next(err)
    }else{
      // console.log(result)
      // res.json(result)
      res.render('extract-columns', {title: req.params.title, data: result})
    }
  })
})
module.exports = router;
