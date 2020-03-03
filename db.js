const redis = require('redis');
const mysql = require('mysql');
const fs = require('fs');

// initiate redis
let r_client = redis.createClient(6379, '127.0.0.1');
// test redis
//r_client.hmset('proxy', {
//    'user_agent': '["chrome"]',
//    'proxy_index': '0',
//    'proxy_list': '["1.1.1.1"]'
//}, redis.print);

let connection = mysql.createConnection({
    host: '192.168.1.5',
    user: 'root',
    password: '8Uhb9ijn',
    database: 'MBB_weibo_database'
});

// load cookie json
(() => {
    let json = fs.readFileSync('./cookie.json', 'utf-8');
    let cookies = JSON.parse(json).value;
    let cookie_array = [];
    for(let key in cookies) {
        let _array = [];
        let _cookie = JSON.parse(cookies[key]);
        for(let _key in _cookie) {
            let _one = _key+'='+_cookie[_key];
            _array.push(_one);
        }
        cookie_array.push(_array.join('; '));
    }
    console.log(cookie_array);
    r_client.rpush('cookies_array', cookie_array, (err, result) => {
        if (err) console.log(err);
        r_client.set('cookies_index', '0', redis.print);
    });
    let user_agents = ['Mozilla/5.0 (compatible; U; ABrowse 0.6; Syllable) AppleWebKit/420+ (KHTML, like Gecko)', 'Mozilla/5.0 (compatible; U; ABrowse 0.6;  Syllable) AppleWebKit/420+ (KHTML, like Gecko)', 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser 1.98.744; .NET CLR 3.5.30729)', 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser 1.98.744; .NET CLR   3.5.30729)', 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0;   Acoo Browser; GTB5; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1;   SV1) ; InfoPath.1; .NET CLR 3.5.30729; .NET CLR 3.0.30618)', 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; SV1; Acoo Browser; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; Avant Browser)', 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; SLCC1;   .NET CLR 2.0.50727; Media Center PC 5.0; .NET CLR 3.0.04506)', 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; GTB5; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1) ; Maxthon; InfoPath.1; .NET CLR 3.5.30729; .NET CLR 3.0.30618)', 'Mozilla/4.0 (compatible; Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser 1.98.744; .NET CLR 3.5.30729); Windows NT 5.1; Trident/4.0)', 'Mozilla/4.0 (compatible; Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; GTB6; Acoo Browser; .NET CLR 1.1.4322; .NET CLR 2.0.50727); Windows NT 5.1; Trident/4.0; Maxthon; .NET CLR 2.0.50727; .NET CLR 1.1.4322; InfoPath.2)', 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser; GTB6; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1) ; InfoPath.1; .NET CLR 3.5.30729; .NET CLR 3.0.30618)'];
    r_client.rpush('agents_array', user_agents, redis.print);
})();

module.exports = {

    get_random_agent_from_redis: () => {
        return new Promise((resolve, reject) => {
            //r_client.hget('proxy', 'user_agent', (err, result) => {
            //    if (err) reject(err);
            //    let agent_list = JSON.parse(result);
            //    let random = agent_list[Math.floor(Math.random()*agent_list.length)];
            //    resolve(random);
            //})
            r_client.llen('agents_array', (err, len) => {
                if (err) reject(err);
                let random_index = Math.floor(Math.random()*len);
                r_client.lindex('agents_array', random_index, (err, agent) => {
                    if (err) reject(err);
                    resolve(agent);
                })
            })
        })
    },

    get_random_cookie_from_redis: () => {
        return new Promise((resolve, reject) => {
            r_client.get('cookies_index', (err, result) => {
                if (err) reject(err);
                console.log(result);
                r_client.lindex('cookies_array', parseInt(result), (err, _result) => {
                    if (err) rejecti(err);
                    resolve(_result);
                    r_client.llen('cookies_array', (err, len) => {
                        if (parseInt(result) < len - 1) {
                            result = parseInt(result) + 1;
                            r_client.set('cookies_index', result, redis.print);
                        } else {
                            result = 0;
                            r_client.set('cookies_index', result, redis.print);
                            console.log('please refresh cookies pool');
                        }
                    })
                })
            })
        })
    },

    get_proxy: () => {
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
    },

    get_user_id_from_db: (limit, offset) => {
        return new Promise((resolve, reject) => {
            let sql = `select * from zgn_weibo_id limit ${limit} offset ${offset}`;
            connection.connect();
            connection.query(sql, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
            connection.end();
        })
    },

    save_data_to_redis: (map_name, key, data) => {
        return new Promise((resolve, reject) => {
            r_client.hmset(map_name, key, data, (err, result) => {
                if (err) reject(err);
                resolve(result);
            })
        })
    },

    record_failed_uris: (uri) => {
        return new Promise((resolve, reject) => {
            r_client.rpush('failed_uri', uri, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        })
    },

    record_idiots: (url) => {
        return new Promise((resolve,reject) => {
            r_client.rpush('asshole', url, (err, len) => {
                if (err) reject(err);
                resolve(len);
            })
        })
    }

}