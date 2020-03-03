const request = require('request').defaults({
    //proxy: 'http://223.245.38.117:65309',
    //rejectUnauthorized: false
});
const fs = require('fs');
const redis = require('redis');
const mysql = require('mysql');
const moment = require('moment');
const db = require('./db');
const cheerio = require('cheerio');

//initiate mysql
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '8Uhb9ijn',
    database: 'MBB_weibo_database'
});

// initiate redis
let r_client = redis.createClient(6379, '127.0.0.1');
// test redis
r_client.hmset('proxy', {
    'user_agent': '["chrome"]',
    'proxy_index': '0',
    'proxy_list': '["1.1.1.1"]'
}, redis.print);

// cookie & agent
let cookie = "SCF=AvTgBgYggK293VebdtLE8S3ESHQHmVX3AffiV1G0abAVLAB4LXZNMlWENe4f1UKFZdDT99tWPtnDtdDMUtgEZdk.; SUB=_2A25zVqCBDeRhGeFM4lAX9SzEyjyIHXVQuMDJrDV6PUJbktAKLU7FkW1NQIj27i796YGoXJBDiP57l3FvzBgXauE6; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W5JbI6i0Pb6dq5dilJi3GmU5JpX5KzhUgL.FoME1KzcSKzReK52dJLoIEBLxKMLBoBLBKzLxK.L1KnLBoeLxKqL1h.L12BLxKnL12zLBo2t; SUHB=0BLop1loeSYQQi; _T_WM=87680097880";
let agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36";

function  get_random_agent_from_redis() {
    return new Promise((resolve, reject) => {
        r_client.hget('proxy', 'user_agent', (err, result) => {
            if (err) reject(err);
            let agent_list = JSON.parse(result);
            let random = agent_list[Math.floor(Math.random()*agent_list.length)];
            resolve(random);
        })
    })
}

function get_proxy() {
    return new Promise((resolve, reject) => {
        r_client.hget('proxy', 'proxy_index', (err, result) => {
            if (err) reject(err);
            let _index = parseInt(result);
            r_client.hget('proxy', 'proxy_list', (err, result) => {
                if (err) reject(err);
                resolve(JSON.parse(result)[_index]);
                r_client.hset('proxy', 'proxy_index', _index++, redis.print);
            })
        })
    })
}

function get_user_id_from_db(limit, offset) {
    return new Promise((resolve, reject) => {
        let sql = `select * from zgn_weibo_id limit ${limit} offset ${offset}`;
        connection.connect();
        connection.query(sql, (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
        connection.end();
    })
}

module.exports = class {
    constructor() {
        //
    }

    get_html(url, cookie, agent, proxy) {
        return new Promise(async (resolve, reject) => {
            let random_agent = await db.get_random_agent_from_redis();
            agent = agent || random_agent;
            proxy = proxy || false;
            let options = {
                url: url,
                headers: {
                    'user-agent': agent,
                    'cookie': cookie
                },
            };
            // assume proxy pattern is like 'xxx.xxx.xxx.xxx:port'
            if (proxy) {
                let random_proxy = await db.get_proxy();
                options['host'] = random_proxy.split(':')[0];
                options['port'] = random_proxy.split(':')[1];
            }
            console.log('options:', options);
            request(options, (err, resp, body) => {
                if (err || resp.statusCode != 200) {
                    console.log('error:', err);
                    console.log('crawl html error:', resp.statusCode);
                    console.log('current url:', url);
                    reject(err);
                }
                resolve(body);
            })
        })
    }

    async crawl_to_date(user_id, start_url, target_date, cookie) {
        let _page = 2;
        let _stop = false;
        let _this = this;
        while (!_stop) {
            try {
                let html = await _this.get_html(start_url + '&page=' + _page, cookie);
                console.log('page:', _page);
                console.log('html:', html);
                let time_stamp = moment().unix();
                db.save_data_to_redis('pages',user_id+'_page'+_page+'_'+time_stamp, html.toString()).then((result) => {
                    console.log(result);
                }).catch((err) => {
                    console.log(err);
                });
                let $ = cheerio.load(html);
                let date_list = $('.ct').toArray();
                if (date_list.length > 0) {
                    let _date = date_list[date_list.length - 1].children[0].data.split(' ')[0];
                    if (_date.split('-').length > 1) {
                        if (moment(_date).isBefore(moment(target_date))) {
                            _stop = true;
                        } else {
                            _page++;
                            if (_page >=49) {
                                _stop = true;
                                db.record_idiots(start_url);
                            }
                        }
                    } else {
                        _page++;
                        if (_page >= 49) {
                            _stop = true;
                            db.record_idiots(start_url);
                        }
                    }
                } else {
                    _stop = true;
                }
            } catch (e) {
               console.log(e);
               _stop = true;
               db.record_failed_uris(start_url+'&page='+_page);
            }
        }
    }
}
