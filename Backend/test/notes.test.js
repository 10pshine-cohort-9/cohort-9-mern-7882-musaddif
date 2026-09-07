import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';
import pool, { initSchema, resetDb, createUser, createNoteRow, authHeader, TEST_USER } from './helpers.js';

describe('Notes API', () => {
  let userA;
  let userB;

  before(async () => {
    await initSchema();
  });

  beforeEach(async () => {
    await resetDb();
    userA = await createUser({ name: 'User A', email: 'a@example.com', password: TEST_USER.password });
    userB = await createUser({ name: 'User B', email: 'b@example.com', password: TEST_USER.password });
  });

  describe('POST /api/notes', () => {
    it('creates a note for the authenticated user', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', authHeader(userA.id))
        .send({ title: 'My Note', content: 'Hello world', category: 'Personal', tags: 'test' });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.note.title).to.equal('My Note');
      expect(res.body.note.user_id).to.be.undefined;
    });

    it('rejects note without title', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', authHeader(userA.id))
        .send({ content: 'No title here' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('rejects invalid category', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', authHeader(userA.id))
        .send({ title: 'Bad', content: 'Body', category: 'NonExistent' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ title: 'No auth', content: 'Body' });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/notes', () => {
    it('returns only the authenticated user\'s notes', async () => {
      await createNoteRow({ userId: userA.id, title: 'Note of A', content: 'a' });
      await createNoteRow({ userId: userA.id, title: 'Note of A 2', content: 'a2' });
      await createNoteRow({ userId: userB.id, title: 'Note of B', content: 'b' });

      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', authHeader(userA.id));

      expect(res.status).to.equal(200);
      expect(res.body.notes).to.have.length(2);
      expect(res.body.notes.every((n) => n.title.startsWith('Note of A'))).to.be.true;
    });

    it('returns empty list for user with no notes', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', authHeader(userB.id));

      expect(res.status).to.equal(200);
      expect(res.body.notes).to.deep.equal([]);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('returns own note', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Private', content: 'content' });
      const res = await request(app)
        .get(`/api/notes/${note.id}`)
        .set('Authorization', authHeader(userA.id));

      expect(res.status).to.equal(200);
      expect(res.body.note.title).to.equal('Private');
    });

    it('forbids access to another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'content' });
      const res = await request(app)
        .get(`/api/notes/${note.id}`)
        .set('Authorization', authHeader(userA.id));

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Note not found.');
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .get('/api/notes/abc')
        .set('Authorization', authHeader(userA.id));

      expect(res.status).to.equal(400);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('updates own note', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Old', content: 'old content' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', authHeader(userA.id))
        .send({ title: 'New', content: 'new content', category: 'Work' });

      expect(res.status).to.equal(200);
      expect(res.body.note.title).to.equal('New');
      expect(res.body.note.category).to.equal('Work');
    });

    it('forbids updating another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'content' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', authHeader(userA.id))
        .send({ title: 'Hacked' });

      expect(res.status).to.equal(404);
    });

    it('rejects invalid category on update', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Old', content: 'content' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', authHeader(userA.id))
        .send({ category: 'BadCategory' });

      expect(res.status).to.equal(400);
    });
  });

  describe('PUT /api/notes/:id/trash and /restore', () => {
    it('moves note to trash and back', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'T', content: 'c' });

      const trashRes = await request(app)
        .put(`/api/notes/${note.id}/trash`)
        .set('Authorization', authHeader(userA.id));
      expect(trashRes.status).to.equal(200);
      expect(trashRes.body.note.isTrashed).to.be.true;

      const restoreRes = await request(app)
        .put(`/api/notes/${note.id}/restore`)
        .set('Authorization', authHeader(userA.id));
      expect(restoreRes.status).to.equal(200);
      expect(restoreRes.body.note.isTrashed).to.be.false;
    });

    it('forbids trashing another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'c' });
      const res = await request(app)
        .put(`/api/notes/${note.id}/trash`)
        .set('Authorization', authHeader(userA.id));
      expect(res.status).to.equal(404);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deletes own note permanently', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Doomed', content: 'c' });
      const res = await request(app)
        .delete(`/api/notes/${note.id}`)
        .set('Authorization', authHeader(userA.id));

      expect(res.status).to.equal(200);
      const check = await pool.query('SELECT id FROM notes WHERE id = $1', [note.id]);
      expect(check.rows).to.have.length(0);
    });

    it('forbids deleting another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'c' });
      const res = await request(app)
        .delete(`/api/notes/${note.id}`)
        .set('Authorization', authHeader(userA.id));

      expect(res.status).to.equal(404);
    });

    it('returns 404 for missing note', async () => {
      const res = await request(app)
        .delete('/api/notes/999999')
        .set('Authorization', authHeader(userA.id));
      expect(res.status).to.equal(404);
    });
  });
});