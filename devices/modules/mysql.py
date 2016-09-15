#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pymysql
import json


class MySQL:

    def __init__(self, user, pw, db, host='127.0.0.1'):
        self._conn = pymysql.connect(host=host, user=user, passwd=pw, db=db)
        self._conn.autocommit(1)
        self._conn.ping(True)

        self._cur = self._conn.cursor(pymysql.cursors.DictCursor)


    def __del__(self):
        if self._cur is not None:
            self._cur.close()

        if self._conn is not None:
            self._conn.close()


    def pq(self, query, args=[]):
        res = self._cur.execute(query, args)
        
        rows = []
        for r in self._cur:
            rows.append(r)
        
        for r in rows:
            for k,v in r.iteritems():
                r[k] = str(v)


        return rows if rows else []
        

    def id(self):
        return self._cur.connection.insert_id()

with open('configs/mysql.json') as raw:
    config = json.load(raw)

def db():
    return MySQL(config['username'], config['password'], config['db'], config['host'])
