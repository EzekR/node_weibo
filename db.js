const redis = require('redis');
const mysql = require('mysql');

// initiate redis
let r_client = redis.createClient(6379, '127.0.0.1');
// test redis
r_client.hmset('proxy', {
    'user_agent': '["chrome"]',
    'proxy_index': '0',
    'proxy_list': '["1.1.1.1"]'
}, redis.print);

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '8Uhb9ijn',
    database: 'MBB_weibo_database'
});

module.exports = {

    get_random_agent_from_redis: () => {
        return new Promise((resolve, reject) => {
            r_client.hget('proxy', 'user_agent', (err, result) => {
                if (err) reject(err);
                let agent_list = JSON.parse(result);
                let random = agent_list[Math.floor(Math.random()*agent_list.length)];
                resolve(random);
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

    save_data_to_redis: (set_name, data) => {
        return new Promise((resolve, reject) => {
            r_client.sadd(set_name, data, (err, result) => {
                if (err) reject(err);
                resolve(result);
            })
        })
    }


}