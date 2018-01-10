var cheerio = require('cheerio');
var http = require('http');
var iconv = require('iconv-lite');
//定义爬取的地址
var getUrl = 'http://tech.163.com/special/it_2016_';
//http://tech.163.com/special/it_2016_03/

var resInfo = [];
var countNum = 2;
var pageIndex = 1;
var saveDatabase = function( newsInfo ) {
     // 引入模块
    var mongoose=require('mongoose');

    // 连接数据库
    mongoose.connect('mongodb://localhost:27017/news')

    // 得到数据库连接句柄
    var db=mongoose.connection;

    //通过 数据库连接句柄，监听mongoose数据库成功的事件
    db.on('open',function(err){
        if(err){
            console.log('数据库连接失败');
            throw err;
        }
        console.log('数据库连接成功')
    })
    //定义表数据结构
    var userModel=new mongoose.Schema({
        newsId:Number,
        title:String,
        imgUrl:String,
        more:String,
        newIntro:String,
        timer:String
    },{
        versionKey:false //去除： - -v
    })
    
    // 将表的数据结构和表关联起来
    // var productModel=mongoose.model('anyname',表的数据结构，表名)
    var userModel=mongoose.model("userList",userModel,"userList");
    // 删除数据
    userModel.remove({},function(err){
     if(err){
         console.log('删除数据失败');
         throw err;
     }
     console.log("删除数据成功");
     insertData();
    })
    //添加数据
    var insertData = function() {
        userModel.insertMany(newsInfo,function(err,result){
            if(err){
                console.log("数据添加失败");
                throw err;
            }
            console.log("****数据添加成功***");
        })
    }
}
var getDetail = function( page ) {
    console.log('正在抓取数据中...');
    page = page < 10 ? '0'+page+'/' : page+'/';
    http.get( getUrl+page, function( res ) {
        var chunks = [];
        res.on('data', function(chunk) {
            chunks.push(chunk);
        });
        res.on('end', function() {
            var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
            var $ = cheerio.load(html, {decodeEntities: false});
            $('.newsList li').each(function ( index, element ) {
                //获取title信息
               var titles = $(element).find('.bigsize>a').text();
               var imgUrl = $(element).find('.newsList-img>img').attr('src');
               var more = $(element).find('.newsDigest>p>a').attr('href');
               var mainIntro = $(element).find('.newsDigest p').clone();
                   mainIntro.find(':nth-child(1)').remove();
               var timer = $(element).find('.sourceDate').text();
                resInfo.push({
                    newsId : pageIndex++,
                    title: titles,
                    imgUrl : imgUrl,
                    more : more,
                    newIntro : mainIntro.text(),
                    timer : timer
                })
            })  
            if(countNum < 5) { //为了方便只爬了两页
                getDetail(++countNum); //递归执行，页数+1
            } else {
                console.log("数据获取完毕！总共爬取"+resInfo.length+"条数据");
                saveDatabase(resInfo);              
            }
        });
    });
}
getDetail(countNum);