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
        .set('Authorization', await authHeader(userA.id))
        .send({ title: 'My Note', content: 'Hello world', category: 'Personal', tags: 'test' });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.note.title).to.equal('My Note');
      expect(res.body.note.user_id).to.be.undefined;
    });

    it('rejects note without title', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', await authHeader(userA.id))
        .send({ content: 'No title here' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('rejects invalid category', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', await authHeader(userA.id))
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

    it('sanitizes XSS payloads from note content', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', await authHeader(userA.id))
        .send({
          title: '<script>alert(1)</script>Hi',
          content: '<p>Safe</p><script>alert("x")</script><img src=x onerror=alert(1)><iframe src="https://evil.example"></iframe>',
          category: 'Personal',
        });

      expect(res.status).to.equal(201);
      expect(res.body.note.title).to.not.include('<script>');
      expect(res.body.note.content).to.not.include('<script');
      expect(res.body.note.content).to.not.include('<img');
      expect(res.body.note.content).to.not.include('<iframe');
      expect(res.body.note.content).to.include('<p>Safe</p>');
    });

    it('neutralizes javascript: links in note content', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', await authHeader(userA.id))
        .send({
          title: 'Links',
          content: '<a href="javascript:alert(1)">click</a><a href="https://ok.example">ok</a>',
          category: 'Personal',
        });

      expect(res.status).to.equal(201);
      expect(res.body.note.content).to.not.include('javascript:');
      expect(res.body.note.content).to.include('https://ok.example');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('sanitizes XSS on update too', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Old', content: 'c' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id))
        .send({ title: '<b>Bold</b> Title', content: '<script>evil()</script><em>ok</em>' });

      expect(res.status).to.equal(200);
      expect(res.body.note.title).to.equal('Bold Title');
      expect(res.body.note.content).to.not.include('<script');
      expect(res.body.note.content).to.include('<em>ok</em>');
    });
  });

  describe('GET /api/notes', () => {
    it('returns only the authenticated user\'s notes', async () => {
      await createNoteRow({ userId: userA.id, title: 'Note of A', content: 'a' });
      await createNoteRow({ userId: userA.id, title: 'Note of A 2', content: 'a2' });
      await createNoteRow({ userId: userB.id, title: 'Note of B', content: 'b' });

      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', await authHeader(userA.id));

      expect(res.status).to.equal(200);
      expect(res.body.notes).to.have.length(2);
      expect(res.body.notes.every((n) => n.title.startsWith('Note of A'))).to.be.true;
      expect(res.body.counts.active).to.equal(2);
      expect(res.body.counts.total).to.equal(2);
      expect(res.body.counts.trashed).to.equal(0);
    });

    it('returns empty list for user with no notes', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', await authHeader(userB.id));

      expect(res.status).to.equal(200);
      expect(res.body.notes).to.deep.equal([]);
      expect(res.body.pagination.hasMore).to.be.false;
      expect(res.body.pagination.nextCursor).to.be.null;
      expect(res.body.counts.total).to.equal(0);
    });

    it('excludes full content but includes a plain-text content preview', async () => {
      await createNoteRow({ userId: userA.id, title: 'Preview me', content: '<p>Buy <strong>milk</strong> and eggs.</p>' });
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', await authHeader(userA.id));

      expect(res.status).to.equal(200);
      expect(res.body.notes[0]).to.not.have.property('content');
      expect(res.body.notes[0].contentPreview).to.include('Buy milk and eggs');
      expect(res.body.notes[0].contentPreview).to.not.include('<');
    });

    it('pages through notes with an opaque keyset cursor', async () => {
      for (let i = 1; i <= 12; i += 1) {
        await createNoteRow({ userId: userA.id, title: `Note ${i}`, content: `c${i}` });
      }

      const page1 = await request(app)
        .get('/api/notes?scope=all&limit=5')
        .set('Authorization', await authHeader(userA.id));
      expect(page1.status).to.equal(200);
      expect(page1.body.notes).to.have.length(5);
      expect(page1.body.pagination.hasMore).to.be.true;
      expect(page1.body.pagination.nextCursor).to.be.a('string');

      const page2 = await request(app)
        .get(`/api/notes?scope=all&limit=5&cursor=${page1.body.pagination.nextCursor}`)
        .set('Authorization', await authHeader(userA.id));
      expect(page2.status).to.equal(200);
      expect(page2.body.notes).to.have.length(5);
      expect(page2.body.pagination.hasMore).to.be.true;

      const page3 = await request(app)
        .get(`/api/notes?scope=all&limit=5&cursor=${page2.body.pagination.nextCursor}`)
        .set('Authorization', await authHeader(userA.id));
      expect(page3.status).to.equal(200);
      expect(page3.body.notes).to.have.length(2);
      expect(page3.body.pagination.hasMore).to.be.false;
      expect(page3.body.pagination.nextCursor).to.be.null;

      const ids = [
        ...page1.body.notes,
        ...page2.body.notes,
        ...page3.body.notes,
      ].map((n) => n.id);
      expect(new Set(ids).size).to.equal(12);
    });

    it('filters by scope (active vs trash) and category', async () => {
      const active = await createNoteRow({ userId: userA.id, title: 'Active', content: 'a' });
      const work = await createNoteRow({ userId: userA.id, title: 'Work thing', content: 'w', category: 'Work' });
      await createNoteRow({ userId: userA.id, title: 'Trashed', content: 't', isTrashed: true });

      const activeRes = await request(app)
        .get('/api/notes?scope=active')
        .set('Authorization', await authHeader(userA.id));
      expect(activeRes.body.notes.map((n) => n.title).sort()).to.deep.equal(['Active', 'Work thing']);

      const trashRes = await request(app)
        .get('/api/notes?scope=trash')
        .set('Authorization', await authHeader(userA.id));
      expect(trashRes.body.notes.map((n) => n.title)).to.deep.equal(['Trashed']);

      const workRes = await request(app)
        .get('/api/notes?scope=active&category=Work')
        .set('Authorization', await authHeader(userA.id));
      expect(workRes.body.notes.map((n) => n.id)).to.deep.equal([work.id]);
      expect(activeRes.body.counts.byCategory.Work).to.equal(1);
      expect(activeRes.body.counts.trashed).to.equal(1);
    });

    it('searches title and content server-side', async () => {
      await createNoteRow({ userId: userA.id, title: 'Grocery list', content: 'Buy milk' });
      await createNoteRow({ userId: userA.id, title: 'Meeting notes', content: 'Discuss roadmap' });

      const res = await request(app)
        .get('/api/notes?q=milk')
        .set('Authorization', await authHeader(userA.id));
      expect(res.body.notes).to.have.length(1);
      expect(res.body.notes[0].title).to.equal('Grocery list');
    });

    it('clamps an oversized limit to 100', async () => {
      const res = await request(app)
        .get('/api/notes?limit=9999')
        .set('Authorization', await authHeader(userA.id));
      expect(res.body.pagination.limit).to.equal(100);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('returns own note', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Private', content: 'content' });
      const res = await request(app)
        .get(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id));

      expect(res.status).to.equal(200);
      expect(res.body.note.title).to.equal('Private');
    });

    it('forbids access to another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'content' });
      const res = await request(app)
        .get(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id));

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal('Note not found.');
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .get('/api/notes/abc')
        .set('Authorization', await authHeader(userA.id));

      expect(res.status).to.equal(400);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('updates own note', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Old', content: 'old content' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id))
        .send({ title: 'New', content: 'new content', category: 'Work' });

      expect(res.status).to.equal(200);
      expect(res.body.note.title).to.equal('New');
      expect(res.body.note.category).to.equal('Work');
    });

    it('forbids updating another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'content' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id))
        .send({ title: 'Hacked' });

      expect(res.status).to.equal(404);
    });

    it('rejects invalid category on update', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Old', content: 'content' });
      const res = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id))
        .send({ category: 'BadCategory' });

      expect(res.status).to.equal(400);
    });
  });

  describe('PUT /api/notes/:id/trash and /restore', () => {
    it('moves note to trash and back', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'T', content: 'c' });

      const trashRes = await request(app)
        .put(`/api/notes/${note.id}/trash`)
        .set('Authorization', await authHeader(userA.id));
      expect(trashRes.status).to.equal(200);
      expect(trashRes.body.note.isTrashed).to.be.true;

      const restoreRes = await request(app)
        .put(`/api/notes/${note.id}/restore`)
        .set('Authorization', await authHeader(userA.id));
      expect(restoreRes.status).to.equal(200);
      expect(restoreRes.body.note.isTrashed).to.be.false;
    });

    it('forbids trashing another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'c' });
      const res = await request(app)
        .put(`/api/notes/${note.id}/trash`)
        .set('Authorization', await authHeader(userA.id));
      expect(res.status).to.equal(404);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deletes own note permanently', async () => {
      const note = await createNoteRow({ userId: userA.id, title: 'Doomed', content: 'c' });
      const res = await request(app)
        .delete(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id));

      expect(res.status).to.equal(200);
      const check = await pool.query('SELECT id FROM notes WHERE id = $1', [note.id]);
      expect(check.rows).to.have.length(0);
    });

    it('forbids deleting another user\'s note', async () => {
      const note = await createNoteRow({ userId: userB.id, title: 'Secret', content: 'c' });
      const res = await request(app)
        .delete(`/api/notes/${note.id}`)
        .set('Authorization', await authHeader(userA.id));

      expect(res.status).to.equal(404);
    });

    it('returns 404 for missing note', async () => {
      const res = await request(app)
        .delete('/api/notes/999999')
        .set('Authorization', await authHeader(userA.id));
      expect(res.status).to.equal(404);
    });
  });
});