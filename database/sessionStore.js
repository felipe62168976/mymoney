// Armazenamento de sessões em SQLite (as sessões sobrevivem a reinicializações do servidor).
const session = require('express-session');

class SQLiteStore extends session.Store {
  constructor(db, { ttl = 7 * 24 * 3600 * 1000 } = {}) {
    super();
    this.ttl = ttl;
    this.q = {
      get: db.prepare('SELECT dados FROM sessoes WHERE sid = ? AND expira > ?'),
      set: db.prepare(
        'INSERT INTO sessoes (sid, dados, expira) VALUES (?, ?, ?) ' +
          'ON CONFLICT(sid) DO UPDATE SET dados = excluded.dados, expira = excluded.expira'
      ),
      del: db.prepare('DELETE FROM sessoes WHERE sid = ?'),
      clean: db.prepare('DELETE FROM sessoes WHERE expira <= ?'),
    };
    this.q.clean.run(Date.now());
    setInterval(() => { try { this.q.clean.run(Date.now()); } catch (_) {} }, 3600 * 1000).unref();
  }
  _exp(sess) {
    const e = sess && sess.cookie && sess.cookie.expires;
    return e ? new Date(e).getTime() : Date.now() + this.ttl;
  }
  get(sid, cb) {
    try { const r = this.q.get.get(sid, Date.now()); cb(null, r ? JSON.parse(r.dados) : null); }
    catch (e) { cb(e); }
  }
  set(sid, sess, cb) {
    try { this.q.set.run(sid, JSON.stringify(sess), this._exp(sess)); cb && cb(null); }
    catch (e) { cb && cb(e); }
  }
  touch(sid, sess, cb) { this.set(sid, sess, cb); }
  destroy(sid, cb) {
    try { this.q.del.run(sid); cb && cb(null); } catch (e) { cb && cb(e); }
  }
}

module.exports = SQLiteStore;
