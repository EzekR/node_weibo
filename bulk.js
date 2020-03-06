const db = require('./db');
const crawler = require('./user_crawler');
const request = require('request');
const moment = require('moment');

let cache_ids = async () => {
    try {
        let _ids = await db.get_skimmed_ids('id5_skim');
        _ids.forEach((_id) => {
            db.r_client.rpush('target_ids', JSON.stringify(_id), (err, result) => {
                console.log(err || result);
            });
        })
        //db.push_ids(_ids).then((result) => {
        //    console.log('push id to redis:', result);
        //}).catch((err) => {
        //    console.log('redis error:', err);
        //})
    } catch (e) {
        console.log('mysql error:', e);
    }
}

let get_proxy = async (number) => {
    return new Promise((resolve, reject) => {
        let proxy_api = `http://183.129.244.16:88/open?user_name=stefrenap1&timestamp=1583490225&md5=CA76FDEFE4FE1745054C44E76E7BDFBA&pattern=txt&number=1`;
        request(proxy_api, (err, resp, body) => {
            if (err) reject(err);
            console.log(body);

            resolve(body.split('\n')[4]);
        })
    })
}

let get_cookie = async () => {
    return new Promise((resolve, reject) => {
        db.r_client.lindex('cookies_array', 0, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    })
}

let crawl_pages = async (page_number, url, cookie, agent, proxy) => {
    return new Promise((resolve, reject) => {
        let _promise = [];
        let _crawler = new crawler();
        for(let i=1; i<page_number; i++) {
            _promise.push(_crawler.get_html(url+'?filter=1&page='+i, cookie,agent, proxy));
        }
        Promise.all(_promise).then((results) => {
            results.forEach((html) => {
                db.save_data_to_redis('pages', url+'_pagec'+'_'+moment().unix(), html.toString()).then((result) => {
                    console.log(result);
                })
            });
            resolve('finish 3');
        }).catch((err) => {
           reject(err);
           db.record_failed_uris(url);
        })
    })
}

(async () => {
    //cache_ids();
    try {
        let _crawler = new crawler();
        //let _ids = await db.get_skimmed_ids('id5_skim');
        //console.log(_ids.length);
        let _cookie = await get_cookie();
        let _proxy = await get_proxy(1);
        let _agent = await db.get_random_agent_from_redis();
        let _len = await db.get_ids_length();
        // 3 concurrency
        for(let i=0; i<_len; i++) {
            let _id = await db.lpop_first_id();
            _id = JSON.parse(_id);
            try {
                let _loop = await crawl_pages(4, _id.url, _cookie, _agent, _proxy);
                console.log('loop:', _loop);
            } catch (e) {
                console.log(e);
                db.r_client.rpush('cookies_array', _cookie, (err, result) => {
                    console.log(err || result);
                    db.r_client.lpop('cookies_array', async (err, cookie) => {
                        if (err) console.log(err);
                        _cookie = await get_cookie();
                    })
                });
                _proxy = await get_proxy();
                _agent = await db.get_random_agent_from_redis();
            }
            //for(let j=1; j<4; j++) {
            //    //_crawler.get_html(_id.url+'?filter=1&page='+j, _cookie, _agent, _proxy).then((html) => {
            //    //    db.save_data_to_redis('pages', _ids[i].url+'_page'+j+'_'+moment().unix(), html.toString()).then((result) => {
            //    //        console.log(result)
            //    //    }).catch((err) => {
            //    //        console.log(err);
            //    //    })
            //    //}).catch(async (err) => {
            //    //    console.log('crawler error:', err);
            //    //    db.r_client.lpop('cookies_array', async (err, result) => {
            //    //        console.log(err || result);
            //    //        db.r_client.rpush('cookies_array', _cookie, (err, result) => {
            //    //            console.log(err || result);
            //    //        });
            //    //    });
            //    //    _cookie = await get_cookie();
            //    //    _proxy = await get_proxy();
            //    //    _agent = await db.get_random_agent_from_redis();
            //    //});
            //    try {
            //        let html = await _crawler.get_html(_id.url+'?filter=1&page='+j, _cookie, _agent, _proxy);
            //        db.save_data_to_redis('pages', _id.url+'_page'+j+'_'+moment().unix(), html.toString()).then((result) => {
            //            console.log(result);
            //        });
            //    } catch (e) {
            //        console.log(e);
            //        db.r_client.lpop('cookies_array', async (err, result) => {
            //            console.log(err || result);
            //            db.r_client.rpush('cookies_array', _cookie, (err, result) => {
            //                console.log(err || result);
            //            });
            //            _cookie = await get_cookie();
            //            _proxy = await get_proxy();
            //            _agent = await db.get_random_agent_from_redis();
            //        });
            //    }
            //}
        }
    } catch (e) {
       console.log(e);
    }
    console.log('all done');
})();