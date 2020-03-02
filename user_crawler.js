const request = require('request');
const fs = require('fs');
const redis = require('redis');
const mysql = require('mysql');
const moment = require('moment');
const db = require('./db');

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
let cookie = 'SCF=AvTgBgYggK293VebdtLE8S3ESHQHmVX3AffiV1G0abAVLAB4LXZNMlWENe4f1UKFZdDT99tWPtnDtdDMUtgEZdk.; SUB=_2A25zVqCBDeRhGeFM4lAX9SzEyjyIHXVQuMDJrDV6PUJbktAKLU7FkW1NQIj27i796YGoXJBDiP57l3FvzBgXauE6; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W5JbI6i0Pb6dq5dilJi3GmU5JpX5KzhUgL.FoME1KzcSKzReK52dJLoIEBLxKMLBoBLBKzLxK.L1KnLBoeLxKqL1h.L12BLxKnL12zLBo2t; SUHB=0BLop1loeSYQQi; _T_WM=87680097880';
let agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36';

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

function get_html(url, cookie, agent, proxy = '') {
    return new Promise((resolve, reject) => {
        let options = {
            url: url,
            headers: {
                'user-agent': agent,
                'cookie': cookie
            },
        };
        // assume proxy pattern is like 'xxx.xxx.xxx.xxx:port'
        if (proxy != '') {
            options['host'] = proxy.split(':')[0];
            options['port'] = proxy.split(':')[1];
        }
        request(options, (err, resp, body) => {
            if (err || resp.statusCode != 200) reject(err);
            resolve(body);
        })
    })
}

// concurrent 10 ids and find out the longest time
(async () => {
    let ids = await get_user_id_from_db(100, 0);
    let start_time = moment();
    ids.forEach((item) => {
        get_html(item.url, cookie, agent).then((html) => {
            let duration = moment()-start_time;
            console.log(duration)
            db.save_data_to_redis('pages', html.toString()).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        }).catch((err) => {
            console.log(err);
            let duration = moment()-start_time;
            console.log(duration)
        });
    })
})()
