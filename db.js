const redis = require('redis');
const mysql = require('mysql');
const fs = require('fs');

// initiate redis
let r_client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    //password: '8Uhb9ijn'
});
// test redis
//r_client.hmset('proxy', {
//    'user_agent': '["chrome"]',
//    'proxy_index': '0',
//    'proxy_list': '["1.1.1.1"]'
//}, redis.print);

let connection = mysql.createConnection({
    host: '192.168.0.101',
    user: 'root',
    password: '8Uhb9ijn',
    database: 'MBB_weibo_database'
});

let _ips = `116.17.185.110:22492
59.60.210.68:19710
182.101.243.236:15951
218.87.192.229:19200
117.71.159.169:19538
59.58.59.170:22901
120.5.199.94:19235
117.30.112.185:23952
222.85.50.60:19089
182.108.146.113:16321
218.90.39.120:19157
1.194.86.95:18727
101.206.130.153:19344
114.99.27.160:19434
140.250.189.13:23307
114.239.199.147:21444
27.22.83.120:18759
182.86.29.147:15270
218.91.112.209:15159
114.104.135.129:23190`;

// load cookie json
(() => {
    //r_client.hkeys('pages', (err, result) => {
    //    console.log(result);
    //    fs.writeFileSync('./pages.json', JSON.stringify(result));
    //});
    //let json = fs.readFileSync('./cookies.json', 'utf-8');
    //let cookies = JSON.parse(json).value;
    //let cookie_array = [];
    //r_client.ltrim('proxy_list', 1, 0, redis.print);
    //let _ip_list = _ips.split('\n');
    //console.log(_ip_list);
    //r_client.rpush('proxy_list', _ip_list, redis.print);
    //for(let key in cookies) {
    //    let _array = [];
    //    let _cookie = JSON.parse(cookies[key]);
    //    for(let _key in _cookie) {
    //        let _one = _key+'='+_cookie[_key];
    //        _array.push(_one);
    //    }
    //    cookie_array.push(_array.join('; '));
    //}
    //console.log(cookie_array);
    //r_client.rpush('cookies_array', cookie_array, (err, result) => {
    //    if (err) console.log(err);
    //    r_client.set('cookies_index', '0', redis.print);
    //});
    let user_agents = ['Mozilla/5.0 (compatible; U; ABrowse 0.6; Syllable) AppleWebKit/420+ (KHTML, like Gecko)', 'Mozilla/5.0 (compatible; U; ABrowse 0.6;  Syllable) AppleWebKit/420+ (KHTML, like Gecko)', 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser 1.98.744; .NET CLR 3.5.30729)', 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser 1.98.744; .NET CLR   3.5.30729)', 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0;   Acoo Browser; GTB5; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1;   SV1) ; InfoPath.1; .NET CLR 3.5.30729; .NET CLR 3.0.30618)', 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; SV1; Acoo Browser; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; Avant Browser)', 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; SLCC1;   .NET CLR 2.0.50727; Media Center PC 5.0; .NET CLR 3.0.04506)', 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; GTB5; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1) ; Maxthon; InfoPath.1; .NET CLR 3.5.30729; .NET CLR 3.0.30618)', 'Mozilla/4.0 (compatible; Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser 1.98.744; .NET CLR 3.5.30729); Windows NT 5.1; Trident/4.0)', 'Mozilla/4.0 (compatible; Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; GTB6; Acoo Browser; .NET CLR 1.1.4322; .NET CLR 2.0.50727); Windows NT 5.1; Trident/4.0; Maxthon; .NET CLR 2.0.50727; .NET CLR 1.1.4322; InfoPath.2)', 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; Acoo Browser; GTB6; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1) ; InfoPath.1; .NET CLR 3.5.30729; .NET CLR 3.0.30618)'];
    r_client.rpush('agents_array', user_agents, redis.print);
    //r_client.set('net_lock', '0', redis.print);
    //let proxy_file = fs.readFileSync('./proxy.json', 'utf-8');
    //let proxy = JSON.parse(proxy_file).value;
    //let proxy_array = [];
    //for(let key in proxy) {
    //    proxy_array.push(proxy[key]);
    //}
    //r_client.rpush('proxy_list', proxy_array, redis.print);
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

    get_new_cookie: () => {
        return new Promise((resolve, reject) => {
            r_client.lpop('cookies_array', (err, value) => {
                if (err) reject(err);
                r_client.rpush('cookies_used', value, redis.print);
                resolve(value);
            })
        })
    },

    get_proxy: () => {
        return new Promise((resolve, reject) => {
            //r_client.hget('proxy', 'proxy_index', (err, result) => {
            //    if (err) reject(err);
            //    let _index = parseInt(result);
            //    r_client.hget('proxy', 'proxy_list', (err, result) => {
            //        if (err) reject(err);
            //        resolve(JSON.parse(result)[_index]);
            //        r_client.hset('proxy', 'proxy_index', _index++, redis.print);
            //    })
            //})
            r_client.llen('proxy_list', (err, len) => {
                if (err) reject(err);
                let random_index = Math.floor(Math.random()*len);
                r_client.lindex('proxy_list', random_index, (err, proxy) => {
                    if (err) reject(err);
                    resolve(proxy);
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

    get_random_users_from_db: (limit) => {
        return new Promise((resolve, reject) => {
            let sql = `select * from zgn_weibo_id order by rand() limit ${limit}`;
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
    },

    set_net_lock: (lock) => {
        return new Promise((resolve, reject) => {
            r_client.set('net_lock', lock, (err, result) => {
                if (err) reject(err);
                resolve(result);
            })
        })
    },

    get_net_lock: () => {
        return new Promise((resolve, reject) => {
            r_client.get('net_lock', (err, lock) => {
                if (err) reject(err);
                resolve(lock);
            })
        })
    },

    get_skimmed_ids: (table) => {
        return new Promise((resolve, reject) => {
            let sql = `select * from ${table}`;
            connection.connect();
            connection.query(sql, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
                connection.end();
            })
        })
    },

    push_ids: (ids) => {
        return new Promise((resolve, reject) => {
            r_client.rpush('target_ids', ids, (err, result) => {
                if (err) reject(err);
                resolve(result);
            })
        })
    },

    get_ids_length: () => {
        return new Promise((resolve, reject) => {
            r_client.llen('target_ids', (err, len) => {
                if (err) reject(err);
                resolve(len);
            })
        })
    },

    lpop_first_id: () => {
        return new Promise((resolve, reject) => {
            r_client.lpop('target_ids', (err, id) => {
                if (err) reject(err);
                resolve(id);
            })
        })
    },

    rpush_id: (id) => {
        return new Promise((resolve, reject) => {
            r_client.rpush('target_ids', (err, len) => {
                if (err) reject(err);
                resolve(len);
            })
        })
    },

    r_client: r_client

}